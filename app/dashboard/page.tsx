import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import { Bookmark, User } from "lucide-react";
import DashboardView from "@/components/DashboardView";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }
  
  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg">
                <Bookmark
                  className="w-7 h-7 text-white border"
                  fill="neutral-800"
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Bookmark Manager
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-semibold text-gray-700">
                  {user.user_metadata?.full_name || "User"}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {user.email}
                </span>
              </div>

              <div className="h-9 w-9 relative rounded-full ring-2 ring-white shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div className="h-6 w-px bg-gray-200 mx-1"></div>

              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      <DashboardView initialBookmarks={bookmarks || []} userId={user.id} />
    </div>
  );
}
