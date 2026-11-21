import type { MetadataRoute } from "next";

const siteUrl = "https://maarifabooks.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/dashboard/", "/muuzaji/", "/auth/", "/ingia/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
