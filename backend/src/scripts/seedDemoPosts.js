import "dotenv/config";
import mongoose from "mongoose";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Category, Post, SiteSettings } from "../models/index.js";

const siteUrl = "https://kraviona.site";
const images = {
  network: "/images/web3/blockchain-network-hero.webp",
  defi: "/images/web3/defi-liquidity.webp",
  security: "/images/web3/protocol-security.webp",
};

const categories = [
  {
    name: "Blockchain",
    slug: "blockchain",
    description: "Blockchain fundamentals, adoption and the systems moving verifiable data and value on-chain.",
  },
  {
    name: "Markets & DeFi",
    slug: "markets-defi",
    description: "Crypto market structure, stablecoins, decentralized finance and tokenized real-world assets.",
  },
  {
    name: "Protocols & Infrastructure",
    slug: "protocols-infrastructure",
    description: "Layer 1 and Layer 2 networks, interoperability, data availability, wallets and developer infrastructure.",
  },
  {
    name: "Security",
    slug: "security",
    description: "Smart-contract risk, custody, audits, exploits and the engineering of resilient decentralized systems.",
  },
  {
    name: "Policy & Regulation",
    slug: "policy-regulation",
    description: "Digital-asset policy, compliance and the rules shaping blockchain adoption across global markets.",
  },
];

