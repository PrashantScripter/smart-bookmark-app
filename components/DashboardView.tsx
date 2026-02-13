"use client";

import { useState } from "react";
import { Plus, Search, Bookmark } from "lucide-react";
import AddBookmarkModal from "./AddBookmarkModal";
import BookmarksList from "./BookmarksList";
import { Bookmark as BookMark } from "@/types";

interface BookmarksListProps {
  initialBookmarks: BookMark[];
  userId: string;
}

export default function DashboardView({
  initialBookmarks,
  userId,
}: BookmarksListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My bookmarks</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage and organize your favorite links.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 cursor-pointer bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Bookmark</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl bg-white/50 h-100 flex flex-col text-center p-6 animate-in fade-in zoom-in duration-500 overflow-y-auto">
        
        <BookmarksList
          initialBookmarks={initialBookmarks || []}
          userId={userId}
        />
      </div>

      <AddBookmarkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </main>
  );
}
