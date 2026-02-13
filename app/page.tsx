import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import GoogleSignIn from "@/components/GoogleSignIn";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-24">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-center text-neutral-800">
            Smart Bookmark Manager
          </h1>
          <p className="mt-2 text-center text-neutral-800">
            Sign in with Google to manage your bookmarks
          </p>
        </div>

        <GoogleSignIn />
      </div>
    </main>
  );
}
