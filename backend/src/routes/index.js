import { Router } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import slugify from 'slugify';
import { z } from 'zod';
import { Post, Category, Comment, User, Subscriber, KeywordQueue, SiteSettings, Service, Inquiry, GuestPost } from '../models/index.js';
import { auth, admin, editor } from '../middleware/index.js';
import { generatePost } from '../services/aiAgent.js';
import { requestSubscription, confirmSubscription } from '../services/newsletter.js';
import { uploadImage } from '../services/cloudinary.js';

const r = Router();
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const cookie = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', path: '/' };
const tokens = u => ({ access: jwt.sign({ id: u.id, role: u.role, name: u.name }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' }), refresh: jwt.sign({ id: u.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }) });
const siteBase = () => 'https://kraviona.site';
const legacyInternalLinkPattern = /https?:\/\/(?:www\.)?kraviona\.site\/(?:services\/(?:ai-automation|web-development)|contact)\/?(?=["'#?]|$)/gi;
const sanitizeLegacyInternalLinks = content => String(content || '').replace(legacyInternalLinkPattern, `${siteBase()}/services#contact`);
const normalizedCategoryName = name => name === 'BlockChain' ? 'Blockchain' : name;
function publicPost(post) {
  const result = post?.toObject ? post.toObject() : post;
  if (!result) return result;
  result.content = sanitizeLegacyInternalLinks(result.content);
  if (result.category?.name) result.category.name = normalizedCategoryName(result.category.name);
  return result;
}
function publicCategory(category) {
  const result = category?.toObject ? category.toObject() : category;
  if (result?.name) result.name = normalizedCategoryName(result.name);
  return result;
}
async function adjustCategoryPostCount(categoryId, change) {
  if (!categoryId || !change) return;
  await Category.findByIdAndUpdate(categoryId, { $inc: { postCount: change } });
}
function requireAdminQuery(req) { try { const data = jwt.verify(req.cookies.accessToken || req.headers.authorization?.replace('Bearer ', ''), process.env.JWT_ACCESS_SECRET); if (data.role !== 'admin') throw new Error(); return data; } catch { throw Object.assign(new Error('Admin access required'), { status: 401 }); } }
function normalizePost(body, existing = {}) {
  const title = String(body.title ?? existing.title ?? '').trim();
  const slug = slugify(body.slug || existing.slug || title, { lower: true, strict: true });
  const status = body.status || existing.status || 'draft';
  const seo = { ...(existing.seo?.toObject?.() || existing.seo || {}), ...(body.seo || {}) };
  seo.metaTitle = String(seo.metaTitle || title).slice(0, 60);
  seo.metaDescription = String(seo.metaDescription || body.quickAnswer || existing.quickAnswer || '').slice(0, 160);
  seo.canonicalUrl = `${siteBase()}/blog/${slug}`;
  if (status === 'published') seo.isNoIndex = false;
  const author = { name: process.env.AUTHOR_NAME || 'Kraviona Editorial Team', slug: 'kraviona-editorial-team', sameAs: (process.env.AUTHOR_PROFILES || siteBase()).split(',').filter(Boolean), ...(existing.author?.toObject?.() || existing.author || {}), ...(body.author || {}) };
  author.sameAs = (author.sameAs || []).filter(Boolean);
  return { ...body, title, slug, status, content: sanitizeLegacyInternalLinks(body.content ?? existing.content ?? ''), seo, author, tags: (body.tags || existing.tags || []).map(x => String(x).trim()).filter(Boolean), keyTakeaways: (body.keyTakeaways || existing.keyTakeaways || []).map(x => String(x).trim()).filter(Boolean), faqs: (body.faqs || existing.faqs || []).filter(x => x?.question && x?.answer) };
}
function normalizeService(body, existing = {}) {
  const title = String(body.title ?? existing.title ?? '').trim();
  const slug = slugify(body.slug || existing.slug || title, { lower: true, strict: true });
  const serviceContactUrl = 'https://kraviona.site/services#contact';
  return {
    ...body, title, slug,
    summary: String(body.summary ?? existing.summary ?? '').trim(),
    deliverables: (body.deliverables || existing.deliverables || []).map(value => String(value).trim()).filter(Boolean),
    officialUrl: String(body.officialUrl || existing.officialUrl || serviceContactUrl).trim(),
    seo: { ...(existing.seo?.toObject?.() || existing.seo || {}), ...(body.seo || {}) }
  };
}
const inquiryInput = z.object({
  name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(180),
  phone: z.string().trim().max(40).optional().default(''), company: z.string().trim().max(120).optional().default(''),
  service: z.string().trim().optional(), serviceName: z.string().trim().max(160).optional().default(''),
  budget: z.string().trim().max(80).optional().default(''), message: z.string().trim().min(10).max(4000),
  website: z.string().max(0).optional().default('')
});
const guestPostInput = z.object({
  title: z.string().trim().min(1).max(120), content: z.string().trim().min(1).max(50000),
  excerpt: z.string().trim().max(300).optional().default(''), authorName: z.string().trim().min(2).max(80),
  authorEmail: z.string().trim().email().max(180), website: z.string().trim().url().max(300).optional().or(z.literal('')).default(''),
  category: z.string().trim().optional().default(''),
  status: z.enum(['draft', 'submitted']).optional().default('draft')
});
const extractBacklinks = content => [...String(content || '').matchAll(/<a\b[^>]*?\bhref=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
  .map(match => ({ url: match[1].trim(), anchorText: String(match[2]).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100) }))
  .filter(link => !link.url.startsWith(siteBase()));
const sanitizeGuestContent = content => String(content || '')
  .replace(/<\s*(script|style|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, '')
  .replace(/\s+on[a-z]+\s*=\s*(["']).*?\1/gi, '')
  .replace(/\s+(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '');
const guestPostPayload = async (body, user) => {
  const parsed = guestPostInput.parse({ ...body, content: sanitizeGuestContent(body.content) });
  if (parsed.status === 'submitted' && (parsed.title.length < 10 || parsed.content.length < 600)) throw Object.assign(new Error('Submitted guest posts need a 10-character title and at least 600 words'), { status: 400 });
  const account = user.role === 'admin' ? { editorStatus: 'active', backlinkLimit: 50 } : await User.findById(user.id).select('editorStatus backlinkLimit');
  if (!account || account.editorStatus !== 'active') throw Object.assign(new Error('Your editor account is awaiting administrator approval'), { status: 403 });
  const backlinks = extractBacklinks(parsed.content);
  if (backlinks.length > account.backlinkLimit) throw Object.assign(new Error(`This article has ${backlinks.length} outbound links. Your approved limit is ${account.backlinkLimit}.`), { status: 400 });
  if (parsed.category && (!mongoose.Types.ObjectId.isValid(parsed.category) || !(await Category.exists({ _id: parsed.category })))) throw Object.assign(new Error('Choose a valid category'), { status: 400 });
  return { ...parsed, category: parsed.category || null, backlinks, backlinkCount: backlinks.length, slug: slugify(parsed.title, { lower: true, strict: true }), editor: user.id };
};

r.post('/auth/register', wrap(async (req,res)=>{ const u=await User.create({name:req.body.name,email:req.body.email,passwordHash:await bcrypt.hash(req.body.password,12)}); const t=tokens(u); u.refreshTokenHash=await bcrypt.hash(t.refresh,10); await u.save(); res.cookie('accessToken',t.access,{...cookie,maxAge:900000}).cookie('refreshToken',t.refresh,{...cookie,maxAge:604800000}).status(201).json({user:{id:u.id,name:u.name,role:u.role}}); }));
r.post('/auth/editor-request', wrap(async(req,res)=>{const name=String(req.body.name||'').trim(),email=String(req.body.email||'').trim().toLowerCase(),password=String(req.body.password||'');if(name.length<2||!email.includes('@')||password.length<12)return res.status(400).json({error:'Enter your name, a valid email, and a password of at least 12 characters'});if(await User.exists({email}))return res.status(409).json({error:'An account with this email already exists'});await User.create({name,email,passwordHash:await bcrypt.hash(password,12),role:'editor',editorStatus:'pending',backlinkLimit:0});res.status(201).json({message:'Your editor account request was sent for review. After approval, sign in at https://editor.kraviona.site'});}));
r.post('/auth/login', wrap(async(req,res)=>{const u=await User.findOne({email:req.body.email});if(!u||!await bcrypt.compare(req.body.password,u.passwordHash))return res.status(401).json({error:'Invalid credentials'});if(u.role==='editor'&&u.editorStatus!=='active')return res.status(403).json({error:u.editorStatus==='suspended'?'Your editor account is suspended.':'Your editor account is awaiting administrator approval.'});const t=tokens(u);u.refreshTokenHash=await bcrypt.hash(t.refresh,10);await u.save();res.cookie('accessToken',t.access,{...cookie,maxAge:900000}).cookie('refreshToken',t.refresh,{...cookie,maxAge:604800000}).json({user:{id:u.id,name:u.name,role:u.role,editorStatus:u.editorStatus,backlinkLimit:u.backlinkLimit}});}));
r.get('/auth/me',auth,wrap(async(req,res)=>{const u=await User.findById(req.user.id).select('name email role editorStatus backlinkLimit');res.json({user:u});}));
r.post('/auth/refresh',wrap(async(req,res)=>{const data=jwt.verify(req.cookies.refreshToken,process.env.JWT_REFRESH_SECRET);const u=await User.findById(data.id);if(!u||!await bcrypt.compare(req.cookies.refreshToken,u.refreshTokenHash))return res.status(401).json({error:'Invalid refresh token'});const t=tokens(u);res.cookie('accessToken',t.access,{...cookie,maxAge:900000}).json({ok:true});}));
r.post('/auth/logout',(_,res)=>res.clearCookie('accessToken',cookie).clearCookie('refreshToken',cookie).json({ok:true}));

r.get('/guest-posts',auth,editor,wrap(async(req,res)=>{ const query=req.user.role==='admin'?{}:{editor:req.user.id}; if(req.query.status&&req.query.status!=='all')query.status=req.query.status; res.json(await GuestPost.find(query).populate('editor','name email').populate('category','name slug').sort({createdAt:-1})); }));
r.get('/guest-posts/:id',auth,editor,wrap(async(req,res)=>{ const item=await GuestPost.findById(req.params.id).populate('editor','name email'); if(!item)return res.status(404).json({error:'Guest post not found'}); if(req.user.role!=='admin'&&String(item.editor._id)!==req.user.id)return res.status(403).json({error:'You can only view your own guest posts'}); res.json(item); }));
r.post('/guest-posts',auth,editor,wrap(async(req,res)=>{ const payload=await guestPostPayload(req.body,req.user); const count=await GuestPost.countDocuments({slug:payload.slug}); if(count)payload.slug=`${payload.slug}-${count+1}`; res.status(201).json(await GuestPost.create(payload)); }));
r.put('/guest-posts/:id',auth,editor,wrap(async(req,res)=>{ const item=await GuestPost.findById(req.params.id); if(!item)return res.status(404).json({error:'Guest post not found'}); const isAdmin=req.user.role==='admin'; if(!isAdmin&&String(item.editor)!==req.user.id)return res.status(403).json({error:'You can only edit your own guest posts'}); if(!isAdmin&&!['draft','submitted'].includes(item.status))return res.status(409).json({error:'This submission is already under editorial review'}); if(isAdmin){ const allowed={}; for(const key of ['status','adminNotes'])if(req.body[key]!==undefined)allowed[key]=req.body[key]; if(req.body.status==='published')allowed.publishedAt=item.publishedAt||new Date(); item.set(allowed); } else { const payload=await guestPostPayload(req.body,req.user); item.set(payload); } await item.save(); res.json(await item.populate('editor','name email')); }));
r.delete('/guest-posts/:id',auth,editor,wrap(async(req,res)=>{ const item=await GuestPost.findById(req.params.id); if(!item)return res.status(404).end(); if(req.user.role!=='admin'&&String(item.editor)!==req.user.id)return res.status(403).json({error:'You can only delete your own guest posts'}); if(req.user.role!=='admin'&&item.status!=='draft')return res.status(409).json({error:'Only drafts can be deleted'}); await item.deleteOne(); res.status(204).end(); }));

r.get('/posts',wrap(async(req,res)=>{const q={};if(req.query.status==='all'){requireAdminQuery(req);if(['draft','published'].includes(req.query.filter))q.status=req.query.filter;}else q.status='published';if(req.query.category)q.category=req.query.category;if(req.query.search)q.$text={$search:req.query.search};const limit=Math.min(+req.query.limit||12,100),page=Math.max(+req.query.page||1,1);const [items,total]=await Promise.all([Post.find(q).populate('category').sort({publishedAt:-1,createdAt:-1}).skip((page-1)*limit).limit(limit),Post.countDocuments(q)]);res.json({items:items.map(publicPost),total,page,pages:Math.ceil(total/limit)});}));
r.get('/posts/id/:id',auth,admin,wrap(async(req,res)=>{const p=await Post.findById(req.params.id).populate('category');if(!p)return res.status(404).json({error:'Post not found'});res.json(p);}));
r.get('/posts/:slug',wrap(async(req,res)=>{if(req.query.preview==='true')requireAdminQuery(req);const p=await Post.findOne({slug:req.params.slug,...(req.query.preview==='true'?{}:{status:'published'})}).populate('category');if(!p)return res.status(404).json({error:'Post not found'});res.json(publicPost(p));}));
r.post('/posts',auth,admin,wrap(async(req,res)=>{const post=await Post.create(normalizePost(req.body));if(post.status==='published')await adjustCategoryPostCount(post.category,1);res.status(201).json(await post.populate('category'));}));
r.put('/posts/:id',auth,admin,wrap(async(req,res)=>{const post=await Post.findById(req.params.id);if(!post)return res.status(404).json({error:'Post not found'});const previousCategory=String(post.category||'');const wasPublished=post.status==='published';post.set(normalizePost(req.body,post));await post.save();const currentCategory=String(post.category||'');const isPublished=post.status==='published';if(wasPublished&&(!isPublished||previousCategory!==currentCategory))await adjustCategoryPostCount(previousCategory,-1);if(isPublished&&(!wasPublished||previousCategory!==currentCategory))await adjustCategoryPostCount(currentCategory,1);res.json(await post.populate('category'));}));
r.delete('/posts/:id',auth,admin,wrap(async(req,res)=>{const post=await Post.findById(req.params.id);if(!post)return res.status(404).end();await post.deleteOne();if(post.status==='published')await adjustCategoryPostCount(post.category,-1);res.status(204).end();}));

r.get('/categories',wrap(async(_,res)=>res.json((await Category.find().sort({name:1})).map(publicCategory))));
r.post('/categories',auth,admin,wrap(async(req,res)=>{const slug=slugify(req.body.slug||req.body.name,{lower:true,strict:true});res.status(201).json(await Category.create({...req.body,slug,seo:{...req.body.seo,canonicalUrl:`${siteBase()}/category/${slug}`}}));}));
r.put('/categories/:id',auth,admin,wrap(async(req,res)=>{const c=await Category.findById(req.params.id);if(!c)return res.status(404).json({error:'Category not found'});const slug=slugify(req.body.slug||req.body.name||c.name,{lower:true,strict:true});c.set({...req.body,slug,seo:{...(c.seo?.toObject?.()||c.seo||{}),...req.body.seo,canonicalUrl:`${siteBase()}/category/${slug}`}});await c.save();res.json(c);}));
r.delete('/categories/:id',auth,admin,wrap(async(req,res)=>{if(await Post.exists({category:req.params.id}))return res.status(409).json({error:'Move or delete posts in this category first'});await Category.findByIdAndDelete(req.params.id);res.status(204).end();}));

r.get('/settings',wrap(async(_,res)=>res.json(await SiteSettings.findOneAndUpdate({key:'primary'},{$setOnInsert:{key:'primary'}},{upsert:true,new:true,setDefaultsOnInsert:true}))));
r.put('/settings',auth,admin,wrap(async(req,res)=>res.json(await SiteSettings.findOneAndUpdate({key:'primary'},req.body,{upsert:true,new:true,runValidators:true,setDefaultsOnInsert:true}))));
r.post('/media/upload',auth,admin,wrap(async(req,res)=>res.status(201).json(await uploadImage(req.body.dataUri,req.body.folder))));

r.get('/services',wrap(async(req,res)=>{const q={};if(req.query.status==='all')requireAdminQuery(req);else q.status='published';res.json(await Service.find(q).sort({order:1,title:1}));}));
r.get('/services/:slug',wrap(async(req,res)=>{const query={slug:req.params.slug};if(req.query.preview==='true')requireAdminQuery(req);else query.status='published';const service=await Service.findOne(query);if(!service)return res.status(404).json({error:'Service not found'});res.json(service);}));
r.post('/services',auth,admin,wrap(async(req,res)=>res.status(201).json(await Service.create(normalizeService(req.body)))));
r.put('/services/:id',auth,admin,wrap(async(req,res)=>{const service=await Service.findById(req.params.id);if(!service)return res.status(404).json({error:'Service not found'});service.set(normalizeService(req.body,service));await service.save();res.json(service);}));
r.delete('/services/:id',auth,admin,wrap(async(req,res)=>{if(await Inquiry.exists({service:req.params.id}))return res.status(409).json({error:'This service has enquiries. Set it to draft instead of deleting it.'});await Service.findByIdAndDelete(req.params.id);res.status(204).end();}));

r.post('/inquiries',wrap(async(req,res)=>{const parsed=inquiryInput.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:parsed.error.issues[0]?.message||'Please check your details'});const {website,...payload}=parsed.data;if(website)return res.status(202).json({message:'Thank you. We will contact you shortly.'});if(payload.service&&!mongoose.Types.ObjectId.isValid(payload.service))delete payload.service;const inquiry=await Inquiry.create({...payload,source:req.get('origin')||'kraviona-site'});res.status(201).json({id:inquiry.id,message:'Thanks—your project brief is with the Kraviona team. Expect a reply within one business day.'});}));
r.get('/inquiries',auth,admin,wrap(async(req,res)=>{const query=req.query.status&&req.query.status!=='all'?{status:req.query.status}:{};res.json(await Inquiry.find(query).populate('service','title slug').sort({createdAt:-1}));}));
r.patch('/inquiries/:id',auth,admin,wrap(async(req,res)=>{const allowed={};if(['new','contacted','qualified','closed','spam'].includes(req.body.status))allowed.status=req.body.status;if(typeof req.body.notes==='string')allowed.notes=req.body.notes;const item=await Inquiry.findByIdAndUpdate(req.params.id,allowed,{new:true,runValidators:true}).populate('service','title slug');if(!item)return res.status(404).json({error:'Enquiry not found'});res.json(item);}));
r.delete('/inquiries/:id',auth,admin,wrap(async(req,res)=>{await Inquiry.findByIdAndDelete(req.params.id);res.status(204).end();}));

r.get('/comments',wrap(async(req,res)=>{if(!req.query.post)requireAdminQuery(req);res.json(await Comment.find(req.query.post?{post:req.query.post,status:'approved'}:{status:req.query.status||'pending'}).populate('user','name email').populate('post','title slug').sort({createdAt:-1}));}));
r.post('/comments',auth,wrap(async(req,res)=>res.status(201).json(await Comment.create({...req.body,user:req.user.id,status:'pending'}))));
r.patch('/comments/:id',auth,admin,wrap(async(req,res)=>res.json(await Comment.findByIdAndUpdate(req.params.id,{status:req.body.status},{new:true}))));
r.delete('/comments/:id',auth,admin,wrap(async(req,res)=>{await Comment.findByIdAndDelete(req.params.id);res.status(204).end();}));

r.post('/newsletter/subscribe',wrap(async(req,res)=>{await requestSubscription(req.body.email);res.status(202).json({message:'Check your email to confirm.'});}));
r.get('/newsletter/confirm',wrap(async(req,res)=>{const s=await confirmSubscription(req.query.token);if(!s)return res.status(400).json({error:'Invalid confirmation link'});res.json({message:'Subscription confirmed'});}));
r.get('/subscribers',auth,admin,wrap(async(_,res)=>res.json(await Subscriber.find().sort({createdAt:-1}))));
r.post('/subscribers',auth,admin,wrap(async(req,res)=>res.status(201).json(await Subscriber.findOneAndUpdate({email:String(req.body.email).toLowerCase()},{status:req.body.status||'subscribed',subscribedAt:new Date()},{upsert:true,new:true}))));
r.patch('/subscribers/:id',auth,admin,wrap(async(req,res)=>res.json(await Subscriber.findByIdAndUpdate(req.params.id,{status:req.body.status},{new:true}))));
r.delete('/subscribers/:id',auth,admin,wrap(async(req,res)=>{await Subscriber.findByIdAndDelete(req.params.id);res.status(204).end();}));

r.get('/users',auth,admin,wrap(async(_,res)=>res.json(await User.find().select('-passwordHash -refreshTokenHash'))));
r.post('/users',auth,admin,wrap(async(req,res)=>{ const email=String(req.body.email||'').trim().toLowerCase(); const password=String(req.body.password||''); const role=['reader','editor','admin'].includes(req.body.role)?req.body.role:'editor'; if(!email.includes('@'))return res.status(400).json({error:'Enter a valid email address'}); if(password.length<12)return res.status(400).json({error:'Password must contain at least 12 characters'}); if(await User.exists({email}))return res.status(409).json({error:'A user with this email already exists'}); const user=await User.create({name:String(req.body.name||'Guest editor').trim(),email,passwordHash:await bcrypt.hash(password,12),role,editorStatus:role==='editor'?'active':'pending',backlinkLimit:Number(req.body.backlinkLimit)||0}); res.status(201).json(user.toObject({transform:(_,ret)=>{delete ret.passwordHash;delete ret.refreshTokenHash;return ret}})); }));
r.patch('/users/:id',auth,admin,wrap(async(req,res)=>{const update={};if(req.body.role!==undefined){if(!['reader','editor','admin'].includes(req.body.role))return res.status(400).json({error:'Invalid role'});update.role=req.body.role;}if(req.body.editorStatus!==undefined){if(!['pending','active','suspended'].includes(req.body.editorStatus))return res.status(400).json({error:'Invalid editor status'});update.editorStatus=req.body.editorStatus;}if(req.body.backlinkLimit!==undefined){const limit=Number(req.body.backlinkLimit);if(!Number.isInteger(limit)||limit<0||limit>50)return res.status(400).json({error:'Backlink limit must be between 0 and 50'});update.backlinkLimit=limit;}return res.json(await User.findByIdAndUpdate(req.params.id,update,{new:true}).select('-passwordHash -refreshTokenHash'));}));
r.post('/ai-agent/generate',auth,admin,wrap(async(req,res)=>res.status(201).json(await generatePost({topic:req.body.topic,category:req.body.category,mode:'manual'}))));
r.get('/keyword-queue',auth,admin,wrap(async(_,res)=>res.json(await KeywordQueue.find().populate('targetCategory').sort({priority:-1}))));
r.post('/keyword-queue',auth,admin,wrap(async(req,res)=>res.status(201).json(await KeywordQueue.create(req.body))));
r.delete('/keyword-queue/:id',auth,admin,wrap(async(req,res)=>{await KeywordQueue.findByIdAndDelete(req.params.id);res.status(204).end();}));
r.get('/dashboard',auth,admin,wrap(async(_,res)=>{const [posts,published,pendingComments,subscribers,newInquiries,services,recentAI,recentPosts]=await Promise.all([Post.countDocuments(),Post.countDocuments({status:'published'}),Comment.countDocuments({status:'pending'}),Subscriber.countDocuments({status:'subscribed'}),Inquiry.countDocuments({status:'new'}),Service.countDocuments({status:'published'}),Post.find({generatedBy:{$ne:'manual'}}).sort({createdAt:-1}).limit(5),Post.find().populate('category','name').sort({updatedAt:-1}).limit(6)]);res.json({posts,published,drafts:posts-published,pendingComments,subscribers,newInquiries,services,recentAI,recentPosts});}));

export default r;
