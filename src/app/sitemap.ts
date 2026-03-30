import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://kslutsky.com", lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: "https://kslutsky.com/publications", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://kslutsky.com/teaching", lastModified: new Date(), changeFrequency: "yearly", priority: 0.6 },
  ];
}
