import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabaseBrowser } from "../../lib/supabaseBrowserClient";

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
