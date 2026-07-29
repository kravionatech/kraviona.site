import Anthropic from '@anthropic-ai/sdk';
import slugify from 'slugify';
import { z } from 'zod';
import { Post } from '../models/index.js';

const Generated = z.object({ title: z.string().min(5), slug: z.string(), content: z.string(), quickAnswer: z.string().min(20), keyTakeaways: z.array(z.string()).min(5), faqs: z.array(z.object({ question: z.string(), answer: z.string() })).min(7), tags: z.array(z.string()).min(1), metaTitle: z.string().max(60), metaDescription: z.string().max(160) });
export async function generatePost({ topic, category, mode = 'manual' }) {
  if (!process.env.ANTHROPIC_API_KEY) throw Object.assign(new Error('ANTHROPIC_API_KEY is not configured'), { status: 503 });
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({ model: process.env.AI_MODEL || 'claude-sonnet-4-6', max_tokens: 7000, system: 'You are an expert SEO editor. Return ONLY valid JSON with: title, slug, content (semantic HTML, at least 800 words), quickAnswer, keyTakeaways (5-7), faqs (exactly 7 objects with question and answer), tags, metaTitle (max 60 chars), metaDescription (max 160 chars). Never include undefined or markdown fences.', messages: [{ role: 'user', content: `Create a useful, accurate, original article about: ${topic}` }] });
  const raw = response.content.find(x => x.type === 'text')?.text || '';
  let parsed; try { parsed = Generated.parse(JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ''))); } catch { throw Object.assign(new Error('AI returned invalid post JSON'), { status: 502 }); }
  const wordCount = parsed.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 800 || JSON.stringify(parsed).includes('undefined')) throw Object.assign(new Error('Generated post failed SEO validation'), { status: 422 });
  const slug = slugify(parsed.slug || parsed.title, { lower: true, strict: true });
  const base = 'https://kraviona.site';
  return Post.create({ title: parsed.title, slug, content: parsed.content, quickAnswer: parsed.quickAnswer, keyTakeaways: parsed.keyTakeaways, faqs: parsed.faqs, category, tags: parsed.tags, author: { name: process.env.AUTHOR_NAME || 'Kraviona Editorial Team', slug: 'kraviona-editorial-team', sameAs: (process.env.AUTHOR_PROFILES || `${base}/about`).split(',').filter(Boolean) }, seo: { metaTitle: parsed.metaTitle, metaDescription: parsed.metaDescription, canonicalUrl: `${base}/blog/${slug}`, isNoIndex: mode !== 'auto' }, generatedBy: mode === 'auto' ? 'ai-auto' : 'ai-manual', status: mode === 'auto' && process.env.AUTO_PUBLISH !== 'false' ? 'published' : 'draft' });
}
