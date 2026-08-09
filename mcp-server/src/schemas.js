import { z } from "zod";

export const mongoId = z.string().trim().min(1).describe("MongoDB document ID");

export const seoSchema = z.object({
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  ogImage: z.string().url().or(z.literal("")).optional(),
  isNoIndex: z.boolean().optional(),
});

export const editablePostSchema = z.object({
  title: z.string().trim().min(3).max(120),
  slug: z.string().trim().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  content: z.string().min(1),
  quickAnswer: z.string().max(240).optional(),
  category: mongoId.optional(),
  tags: z.array(z.string().trim()).max(20).optional(),
  keyTakeaways: z.array(z.string().trim()).max(12).optional(),
  faqs: z
    .array(
      z.object({
        question: z.string().trim().min(1),
        answer: z.string().trim().min(1),
      }),
    )
    .max(12)
    .optional(),
  featuredImage: z
    .object({
      url: z.string().url().or(z.literal("")),
      alt: z.string().trim(),
    })
    .optional(),
  author: z
    .object({
      name: z.string().trim().min(1),
      slug: z.string().trim(),
      sameAs: z.array(z.string().url()).max(10),
    })
    .optional(),
  seo: seoSchema.optional(),
});

export const updatePostSchema = editablePostSchema.partial().extend({
  id: mongoId,
});
