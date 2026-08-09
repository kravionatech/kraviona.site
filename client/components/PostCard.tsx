import Image from "next/image";
import { formatDate, plainText, readingTime } from "../lib/site";

export default function PostCard({
  post,
  featured = false,
  index,
}: {
  post: any;
  featured?: boolean;
  index?: number;
}) {
  const words =
    post.wordCount ||
    plainText(post.content || "")
      .split(/\s+/)
      .filter(Boolean).length;
  return (
    <article className={`story-card${featured ? " story-card--featured" : ""}`}>
      <a className="story-card__image" href={`/blog/${post.slug}`}>
        {post.featuredImage?.url ? (
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.alt || post.title}
            fill
            sizes={
              featured
                ? "(max-width: 800px) 100vw, 60vw"
                : "(max-width: 800px) 100vw, 33vw"
            }
            priority={featured}
          />
        ) : (
          <span className="image-placeholder" aria-hidden="true" />
        )}
        {typeof index === "number" && (
          <span className="story-index">{String(index).padStart(2, "0")}</span>
        )}
      </a>
      <div className="story-card__content">
        <div className="story-card__meta">
          <a
            href={
              post.category?.slug ? `/category/${post.category.slug}` : "/blog"
            }
          >
            {post.category?.name || "Journal"}
          </a>
          <span>
            {formatDate(post.publishedAt)} · {readingTime(words)} min
          </span>
        </div>
        <h2>
          <a href={`/blog/${post.slug}`}>{post.title}</a>
        </h2>
        <p>{post.quickAnswer}</p>
        <a className="read-link" href={`/blog/${post.slug}`}>
          Read story <span>↗</span>
        </a>
      </div>
    </article>
  );
}
