import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = "https://maarifabooks.vercel.app";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data: books, error } = await supabase
    .from("books")
    .select("id, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("Unable to load approved books for sitemap:", error.message);
  }

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/wauzaji`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const bookPages: MetadataRoute.Sitemap = (books ?? []).map((book) => ({
    url: `${siteUrl}/kitabu/${encodeURIComponent(book.id)}`,
    lastModified: book.created_at ? new Date(book.created_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...bookPages];
}
