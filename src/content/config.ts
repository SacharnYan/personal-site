import { defineCollection, z } from 'astro:content';

const writing = defineCollection({
  type: 'content',
  schema: z.object({
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
  }),
});

export const collections = { writing };
