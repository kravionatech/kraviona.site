import "dotenv/config";
import mongoose from "mongoose";
import { Category, Post } from "../models/index.js";

const categories = [
  [
    "Technology",
    "technology",
    "How emerging technology changes the way we build and work.",
  ],
  [
    "Growth",
    "growth",
    "Durable strategies for products, audiences, and businesses.",
  ],
  ["Work", "work", "Better systems for focused, meaningful professional work."],
  [
    "Ideas",
    "ideas",
    "Mental models and original perspectives for clearer decisions.",
  ],
];

const articles = [
  [
    "The Quiet Revolution in AI-Native Workflows",
    "ai-native-workflows",
    "Technology",
    "AI is most valuable when it disappears into a well-designed workflow instead of becoming another distracting tool.",
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80",
  ],
  [
    "Why Small Teams Keep Beating Bigger Companies",
    "small-teams-big-advantage",
    "Growth",
    "Small teams win through speed, context, and a shared understanding of what truly matters to customers.",
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=80",
  ],
  [
    "A Practical System for Doing Deep Work",
    "practical-deep-work-system",
    "Work",
    "Deep work becomes reliable when your environment, calendar, and definition of done all support concentration.",
    "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1400&q=80",
  ],
  [
    "The Compounding Value of Clear Writing",
    "compounding-value-clear-writing",
    "Ideas",
    "Clear writing improves decisions because it forces assumptions, tradeoffs, and unanswered questions into view.",
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=80",
  ],
  [
    "Build an Audience Before You Build a Product",
    "audience-before-product",
    "Growth",
    "An engaged audience gives founders the insight and distribution needed to build products people already want.",
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80",
  ],
  [
    "What Comes After the Chatbot Era",
    "after-the-chatbot-era",
    "Technology",
    "The next generation of AI products will act through interfaces and workflows rather than waiting inside a chat window.",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80",
  ],
  [
    "The Weekly Review That Actually Works",
    "weekly-review-that-works",
    "Work",
    "A useful weekly review closes open loops, surfaces constraints, and produces a believable plan for the week ahead.",
    "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1400&q=80",
  ],
  [
    "Good Strategy Starts With Subtraction",
    "strategy-starts-with-subtraction",
    "Ideas",
    "Strategy becomes useful only when it makes clear what you will deliberately stop doing.",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80",
  ],
  [
    "A Founder’s Guide to Sustainable Organic Growth",
    "founders-guide-organic-growth",
    "Growth",
    "Organic growth comes from matching useful content to real customer questions and building trust over time.",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80",
  ],
  [
    "Designing a Personal Knowledge System",
    "personal-knowledge-system",
    "Work",
    "A personal knowledge system should make useful ideas easy to capture, connect, retrieve, and apply.",
    "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1400&q=80",
  ],
];

const section = (title, subject) =>
  `<h2>${title}</h2><p>${subject} The strongest approach begins with a clear outcome and a small number of constraints. Instead of collecting more tools, identify the repeated decision or behavior that creates progress. Make that action easy to begin, visible while it is happening, and simple to review afterward.</p><p>Good systems improve through evidence. Pay attention to where momentum slows, which assumptions fail, and what people actually do rather than what the plan expected. Each cycle should leave the process slightly clearer and more useful than before.</p>`;

await mongoose.connect(process.env.MONGO_URI);
const categoryMap = {};
for (const [name, slug, description] of categories) {
  categoryMap[name] = await Category.findOneAndUpdate(
    { slug },
    {
      name,
      slug,
      description,
      seo: {
        metaTitle: `${name} ideas and guides`,
        metaDescription: description,
        canonicalUrl: `${process.env.CLIENT_URL}/category/${slug}`,
      },
    },
    { upsert: true, new: true },
  );
}

for (let i = 0; i < articles.length; i++) {
  const [title, slug, category, quickAnswer, image] = articles[i];
  const content = `<p>${quickAnswer}</p>${section("Start with the real constraint", quickAnswer)}${section("Turn the idea into a repeatable practice", "Practical change happens when an idea becomes a behavior that fits real life.")} ${section("Measure what improves", "Progress needs a small set of signals connected to the outcome you care about.")}<h2>The bottom line</h2><p>${quickAnswer} Begin with one deliberate change, review what happens, and improve the system from evidence rather than intuition alone.</p>`;
  await Post.findOneAndUpdate(
    { slug },
    {
      title,
      slug,
      status: "published",
      content,
      quickAnswer,
      keyTakeaways: [
        "Start with a specific outcome, not a new tool.",
        "Reduce the number of active priorities.",
        "Design the environment around the desired behavior.",
        "Review evidence on a consistent rhythm.",
        "Improve the system one constraint at a time.",
      ],
      faqs: [
        [
          "Where should I begin?",
          "Begin with one recurring problem and define the outcome you want to see.",
        ],
        [
          "How quickly should results appear?",
          "Look for behavioral signals within weeks and durable outcomes over a longer cycle.",
        ],
        [
          "Do I need special software?",
          "No. A simple, consistently used system is usually more valuable than complex software.",
        ],
        [
          "What should I measure?",
          "Measure the few behaviors and outcomes most closely connected to meaningful progress.",
        ],
        [
          "How often should I review it?",
          "A short weekly review is frequent enough for most personal and team systems.",
        ],
        [
          "What is the most common mistake?",
          "Adding complexity before understanding the actual constraint is the most common mistake.",
        ],
        [
          "How do I make the change last?",
          "Attach the new behavior to an existing rhythm and make progress visible.",
        ],
      ].map(([question, answer]) => ({ question, answer })),
      category: categoryMap[category]._id,
      tags: [category.toLowerCase(), "strategy", "practical guide"],
      featuredImage: {
        url: image,
        alt: `${title} — Kraviona editorial illustration`,
      },
      author: {
        name: "Kraviona Editorial Team",
        slug: "kraviona-editorial-team",
        sameAs: [`${process.env.CLIENT_URL}/about`],
      },
      seo: {
        metaTitle: title.slice(0, 60),
        metaDescription: quickAnswer.slice(0, 160),
        canonicalUrl: `${process.env.CLIENT_URL}/blog/${slug}`,
        isNoIndex: false,
        ogImage: image,
      },
      generatedBy: "manual",
      publishedAt: new Date(Date.now() - i * 86400000),
    },
    { upsert: true, new: true, runValidators: true },
  );
}
console.log(
  `Seeded ${articles.length} demo posts across ${categories.length} categories.`,
);
await mongoose.disconnect();
