"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addBookmark(formData: FormData) {
  const url = formData.get("url") as string;
  const title = formData.get("title") as string;

  if (!url || !title) {
    throw new Error("URL and title are required");
  }

  const supabase = await createClient();

  // Check user is authenticated
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("You must be logged in");
  }

  const { error } = await supabase.from("bookmarks").insert({
    user_id: user.id,
    url,
    title,
  });

  if (error) {
    throw new Error(`Failed to add bookmark: ${error.message}`);
  }

  // Revalidate the dashboard page to show the new bookmark immediately
  revalidatePath("/dashboard");
}

export async function deleteBookmark(id: string) {
  const supabase = await createClient();

  // Check user is authenticated
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("You must be logged in");
  }

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // extra safety: ensure user owns it

  if (error) {
    throw new Error(`Failed to delete bookmark: ${error.message}`);
  }

  revalidatePath("/dashboard");
}
