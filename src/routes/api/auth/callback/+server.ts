import { redirect } from "@sveltejs/kit";
import { createSupabaseServer } from "$lib/server/supabaseServer";

export const GET = async ({ url, locals, cookies }) => {
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  console.log("Auth callback started", { code: !!code, next });

  if (!code) {
    console.log("No code provided in callback");
    return redirect(303, "/?error=no_code");
  }

  // Ensure we have a Supabase client
  const supabase = locals.supabase || createSupabaseServer(cookies);

  try {
    console.log("Attempting to exchange code for session");
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Auth callback error:", {
        message: exchangeError.message,
        status: exchangeError.status,
        name: exchangeError.name,
      });
      return redirect(303, "/?error=auth");
    }

    // Verify the user is properly authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("User verification failed:", {
        error: userError,
        hasUser: !!user,
      });
      return redirect(303, "/?error=verification");
    }

    console.log("Successfully authenticated user:", {
      userId: user.id,
      email: user.email,
    });

    return redirect(303, next);
  } catch (error) {
    // Only catch actual errors, not redirects
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 303
    ) {
      throw error;
    }

    console.error("Unexpected auth error:", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : error,
      url: url.toString(),
    });
    return redirect(303, "/?error=unexpected");
  }
};