const articles = [
  {
    title: "Blockchain Finality Explained: When a Transaction Is Truly Settled",
    slug: "blockchain-finality-explained",
    category: "Blockchain",
    quickAnswer: "Finality is the point at which a blockchain transaction can no longer be reversed under the network's rules, but different consensus systems reach that assurance in different ways.",
    image: images.network,
    tags: ["blockchain finality", "consensus", "proof of stake", "settlement"],
    takeaways: [
      "Confirmation count and finality are related, but they are not identical.",
      "Probabilistic finality grows stronger over time; deterministic finality arrives after a defined consensus event.",
      "Bridges, exchanges and applications should set confirmation policies around the value and risk of each transaction.",
    ],
    sections: [
      ["Finality is a risk boundary", "A transaction appearing in a block is not always the end of the story. Some networks can reorganize their recent history when validators or miners produce a competing chain. Finality describes the point after which the protocol treats reversal as impossible or economically unrealistic. For users, that distinction determines when funds are spendable. For exchanges and bridges, it determines when an incoming transfer is safe to credit."],
      ["Probabilistic and deterministic models", "Proof-of-work networks generally offer probabilistic finality: every additional block makes a reorganization less likely, without producing a single universal instant of certainty. Many proof-of-stake networks add checkpoints or validator votes that produce deterministic or economic finality. Reverting a finalized block would require breaking protocol rules, destroying a large amount of stake, or coordinating an exceptional recovery."],
      ["Why applications wait", "A wallet may show a payment within seconds while a high-value exchange deposit remains pending. Both interfaces can be correct because they apply different risk thresholds. A coffee payment and a cross-chain bridge transfer do not carry the same consequence if the chain reorganizes. Responsible applications explain what pending, confirmed and finalized mean instead of presenting every visible transaction as settled."],
      ["How to evaluate finality claims", "Compare the network's block time, the mechanism that finalizes checkpoints, the validator assumptions and its history under stress. Marketing claims about transactions per second say little about settlement assurance. The useful question is how quickly a transaction becomes irreversible, what conditions can delay that state and what an application does when those conditions fail."],
    ],
  },
  {
    title: "The Stablecoin Stack: How Digital Dollars Move On-Chain",
    slug: "stablecoin-stack-digital-dollars-on-chain",
    category: "Markets & DeFi",
    quickAnswer: "A stablecoin is only the visible asset at the top of a larger stack that includes reserves or collateral, issuers, blockchains, exchanges, wallets, market makers and redemption rails.",
    image: images.defi,
    tags: ["stablecoins", "DeFi", "digital dollars", "on-chain payments"],
    takeaways: [
      "Price stability depends on credible issuance, liquid markets and reliable redemption.",
      "The same stablecoin can carry different operational risks across chains and bridges.",
      "Supply growth is not automatically equivalent to new investment demand.",
    ],
    sections: [
      ["The token is the interface", "Stablecoins make a familiar unit of account programmable. A token can move between wallets around the clock, settle inside decentralized applications and act as collateral without depending on bank operating hours. Yet the token contract is only one layer. Users also rely on the issuer or collateral system, the chain that records ownership and the venues that provide liquidity."],
      ["Three routes to stability", "Fiat-backed stablecoins aim to match circulating tokens with cash and short-duration reserve assets. Crypto-collateralized designs use on-chain assets and overcollateralization to absorb volatility. Algorithmic designs rely more heavily on incentives and market operations. Each model exposes users to a different combination of issuer, collateral, liquidity, governance and smart-contract risk."],
      ["Minting, markets and redemption", "A stablecoin holds its price when professional participants can create or redeem supply near its target value and when secondary markets remain deep enough to absorb demand. If redemption becomes uncertain or expensive, the market price can separate from the peg. Readers should therefore examine reserve disclosures, redemption eligibility, chain distribution and trading concentration together rather than relying on a single headline number."],
      ["Reading on-chain supply correctly", "Rising supply may reflect trading activity, cross-border settlement, treasury management or capital moving from another stablecoin. It does not by itself reveal user growth or market direction. Better analysis combines issuance data with transfer volume, active addresses, exchange balances, bridge flows and the share of activity created by a small number of entities."],
    ],
  },
  {
    title: "Layer 2 Networks: The Trade-Offs Behind Faster Blockchain Execution",
    slug: "layer-2-networks-scaling-tradeoffs",
    category: "Protocols & Infrastructure",
    quickAnswer: "Layer 2 networks move execution away from a base chain while using that base layer for some combination of settlement, data availability and dispute resolution.",
    image: images.network,
    tags: ["layer 2", "rollups", "blockchain scaling", "data availability"],
    takeaways: [
      "Lower transaction fees do not eliminate the cost of publishing data and proving state transitions.",
      "Users should understand sequencer, bridge and upgrade-key assumptions.",
      "A network's exit path matters as much as its headline throughput.",
    ],
    sections: [
      ["Scaling by separating responsibilities", "A base blockchain asks many independent nodes to verify the same work. That redundancy supports trust minimization but limits capacity. Layer 2 systems execute batches of transactions elsewhere and submit compressed data or proofs back to a settlement layer. The architecture can reduce fees while preserving more security than an entirely independent sidechain."],
      ["Optimistic and validity proofs", "Optimistic rollups generally assume submitted state is correct unless someone challenges it during a dispute window. Validity rollups attach a cryptographic proof showing that a state transition followed the rules. Neither label describes the whole risk profile. Data availability, bridge design, sequencer operation, governance controls and the maturity of proof systems remain essential."],
      ["The bridge is part of the product", "Users enter a Layer 2 through deposits and leave through withdrawals. If the canonical bridge is slow, paused or controlled by upgrade keys, those constraints affect the practical security of funds. Third-party bridges can improve speed but introduce separate liquidity and smart-contract assumptions. A credible assessment names each dependency instead of treating the rollup as a single component."],
      ["Metrics that reveal real usage", "Transaction count can be inflated by inexpensive automated activity. Total value locked can move with token prices or incentives. More useful comparisons include fee revenue, data costs, stablecoin settlement, active applications, withdrawal behavior and whether usage persists after rewards end. Scaling is valuable when it supports durable economic activity, not merely a larger counter."],
    ],
  },
  {
    title: "Smart-Contract Security: A Practical Framework for Reading Protocol Risk",
    slug: "smart-contract-security-protocol-risk-framework",
    category: "Security",
    quickAnswer: "Protocol risk is broader than code quality: it includes economic incentives, privileged access, oracle design, dependencies, operational controls and the ability to respond when assumptions fail.",
    image: images.security,
    tags: ["smart contract security", "protocol risk", "audits", "crypto custody"],
    takeaways: [
      "An audit reduces uncertainty but does not certify a protocol as safe.",
      "Admin keys, oracles and external integrations expand the attack surface beyond the core contracts.",
      "Position size should reflect both technical risk and the protocol's ability to recover from failure.",
    ],
    sections: [
      ["Start with the trust map", "Every protocol has a set of actors and systems that can change outcomes. Administrators may upgrade contracts, guardians may pause withdrawals, oracles may determine prices and bridges may carry assets from another chain. Mapping these powers is more informative than repeating that a project is decentralized. The practical question is who can do what, under which delay and with what public visibility."],
      ["What audits can and cannot do", "A professional audit reviews a defined code version within a limited period. It may uncover implementation flaws and improve testing, but it cannot guarantee that every future integration, governance change or market condition is safe. Strong teams publish audit scope, unresolved findings, deployment addresses and changes made after review. A logo on a website provides much less evidence."],
      ["Economic attacks look valid on-chain", "Not every exploit breaks a programming rule. An attacker may manipulate a thin market, borrow capital briefly, influence an oracle and execute transactions that the contracts accept as valid. Risk analysis must therefore test incentives and liquidity assumptions alongside code. Conservative parameters, circuit breakers and diverse price sources can limit the damage when markets behave unexpectedly."],
      ["A repeatable reader checklist", "Check contract age, value at risk, upgrade controls, bug-bounty coverage, oracle dependencies, bridge exposure and incident history. Confirm addresses through official sources and use transaction simulation where available. Most importantly, separate protocol quality from position sizing. Even carefully engineered systems can fail, so exposure should remain survivable."],
    ],
  },
  {
    title: "Digital-Asset Regulation: How to Read Policy Headlines Without the Noise",
    slug: "digital-asset-regulation-policy-headlines",
    category: "Policy & Regulation",
    quickAnswer: "A digital-asset policy announcement matters only after identifying the jurisdiction, legal instrument, affected activity, implementation date and whether the text is proposed, adopted or enforceable.",
    image: images.security,
    tags: ["crypto regulation", "digital asset policy", "compliance", "Web3 law"],
    takeaways: [
      "A consultation, bill, court opinion and final rule have very different legal effects.",
      "Rules often regulate intermediaries or activities rather than blockchain software itself.",
      "Primary documents and effective dates matter more than viral summaries.",
    ],
    sections: [
      ["First identify the legal stage", "Policy coverage often compresses a long process into a binary headline. A regulator's speech may signal direction without changing obligations. A consultation requests feedback. A bill can still be amended or fail to pass. A final rule may include a delayed compliance date. Readers should identify the document type before deciding that an activity has become legal, banned or newly regulated."],
      ["Separate assets, actors and activities", "The same framework can treat token issuance, exchange custody, payments, staking and decentralized software differently. A requirement aimed at a licensed intermediary may not apply directly to a self-custody wallet user. Conversely, calling a system decentralized does not automatically remove the obligations of a company operating a front end or controlling access. Precise reporting states who is covered."],
      ["Jurisdiction changes the conclusion", "Digital assets move globally, but laws remain territorial. A court decision in one country may influence debate elsewhere without creating a global precedent. Businesses also face overlapping rules concerning securities, commodities, payments, sanctions, taxation and consumer protection. Useful analysis avoids turning a local development into a universal claim."],
      ["A disciplined policy checklist", "Open the primary document, confirm its date and status, identify the authority issuing it and note any implementation timeline. Then compare the text with prior rules and credible legal analysis. Price reactions can show market sentiment, but they do not prove the long-term effect. Policy reporting is strongest when it makes uncertainty visible instead of filling gaps with prediction."],
    ],
  },
];

