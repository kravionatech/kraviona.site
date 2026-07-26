import { Router } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import slugify from 'slugify';
import { z } from 'zod';
import { Post, Category, Comment, User, Subscriber, KeywordQueue, SiteSettings, Service, Inquiry } from '../models/index.js';
import { auth, admin, commentLimiter, inquiryLimiter } from '../middleware/index.js';
import { generatePost } from '../services/aiAgent.js';
import { requestSubscription, confirmSubscription } from '../services/newsletter.js';
import { uploadImage } from '../services/cloudinary.js';

const r = Router();
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const cookie = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', path: '/' };
const tokens = u => ({ access: jwt.sign({ id: u.id, role: u.role, name: u.name }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' }), refresh: jwt.sign({ id: u.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }) });
const siteBase = () => (process.env.CLIENT_URL || 'https://www.kraviona.site').replace(/\/$/, '');
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
  return { ...body, title, slug, status, seo, author, tags: (body.tags || existing.tags || []).map(x => String(x).trim()).filter(Boolean), keyTakeaways: (body.keyTakeaways || existing.keyTakeaways || []).map(x => String(x).trim()).filter(Boolean), faqs: (body.faqs || existing.faqs || []).filter(x => x?.question && x?.answer) };
}
function normalizeService(body, existing = {}) {
  const title = String(body.title ?? existing.title ?? '').trim();
  const slug = slugify(body.slug || existing.slug || title, { lower: true, strict: true });
  const officialBase = 'https://www.kraviona.com';
  return {
    ...body, title, slug,
    summary: String(body.summary ?? existing.summary ?? '').trim(),
    deliverables: (body.deliverables || existing.deliverables || []).map(value => String(value).trim()).filter(Boolean),
    officialUrl: String(body.officialUrl || existing.officialUrl || `${officialBase}/services`).trim(),
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

r.post('/auth/register', wrap(async (req,res)=>{ const u=await User.create({name:req.body.name,email:req.body.email,passwordHash:await bcrypt.hash(req.body.password,12)}); const t=tokens(u); u.refreshTokenHash=await bcrypt.hash(t.refresh,10); await u.save(); res.cookie('accessToken',t.access,{...cookie,maxAge:900000}).cookie('refreshToken',t.refresh,{...cookie,maxAge:604800000}).status(201).json({user:{id:u.id,name:u.name,role:u.role}}); }));
r.post('/auth/login', wrap(async(req,res)=>{const u=await User.findOne({email:req.body.email});if(!u||!await bcrypt.compare(req.body.password,u.passwordHash))return res.status(401).json({error:'Invalid credentials'});const t=tokens(u);u.refreshTokenHash=await bcrypt.hash(t.refresh,10);await u.save();res.cookie('accessToken',t.access,{...cookie,maxAge:900000}).cookie('refreshToken',t.refresh,{...cookie,maxAge:604800000}).json({user:{id:u.id,name:u.name,role:u.role}});}));
r.get('/auth/me',auth,wrap(async(req,res)=>{const u=await User.findById(req.user.id).select('name email role');res.json({user:u});}));
r.post('/auth/refresh',wrap(async(req,res)=>{const data=jwt.verify(req.cookies.refreshToken,process.env.JWT_REFRESH_SECRET);const u=await User.findById(data.id);if(!u||!await bcrypt.compare(req.cookies.refreshToken,u.refreshTokenHash))return res.status(401).json({error:'Invalid refresh token'});const t=tokens(u);res.cookie('accessToken',t.access,{...cookie,maxAge:900000}).json({ok:true});}));
r.post('/auth/logout',(_,res)=>res.clearCookie('accessToken',cookie).clearCookie('refreshToken',cookie).json({ok:true}));

r.get('/posts',wrap(async(req,res)=>{const q={};if(req.query.status==='all'){requireAdminQuery(req);if(['draft','published'].includes(req.query.filter))q.status=req.query.filter;}else q.status='published';if(req.query.category)q.category=req.query.category;if(req.query.search)q.$text={$search:req.query.search};const limit=Math.min(+req.query.limit||12,100),page=Math.max(+req.query.page||1,1);const [items,total]=await Promise.all([Post.find(q).populate('category').sort({publishedAt:-1,createdAt:-1}).skip((page-1)*limit).limit(limit),Post.countDocuments(q)]);res.json({items,total,page,pages:Math.ceil(total/limit)});}));
r.get('/posts/id/:id',auth,admin,wrap(async(req,res)=>{const p=await Post.findById(req.params.id).populate('category');if(!p)return res.status(404).json({error:'Post not found'});res.json(p);}));
r.get('/posts/:slug',wrap(async(req,res)=>{if(req.query.preview==='true')requireAdminQuery(req);const p=await Post.findOne({slug:req.params.slug,...(req.query.preview==='true'?{}:{status:'published'})}).populate('category');if(!p)return res.status(404).json({error:'Post not found'});res.json(p);}));
r.post('/posts',auth,admin,wrap(async(req,res)=>{const post=await Post.create(normalizePost(req.body));res.status(201).json(await post.populate('category'));}));
r.put('/posts/:id',auth,admin,wrap(async(req,res)=>{const post=await Post.findById(req.params.id);if(!post)return res.status(404).json({error:'Post not found'});post.set(normalizePost(req.body,post));await post.save();res.json(await post.populate('category'));}));
r.delete('/posts/:id',auth,admin,wrap(async(req,res)=>{await Post.findByIdAndDelete(req.params.id);res.status(204).end();}));

r.get('/categories',wrap(async(_,res)=>res.json(await Category.find().sort({name:1}))));
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

r.post('/inquiries',inquiryLimiter,wrap(async(req,res)=>{const parsed=inquiryInput.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:parsed.error.issues[0]?.message||'Please check your details'});const {website,...payload}=parsed.data;if(website)return res.status(202).json({message:'Thank you. We will contact you shortly.'});if(payload.service&&!mongoose.Types.ObjectId.isValid(payload.service))delete payload.service;const inquiry=await Inquiry.create({...payload,source:req.get('origin')||'kraviona-site'});res.status(201).json({id:inquiry.id,message:'Thanks—your project brief is with the Kraviona team. Expect a reply within one business day.'});}));
r.get('/inquiries',auth,admin,wrap(async(req,res)=>{const query=req.query.status&&req.query.status!=='all'?{status:req.query.status}:{};res.json(await Inquiry.find(query).populate('service','title slug').sort({createdAt:-1}));}));
r.patch('/inquiries/:id',auth,admin,wrap(async(req,res)=>{const allowed={};if(['new','contacted','qualified','closed','spam'].includes(req.body.status))allowed.status=req.body.status;if(typeof req.body.notes==='string')allowed.notes=req.body.notes;const item=await Inquiry.findByIdAndUpdate(req.params.id,allowed,{new:true,runValidators:true}).populate('service','title slug');if(!item)return res.status(404).json({error:'Enquiry not found'});res.json(item);}));
r.delete('/inquiries/:id',auth,admin,wrap(async(req,res)=>{await Inquiry.findByIdAndDelete(req.params.id);res.status(204).end();}));

r.get('/comments',wrap(async(req,res)=>{if(!req.query.post)requireAdminQuery(req);res.json(await Comment.find(req.query.post?{post:req.query.post,status:'approved'}:{status:req.query.status||'pending'}).populate('user','name email').populate('post','title slug').sort({createdAt:-1}));}));
r.post('/comments',auth,commentLimiter,wrap(async(req,res)=>res.status(201).json(await Comment.create({...req.body,user:req.user.id,status:'pending'}))));
r.patch('/comments/:id',auth,admin,wrap(async(req,res)=>res.json(await Comment.findByIdAndUpdate(req.params.id,{status:req.body.status},{new:true}))));
r.delete('/comments/:id',auth,admin,wrap(async(req,res)=>{await Comment.findByIdAndDelete(req.params.id);res.status(204).end();}));

r.post('/newsletter/subscribe',wrap(async(req,res)=>{await requestSubscription(req.body.email);res.status(202).json({message:'Check your email to confirm.'});}));
r.get('/newsletter/confirm',wrap(async(req,res)=>{const s=await confirmSubscription(req.query.token);if(!s)return res.status(400).json({error:'Invalid confirmation link'});res.json({message:'Subscription confirmed'});}));
r.get('/subscribers',auth,admin,wrap(async(_,res)=>res.json(await Subscriber.find().sort({createdAt:-1}))));
r.post('/subscribers',auth,admin,wrap(async(req,res)=>res.status(201).json(await Subscriber.findOneAndUpdate({email:String(req.body.email).toLowerCase()},{status:req.body.status||'subscribed',subscribedAt:new Date()},{upsert:true,new:true}))));
r.patch('/subscribers/:id',auth,admin,wrap(async(req,res)=>res.json(await Subscriber.findByIdAndUpdate(req.params.id,{status:req.body.status},{new:true}))));
r.delete('/subscribers/:id',auth,admin,wrap(async(req,res)=>{await Subscriber.findByIdAndDelete(req.params.id);res.status(204).end();}));

r.get('/users',auth,admin,wrap(async(_,res)=>res.json(await User.find().select('-passwordHash -refreshTokenHash'))));
r.patch('/users/:id',auth,admin,wrap(async(req,res)=>res.json(await User.findByIdAndUpdate(req.params.id,{role:req.body.role},{new:true}).select('-passwordHash -refreshTokenHash'))));
r.post('/ai-agent/generate',auth,admin,wrap(async(req,res)=>res.status(201).json(await generatePost({topic:req.body.topic,category:req.body.category,mode:'manual'}))));
r.get('/keyword-queue',auth,admin,wrap(async(_,res)=>res.json(await KeywordQueue.find().populate('targetCategory').sort({priority:-1}))));
r.post('/keyword-queue',auth,admin,wrap(async(req,res)=>res.status(201).json(await KeywordQueue.create(req.body))));
r.delete('/keyword-queue/:id',auth,admin,wrap(async(req,res)=>{await KeywordQueue.findByIdAndDelete(req.params.id);res.status(204).end();}));
r.get('/dashboard',auth,admin,wrap(async(_,res)=>{const [posts,published,pendingComments,subscribers,newInquiries,services,recentAI,recentPosts]=await Promise.all([Post.countDocuments(),Post.countDocuments({status:'published'}),Comment.countDocuments({status:'pending'}),Subscriber.countDocuments({status:'subscribed'}),Inquiry.countDocuments({status:'new'}),Service.countDocuments({status:'published'}),Post.find({generatedBy:{$ne:'manual'}}).sort({createdAt:-1}).limit(5),Post.find().populate('category','name').sort({updatedAt:-1}).limit(6)]);res.json({posts,published,drafts:posts-published,pendingComments,subscribers,newInquiries,services,recentAI,recentPosts});}));

export default r;
