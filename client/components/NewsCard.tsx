"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { formatDate, plainText, readingTime } from "../lib/site";

export type NewsCardProps = {
  post: any;
  featured?: boolean;
  index?: number;
};

export default function NewsCard({ post, featured = false, index }: NewsCardProps) {
  const reduceMotion = useReducedMotion();
  const words = post.wordCount || plainText(post.content || "").split(/\s+/).filter(Boolean).length;
  const delay = typeof index === "number" ? Math.min(Math.max(index - 1, 0) * 0.07, 0.42) : 0;

  return (
    <motion.article
      className={`story-card${featured ? " story-card--featured" : ""}`}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link className="story-card__image" href={`/blog/${post.slug}`} prefetch>
        {post.featuredImage?.url ? (
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.alt || post.title}
            fill
            sizes={featured ? "(max-width: 767px) 100vw, 60vw" : "(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"}
            priority={featured}
          />
        ) : (
          <span className="image-placeholder" aria-hidden="true" />
        )}
        {typeof index === "number" && <span className="story-index">{String(index).padStart(2, "0")}</span>}
      </Link>
      <div className="story-card__content">
        <div className="story-card__meta">
          <Link href={post.category?.slug ? `/category/${post.category.slug}` : "/blog"} prefetch>
            {post.category?.name || "Web3"}
          </Link>
          <span>{formatDate(post.publishedAt)} · {readingTime(words)} min</span>
        </div>
        <h2><Link href={`/blog/${post.slug}`} prefetch>{post.title}</Link></h2>
        <p>{post.quickAnswer}</p>
        <Link className="read-link" href={`/blog/${post.slug}`} prefetch>Read story <span aria-hidden="true">↗</span></Link>
      </div>
    </motion.article>
  );
}
