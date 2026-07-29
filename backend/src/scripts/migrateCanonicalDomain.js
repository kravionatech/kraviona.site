import 'dotenv/config';
import mongoose from 'mongoose';
import { Category, Post, Service, SiteSettings } from '../models/index.js';

const canonicalDomain = value => typeof value === 'string'
  ? value.replace(/https?:\/\/(?:www\.)?kraviona\.com\b/gi, 'https://kraviona.site')
    .replace(/https?:\/\/www\.kraviona\.site\b/gi, 'https://kraviona.site')
  : value;

function normalize(value) {
  if (typeof value === 'string') return canonicalDomain(value);
  if (value instanceof Date || value?._bsontype || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(normalize);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalize(item)]));
}

async function migrate(Model) {
  const records = await Model.find().lean();
  let changed = 0;

  for (const record of records) {
    const source = record;
    const normalized = normalize(source);
    if (JSON.stringify(source) === JSON.stringify(normalized)) continue;
    await Model.collection.replaceOne({ _id: source._id }, normalized);
    changed += 1;
  }

  return changed;
}

if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
await mongoose.connect(process.env.MONGO_URI);
const results = [];
for (const Model of [Post, Category, Service, SiteSettings]) results.push(await migrate(Model));
console.log(`Updated ${results.reduce((total, count) => total + count, 0)} record(s) to kraviona.site.`);
await mongoose.disconnect();
