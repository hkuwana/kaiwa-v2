import { google } from "$lib/features/auth/oauth";
import { createSession, setSessionTokenCookie } from "$lib/server/auth";
import { OAuth2RequestError, decodeIdToken } from "arctic";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema/schema";
import { randomUUID } from "crypto";
import { serverLogger } from "$lib/server/serverLogger";

import type { RequestEvent } from "./$types";

interface IdTokenClaims {
  sub: string;
  name: string;
  picture: string;
  email: string;
}

export async function GET(event: RequestEvent): Promise<Response> {
  serverLogger.info("Google OAuth callback received");
  const storedState = event.cookies.get("google_oauth_state") ?? null;
  const codeVerifier = event.cookies.get("google_code_verifier") ?? null;
  const code = event.url.searchParams.get("code");
  const state = event.url.searchParams.get("state");

  if (
    !code ||
    !state ||
    !storedState ||
    !codeVerifier ||
    state !== storedState
  ) {
    serverLogger.error("OAuth callback validation failed", {
      code,
      state,
      storedState,
      codeVerifier,
    });
    return new Response(null, {
      status: 400,
    });
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    serverLogger.info("Successfully validated authorization code", { tokens });
    const claims = decodeIdToken(tokens.idToken()) as IdTokenClaims;
    serverLogger.info("Decoded ID token claims", { claims });
    const googleId = claims.sub;
    const email = claims.email;

    if (!email) {
      serverLogger.error("Email not provided by Google", { claims });
      return new Response("Email not provided by provider.", {
        status: 400,
      });
    }

    serverLogger.info("Looking for existing user with googleId", { googleId });
    const [existingUser] = await db
      .select()
      .from(table.users)
      .where(eq(table.users.googleId, googleId));

    if (existingUser) {
      serverLogger.info("Existing user found", { userId: existingUser.id });
      const { session, token } = await createSession(existingUser.id);
      setSessionTokenCookie(event, token, session.expiresAt);
      serverLogger.info("Session created for existing user", {
        sessionId: session.id,
      });
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      });
    }

    serverLogger.info("No existing user found, creating new user");
    const userId = randomUUID();
    await db.insert(table.users).values({
      id: userId,
      googleId: googleId,
      email: email,
      displayName: claims.name,
      avatarUrl: claims.picture,
    });
    serverLogger.info("New user created", { userId });

    const { session, token } = await createSession(userId);
    setSessionTokenCookie(event, token, session.expiresAt);
    serverLogger.info("Session created for new user", {
      sessionId: session.id,
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  } catch (e) {
    serverLogger.error("Error in Google OAuth callback", e);
    if (e instanceof OAuth2RequestError) {
      return new Response(null, {
        status: 400,
      });
    }
    return new Response(null, {
      status: 500,
    });
  }
}
