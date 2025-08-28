<!-- routes/auth/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { X } from "lucide-svelte";
  import posthog from "posthog-js";
  import { browser } from "$app/environment";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";

  let { data } = $props();

  const { supabase } = data;

  let isLogin = $state(false);
  let email = $state("");
  let password = $state("");
  let error = $state("");

  const toggleMode = () => {
    isLogin = !isLogin;
    error = "";
    if (browser) {
      posthog.capture("auth_mode_toggle", {
        mode: isLogin ? "login" : "signup",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      if (browser) {
        posthog.capture("auth_google_attempt");
      }
      // Google sign-in logic here using Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${page.url.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      if (browser) {
        posthog.capture("auth_google_success");
      }
    } catch (err: any) {
      error = err.message;
      if (browser) {
        posthog.capture("auth_google_error", {
          error: err.message,
        });
      }
    }
  };
</script>

<div
  class="flex min-h-screen items-center justify-center bg-base-200 px-4 py-12 sm:px-6 lg:px-8"
>
  <div class="w-full max-w-md space-y-8 rounded-lg bg-base-100 p-8 shadow-lg">
    <!-- Header -->
    <div class="text-center">
      <h2 class="text-3xl font-bold">
        {isLogin ? "Welcome back " : "Sign up to start conversing"}
      </h2>
      <p class="mt-2 text-sm text-base-content/70">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button
          onclick={toggleMode}
          class="font-medium text-primary hover:text-primary/80"
        >
          {isLogin ? "Sign up" : "Sign in"}
        </button>
      </p>
      {#if !isLogin}
        <div class="bg-success text-success-content p-4 rounded-lg my-4">
          <div>
            <span class="text-md md:text-lg font-semibold">
              Talk for 2 minutes free — every day, forever.
            </span>
          </div>
          <ul class="mt-2 list-disc pl-5 text-sm text-left">
            <li>Save your conversation history</li>
            <li>Track your progress daily</li>
            <li>Build a lasting learning streak</li>
          </ul>
        </div>
      {/if}
    </div>

    <!-- Error Alert -->
    {#if error}
      <div class="alert alert-error">
        <div class="flex-1">
          <p>{error}</p>
        </div>
        <button onclick={() => (error = "")} class="btn btn-ghost btn-sm">
          <X size={18} />
        </button>
      </div>
    {/if}

    <!-- Form -->
    <form
      method="POST"
      action="?/{isLogin ? 'login' : 'signup'}"
      use:enhance={() => {
        if (browser) {
          posthog.capture("auth_form_submit", {
            method: isLogin ? "login" : "signup",
          });
        }
        return async ({ result, update }) => {
          if (result.type === "error") {
            error = result.error.message;
            if (browser) {
              posthog.capture("auth_form_error", {
                method: isLogin ? "login" : "signup",
                error: result.error.message,
              });
            }
          } else {
            if (browser) {
              posthog.capture("auth_form_success", {
                method: isLogin ? "login" : "signup",
              });
            }
            await update();
          }
        };
      }}
      class="mt-8 space-y-2"
    >
      <div class="space-y-2">
        <!-- Email -->
        <div class="form-control">
          <label class="floating-label">
            <span>Your Email</span>
            <input
              id="email"
              name="email"
              type="email"
              required
              bind:value={email}
              placeholder="example@yourmail.com"
              class="input input-md w-full"
            />
          </label>
        </div>
        <!-- Password -->
        <div class="form-control">
          <label class="floating-label">
            <span>Password</span>
            <input
              id="password"
              name="password"
              type="password"
              required
              bind:value={password}
              placeholder="Enter your password"
              class="input input-md w-full"
            />
          </label>
        </div>
      </div>

      <!-- Submit Button -->
      <button type="submit" class="btn btn-primary w-full">
        {isLogin ? "Sign in" : "Create account"}
      </button>

      <div class="divider">or</div>

      <!-- Social Login -->
      <button
        type="button"
        onclick={() => goto("/auth/google")}
        class="btn btn-secondary w-full gap-2"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>
    </form>
    <div class="mt-2 mb-4 text-xs text-base-content/70 text-center">
      By continuing, you agree to our
      <a href="/terms" class="text-primary hover:underline">Terms of Service</a>
      and
      <a href="/privacy" class="text-primary hover:underline">Privacy Policy</a
      >.
    </div>
  </div>
</div>
