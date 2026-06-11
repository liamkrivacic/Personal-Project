import type { MetadataRoute } from "next";
import { getAllCaseStudies } from "@/lib/case-studies";

export default function sitemap(): MetadataRoute.Sitemap {
  const published = getAllCaseStudies().filter((s) => s.status === "published");

  return [
    {
      url: "https://liam-krivacic.vercel.app",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    ...published.map((s) => ({
      url: `https://liam-krivacic.vercel.app/projects/${s.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
