import { defineCollection, z } from 'astro:content';

const writingSchema = z.object({
  title: z.string(),
  title_en: z.string().optional(),
  sub: z.string().optional(),
  sub_en: z.string().optional(),
  cover: z.string().optional(),
  date: z.date(),
  description: z.string().optional(),
  description_en: z.string().optional(),
  tags: z.array(z.string()).optional(),
  draft: z.boolean().optional().default(false),
});

const writing = defineCollection({
  type: 'content',
  schema: writingSchema,
});

/* 英文译文集：与 writing 同 slug，有译文则英文页直接渲染译文 */
const writingEn = defineCollection({
  type: 'content',
  schema: writingSchema,
});

export const collections = { writing, 'writing-en': writingEn };