const faqs = [
  { question: "Is this investment advice?", answer: "No. Kraviona provides independent news and educational analysis, not personalized investment, legal or tax advice." },
  { question: "How should readers verify a claim?", answer: "Use the linked primary source, confirm the network or contract involved and check whether newer information has changed the conclusion." },
  { question: "Why do blockchain risks change quickly?", answer: "Protocols are upgradeable, integrations evolve and market conditions can expose assumptions that were not visible under normal activity." },
];

const renderContent = (article) => [
  `<p>${article.quickAnswer}</p>`,
  ...article.sections.map(([title, body]) => `<h2>${title}</h2><p>${body}</p>`),
  `<h2>The Kraviona view</h2><p>Good blockchain analysis makes assumptions visible. Treat every metric, architecture claim and policy headline as the beginning of verification—not the end. Follow primary sources, distinguish protocol design from market narrative and size every conclusion to the quality of the available evidence.</p>`,
].join("");

export async function seedWeb3({ manageConnection = true } = {}) {
if (manageConnection) await mongoose.connect(process.env.MONGO_URI);
const categoryMap = {};
for (const category of categories) {
  categoryMap[category.name] = await Category.findOneAndUpdate(
    { slug: category.slug },
    {
      ...category,
      seo: {
        metaTitle: `${category.name} News & Analysis | Kraviona`.slice(0, 60),
        metaDescription: category.description.slice(0, 160),
        canonicalUrl: `${siteUrl}/category/${category.slug}`,
        isNoIndex: false,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );
}

for (let index = 0; index < articles.length; index += 1) {
  const article = articles[index];
  await Post.findOneAndUpdate(
    { slug: article.slug },
    {
      title: article.title,
      slug: article.slug,
      status: "published",
      content: renderContent(article),
      quickAnswer: article.quickAnswer,
      keyTakeaways: article.takeaways,
      faqs,
      category: categoryMap[article.category]._id,
      tags: article.tags,
      featuredImage: {
        url: article.image,
        alt: `${article.title} — Kraviona blockchain editorial illustration`,
      },
      author: {
        name: "Kraviona Editorial Team",
        slug: "kraviona-editorial-team",
        sameAs: [siteUrl],
      },
      seo: {
        metaTitle: article.title.slice(0, 60),
        metaDescription: article.quickAnswer.slice(0, 160),
        canonicalUrl: `${siteUrl}/blog/${article.slug}`,
        isNoIndex: false,
        ogImage: article.image,
      },
      generatedBy: "manual",
      publishedAt: new Date(Date.now() - index * 86400000),
    },
    { upsert: true, new: true, runValidators: true },
  );
}

await SiteSettings.findOneAndUpdate(
  { key: "primary" },
  {
    $set: {
      tagline: "Blockchain intelligence without the hype",
      heroEyebrow: "Independent blockchain newsroom",
      heroTitle: "The signal layer for the on-chain world.",
      heroDescription: "Clear, evidence-led reporting on blockchain, crypto markets, protocols, policy and Web3 infrastructure.",
      briefingTitle: "Web3 signal, delivered weekly.",
      briefingDescription: "The consequential blockchain news and protocol shifts, in one focused weekly briefing.",
      defaultSeo: {
        title: "Kraviona — Blockchain & Web3 News and Analysis",
        description: "Independent blockchain and Web3 news covering crypto markets, DeFi, protocols, regulation, security and digital assets.",
        ogImage: images.network,
      },
    },
  },
  { upsert: true, new: true, runValidators: true },
);

console.log(`Seeded ${articles.length} blockchain stories across ${categories.length} Web3 categories.`);
if (manageConnection) await mongoose.disconnect();
}

export async function ensureWeb3Publication() {
  const [categoryCount, hasLeadStory] = await Promise.all([
    Category.countDocuments({ slug: { $in: categories.map(({ slug }) => slug) } }),
    Post.exists({ slug: articles[0].slug }),
  ]);
  if (categoryCount === categories.length && hasLeadStory) return;
  await seedWeb3({ manageConnection: false });
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  await seedWeb3();
}
