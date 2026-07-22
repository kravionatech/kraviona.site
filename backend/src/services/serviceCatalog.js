import { Service } from '../models/index.js';

export const defaultServices = [
  {
    title: 'MERN & Next.js Development', slug: 'mern-nextjs-development', eyebrow: 'Product engineering', order: 10, featured: true, status: 'published',
    summary: 'Fast, scalable web applications built around your product goals—not a generic template.',
    deliverables: ['Product strategy and architecture', 'React, Next.js and Node.js development', 'MongoDB, APIs and production deployment'],
    officialUrl: 'https://www.kraviona.com/services/mern-stack-development',
    seo: { metaTitle: 'MERN & Next.js Development Services', metaDescription: 'Scalable MERN and Next.js product development by Kraviona Tech Solutions.' }
  },
  {
    title: 'Technical SEO & Performance', slug: 'technical-seo-performance', eyebrow: 'Organic growth', order: 20, featured: true, status: 'published',
    summary: 'Technical SEO, structured data and Core Web Vitals improvements that help search engines and customers trust your site.',
    deliverables: ['Technical SEO audit and roadmap', 'Schema, crawlability and indexation fixes', 'Lighthouse and Core Web Vitals optimisation'],
    officialUrl: 'https://www.kraviona.com/services/technical-seo',
    seo: { metaTitle: 'Technical SEO & Web Performance', metaDescription: 'Technical SEO, schema and Core Web Vitals services from Kraviona.' }
  },
  {
    title: 'AI Automation & Agents', slug: 'ai-automation-agents', eyebrow: 'Smarter operations', order: 30, featured: true, status: 'published',
    summary: 'Practical AI systems that qualify leads, assist customers and remove repetitive work from your team.',
    deliverables: ['Workflow opportunity audit', 'Custom LLM, chatbot and agent development', 'CRM, WhatsApp and business-tool integrations'],
    officialUrl: 'https://www.kraviona.com/services/ai-automation',
    seo: { metaTitle: 'AI Automation & Agent Development', metaDescription: 'Custom AI automation, chatbots and agent workflows built for real business operations.' }
  },
  {
    title: 'Backend & API Architecture', slug: 'backend-api-architecture', eyebrow: 'Reliable foundations', order: 40, featured: false, status: 'published',
    summary: 'Secure APIs and backend systems designed to stay maintainable as your traffic, data and team grow.',
    deliverables: ['REST and GraphQL APIs', 'Authentication, database and cloud architecture', 'Integrations, observability and documentation'],
    officialUrl: 'https://www.kraviona.com/services',
    seo: { metaTitle: 'Backend & API Development Services', metaDescription: 'Secure Node.js APIs, backend architecture and third-party integrations by Kraviona.' }
  }
];

export async function ensureDefaultServices() {
  if (await Service.estimatedDocumentCount()) return;
  await Service.insertMany(defaultServices);
  console.log(`Seeded ${defaultServices.length} default services`);
}
