import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const seo = { metaTitle: String, metaDescription: String, canonicalUrl: String, isNoIndex: { type: Boolean, default: false }, ogImage: String };
const PostSchema = new Schema({
  title: { type: String, required: true }, slug: { type: String, unique: true, required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' }, content: { type: String, required: true },
  quickAnswer: String, keyTakeaways: [String], faqs: [{ question: String, answer: String }],
  category: { type: Schema.Types.ObjectId, ref: 'Category' }, tags: [String], featuredImage: { url: String, alt: String },
  author: { name: String, slug: String, sameAs: [String] }, seo,
  wordCount: { type: Number, default: 0 }, generatedBy: { type: String, enum: ['manual', 'ai-manual', 'ai-auto'], default: 'manual' },
  publishedAt: Date
}, { timestamps: true });
PostSchema.index({ title: 'text', content: 'text', tags: 'text' });
PostSchema.pre('validate', function () {
  this.wordCount = (this.content || '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  if (this.status === 'published') { this.publishedAt ||= new Date(); this.seo ||= {}; this.seo.isNoIndex = false; }
  if ((this.seo?.canonicalUrl || '').includes('undefined')) this.invalidate('seo.canonicalUrl', 'Invalid canonical URL');
  if (this.status === 'published' && !this.wordCount) this.invalidate('wordCount', 'Published posts need content');
});

const CategorySchema = new Schema({ name: { type: String, required: true }, slug: { type: String, unique: true, required: true }, description: String, seo }, { timestamps: true });
const UserSchema = new Schema({ name: String, email: { type: String, unique: true, lowercase: true, required: true }, passwordHash: String, role: { type: String, enum: ['reader', 'admin'], default: 'reader' }, refreshTokenHash: String }, { timestamps: true });
const CommentSchema = new Schema({ post: { type: Schema.Types.ObjectId, ref: 'Post', required: true }, user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, parentComment: { type: Schema.Types.ObjectId, ref: 'Comment', default: null }, content: { type: String, required: true, maxlength: 2000 }, status: { type: String, enum: ['pending', 'approved', 'spam'], default: 'pending' } }, { timestamps: true });
const SubscriberSchema = new Schema({ email: { type: String, unique: true, lowercase: true }, status: { type: String, enum: ['pending', 'subscribed', 'unsubscribed'], default: 'pending' }, resendContactId: String, confirmToken: String, subscribedAt: Date }, { timestamps: true });
const KeywordQueueSchema = new Schema({ keyword: { type: String, required: true }, targetCategory: { type: Schema.Types.ObjectId, ref: 'Category' }, priority: { type: Number, default: 0 }, status: { type: String, enum: ['pending', 'used'], default: 'pending' } }, { timestamps: true });
const SiteSettingsSchema = new Schema({
  key: { type: String, unique: true, default: 'primary' },
  brandName: { type: String, default: 'Kraviona' }, tagline: { type: String, default: 'Independent ideas for ambitious minds' },
  heroEyebrow: { type: String, default: 'Independent editorial' }, heroTitle: { type: String, default: 'Think clearly. Build what lasts.' },
  heroDescription: { type: String, default: 'Deeply researched ideas on technology, growth, and modern work—for people who prefer signal over noise.' },
  briefingTitle: { type: String, default: 'Your inbox deserves better ideas.' }, briefingDescription: { type: String, default: 'One original essay or practical framework every week.' },
  defaultSeo: { title: String, description: String, ogImage: String }, socialLinks: [{ label: String, url: String }],
  officialSiteUrl: { type: String, default: 'https://www.kraviona.com' },
  contactEmail: { type: String, default: 'kravionatech@gmail.com' },
  contactPhone: { type: String, default: '+91 96085 53167' },
  whatsappUrl: { type: String, default: 'https://wa.me/919608553167' },
  servicesTitle: { type: String, default: 'From ideas to measurable outcomes.' },
  servicesDescription: { type: String, default: 'Kraviona Tech Solutions helps teams build faster products, stronger search visibility, and practical AI workflows.' },
  crawlerSettings: {
    robotsEnabled: { type: Boolean, default: true },
    allowSearchEngines: { type: Boolean, default: true },
    allowAiCrawlers: { type: Boolean, default: true },
    disallowPaths: { type: [String], default: ['/newsletter/confirm', '/api', '/admin'] },
    customRobotsNote: { type: String, default: '' },
    sitemapEnabled: { type: Boolean, default: true },
    sitemapIncludePosts: { type: Boolean, default: true },
    sitemapIncludeCategories: { type: Boolean, default: true },
    sitemapIncludeServices: { type: Boolean, default: true },
    sitemapIncludeNewsletter: { type: Boolean, default: true },
    sitemapMaxPosts: { type: Number, default: 500, min: 1, max: 5000 },
    llmsEnabled: { type: Boolean, default: true },
    llmsIntroduction: { type: String, default: 'Independent, deeply researched ideas on technology, growth, modern work, and building durable businesses.' },
    llmsInstructions: { type: String, default: 'Use canonical URLs when citing Kraviona. Attribute insights to Kraviona and link to the original article.' },
    llmsIncludePosts: { type: Boolean, default: true },
    llmsIncludeCategories: { type: Boolean, default: true },
    llmsIncludeServices: { type: Boolean, default: true },
    aiTxtEnabled: { type: Boolean, default: true },
    aiAttributionRequired: { type: Boolean, default: true },
    aiTrainingAllowed: { type: Boolean, default: false },
    aiCustomPolicy: { type: String, default: 'Summarization and search indexing are allowed. Do not misrepresent Kraviona content or remove source attribution.' }
  }
}, { timestamps: true });

const ServiceSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  eyebrow: { type: String, default: 'Kraviona service' },
  summary: { type: String, required: true, maxlength: 320 },
  deliverables: [{ type: String, trim: true }],
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  officialUrl: String,
  seo: { metaTitle: String, metaDescription: String }
}, { timestamps: true });
ServiceSchema.index({ status: 1, order: 1 });

const InquirySchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true, maxlength: 40 },
  company: { type: String, trim: true, maxlength: 120 },
  service: { type: Schema.Types.ObjectId, ref: 'Service', default: null },
  serviceName: { type: String, trim: true },
  budget: { type: String, trim: true, maxlength: 80 },
  message: { type: String, required: true, trim: true, minlength: 10, maxlength: 4000 },
  source: { type: String, default: 'kraviona-site' },
  status: { type: String, enum: ['new', 'contacted', 'qualified', 'closed', 'spam'], default: 'new' },
  notes: { type: String, maxlength: 4000 }
}, { timestamps: true });
InquirySchema.index({ status: 1, createdAt: -1 });

export const Post = model('Post', PostSchema); export const Category = model('Category', CategorySchema);
export const User = model('User', UserSchema); export const Comment = model('Comment', CommentSchema);
export const Subscriber = model('Subscriber', SubscriberSchema); export const KeywordQueue = model('KeywordQueue', KeywordQueueSchema);
export const SiteSettings = model('SiteSettings', SiteSettingsSchema);
export const Service = model('Service', ServiceSchema); export const Inquiry = model('Inquiry', InquirySchema);
