"use client";

import { useRef, useState } from "react";
import { X, Link as LinkIcon, Type, Loader2 } from "lucide-react";
import { addBookmark } from "@/app/actions/bookmarks";
import type { Bookmark } from "@/types";

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (bookmark: Bookmark) => void;
}

export default function AddBookmarkModal({
  isOpen,
  onClose,
  onAdd,
}: AddBookmarkModalProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const newBookmark = await addBookmark(formData);
      // Optimistic update: add to parent state immediately
      onAdd(newBookmark);
      formRef.current?.reset();
      setTitle("");
      setUrl("");
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add bookmark");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Add New Bookmark
          </h3>
          <button
            onClick={onClose}
            className="cursor-pointer p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Title</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Type className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="title"
                id="title"
                placeholder="e.g. My Favorite Blog"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">URL</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="url"
                name="url"
                id="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 cursor-pointer px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Bookmark"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
