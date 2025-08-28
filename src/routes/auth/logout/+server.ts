import { fail, redirect } from "@sveltejs/kit";
import { invalidateSession, deleteSessionTokenCookie } from "$lib/server/auth";

export async function POST(event): Promise<Response> {
  if (event.locals.session === null) {
    return new Response(null, {
      status: 401,
    });
  }
  await invalidateSession(event.locals.session.id);
  deleteSessionTokenCookie(event);
  return redirect(302, "/");
}
