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
  defaultSeo: { title: String, description: String, ogImage: String }, socialLinks: [{ label: String, url: String }]
}, { timestamps: true });

export const Post = model('Post', PostSchema); export const Category = model('Category', CategorySchema);
export const User = model('User', UserSchema); export const Comment = model('Comment', CommentSchema);
export const Subscriber = model('Subscriber', SubscriberSchema); export const KeywordQueue = model('KeywordQueue', KeywordQueueSchema);
export const SiteSettings = model('SiteSettings', SiteSettingsSchema);
