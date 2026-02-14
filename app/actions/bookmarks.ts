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

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: user.id,
      url,
      title,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add bookmark: ${error.message}`);
  }

  // Broadcast to user-specific channel for cross-tab sync
  const broadcastChannel = supabase.channel(`user-bookmarks-${user.id}`);
  await broadcastChannel.subscribe();
  await broadcastChannel.send({
    type: "broadcast",
    event: "bookmark_added",
    payload: { bookmark: data },
  });
  await broadcastChannel.unsubscribe();

  revalidatePath("/dashboard");
  return data;
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

  // Broadcast deletion to user-specific channel for cross-tab sync
  const broadcastChannel = supabase.channel(`user-bookmarks-${user.id}`);
  await broadcastChannel.subscribe();
  await broadcastChannel.send({
    type: "broadcast",
    event: "bookmark_deleted",
    payload: { id },
  });
  await broadcastChannel.unsubscribe();

  revalidatePath("/dashboard");
}
