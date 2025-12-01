// pages/auth/callback.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabaseBrowser } from "../../../lib/supabaseBrowserClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Verifying your session…");

  useEffect(() => {
    const run = async () => {
      if (!supabaseBrowser) {
        setStatus("Auth is not configured.");
        return;
      }

      try {
        // Parse access_token and refresh_token from hash fragment
        const hash = window.location.hash ?? "";
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (!access_token || !refresh_token) {
          console.error("Missing tokens in callback URL", {
            access_token,
            refresh_token,
          });
          setStatus(
            "Could not verify login (missing tokens). Please try again from the login page."
          );
          return;
        }

        // Store the session in Supabase
        const { error: sessionError } = await supabaseBrowser.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sessionError) {
          console.error("setSession error", sessionError);
          setStatus(
            "Could not verify login. Please try again from the login page."
          );
          return;
        }

        // Now the user should be available
        const {
          data: { user },
          error,
        } = await supabaseBrowser.auth.getUser();

        if (error || !user) {
          console.error("Supabase getUser error", error);
          setStatus(
            "Could not verify login. Please try again from the login page."
          );
          return;
        }

        if (typeof window !== "undefined") {
          window.localStorage.setItem("feastfit_user_id", user.id);
        }

        setStatus("Signed in! Redirecting you to search…");
        router.replace("/search");
      } catch (err) {
        console.error(err);
        setStatus("Something went wrong verifying your session.");
      }
    };

    run();
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-6 py-4 text-sm text-slate-200">
          {status}
        </div>
      </div>
    </main>
  );
}
