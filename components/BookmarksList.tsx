"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { deleteBookmark } from "@/app/actions/bookmarks";
import type { Bookmark as BookMark } from "@/types";
import { Bookmark, ExternalLink, Globe, Loader2, Trash2 } from "lucide-react";

interface BookmarksListProps {
  initialBookmarks: BookMark[];
  userId: string;
  bookmarks: BookMark[];
  setBookmarks: React.Dispatch<React.SetStateAction<BookMark[]>>;
}

export default function BookmarksList({
  initialBookmarks,
  userId,
  bookmarks,
  setBookmarks,
}: BookmarksListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channelName = `user-bookmarks-${userId}`;

    console.log(
      "📡 [BookmarksList] Subscribing to broadcast channel:",
      channelName,
    );

    const broadcastChannel = supabase
      .channel(channelName)
      .on("broadcast", { event: "bookmark_added" }, (payload) => {
        console.log("📥 [BookmarksList] bookmark_added event:", payload);
        const newBookmark = payload.payload.bookmark as BookMark;
        setBookmarks((prev) => {
          // Prevent duplicates
          if (prev.some((b) => b.id === newBookmark.id)) {
            console.log(
              "⏭️ [BookmarksList] Duplicate bookmark ignored:",
              newBookmark.id,
            );
            return prev;
          }
          console.log("✅ [BookmarksList] Adding bookmark:", newBookmark.id);
          return [newBookmark, ...prev];
        });
      })
      .on("broadcast", { event: "bookmark_deleted" }, (payload) => {
        console.log("🗑️ [BookmarksList] bookmark_deleted event:", payload);
        const deletedId = payload.payload.id;
        setBookmarks((prev) => prev.filter((b) => b.id !== deletedId));
      })
      .subscribe((status, err) => {
        console.log(
          "📡 [BookmarksList] Broadcast subscription status:",
          status,
        );
        if (err) console.error("❌ [BookmarksList] Subscription error:", err);
      });

    return () => {
      console.log("🧹 [BookmarksList] Cleaning up broadcast channel");
      supabase.removeChannel(broadcastChannel);
    };
  }, [userId, setBookmarks]);

  // Refetch when tab becomes visible (catches missed real-time events)
  useEffect(() => {
    const supabase = createClient();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("👁️ Tab became visible – refetching bookmarks");
        supabase
          .from("bookmarks")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .then(({ data, error }) => {
            if (error) {
              console.error("Refetch error:", error);
            } else if (data) {
              setBookmarks(data);
            }
          });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [userId]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this bookmark?")) {
      setDeletingId(id);
      try {
        await deleteBookmark(id);
        // Broadcast listener will handle removal from state
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to delete");
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return "link";
    }
  };

  if (bookmarks.length === 0) {
    return (
      <div className="flex justify-center items-center bg-gray-100 p-4 rounded h-full">
        <div className="flex flex-col items-center">
          <Bookmark className="w-8 h-8 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">
            No bookmarks yet
          </h3>
          <p className="text-gray-500 max-w-sm mt-2 mb-6">
            You haven't saved any bookmarks. Click the button above to add your
            first link to the dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className={`group flex flex-col justify-between p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${
            deletingId === bookmark.id ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3
                className="font-semibold text-gray-900 truncate pr-2"
                title={bookmark.title}
              >
                {bookmark.title}
              </h3>
              <p className="text-xs text-gray-500 truncate">
                {getHostname(bookmark.url)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors"
            >
              <span>Visit</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => handleDelete(bookmark.id)}
              disabled={deletingId === bookmark.id}
              className="group/delete p-2 text-neutral-400 cursor-pointer hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete Bookmark"
            >
              {deletingId === bookmark.id ? (
                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
