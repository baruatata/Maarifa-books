import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://maarifabooks-baruatata-7134s-projects.vercel.app").replace(/\/$/, "");
  const supabase = await createClient();
  const { data: books } = await supabase
    .from("books")
    .select("id, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(5000);

  const pages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/wauzaji`, changeFrequency: "weekly", priority: 0.7 },
  ];

  for (const book of books ?? []) {
    pages.push({
      url: `${siteUrl}/kitabu/${book.id}`,
      lastModified: book.created_at ? new Date(book.created_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return pages;
}
