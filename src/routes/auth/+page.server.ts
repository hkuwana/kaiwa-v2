// routes/auth/+page.server.ts
import { fail, redirect } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema/schema";
import { createSession, setSessionTokenCookie } from "$lib/server/auth";

export async function load(event) {
  if (event.locals.session !== null && event.locals.user !== null) {
    return redirect(302, "/");
  }
  return {};
}

export const actions = {
  signup: async (event) => {
    const formData = await event.request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const hashedPassword = encodeHexLowerCase(
      sha256(new TextEncoder().encode(password)),
    );

    const [newUser] = await db
      .insert(table.users)
      .values({
        email,
        hashedPassword,
        authUserId: crypto.randomUUID(),
      })
      .returning();

    const { session, token } = await createSession(newUser.id);
    setSessionTokenCookie(event, token, session.expiresAt);

    throw redirect(302, "/");
  },

  login: async (event) => {
    const formData = await event.request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const user = await db.query.users.findFirst({
      where: and(eq(table.users.email, email)),
    });

    if (!user || !user.hashedPassword) {
      return fail(400, {
        message: "Incorrect email or password",
      });
    }

    const hashedPassword = encodeHexLowerCase(
      sha256(new TextEncoder().encode(password)),
    );
    if (user.hashedPassword !== hashedPassword) {
      return fail(400, {
        message: "Incorrect email or password",
      });
    }

    const { session, token } = await createSession(user.id);
    setSessionTokenCookie(event, token, session.expiresAt);

    throw redirect(302, "/");
  },
};
