import Image from "next/image";
import Link from "next/link";

export default function Hero({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  return (
    <section className="chain-hero">
      <div className="chain-hero__grid" aria-hidden="true" />
      <div className="wrap chain-hero__inner">
        <div className="chain-hero__copy">
          <div className="chain-live"><span /> {eyebrow || "Independent blockchain newsroom"}</div>
          <h1>{title || "The signal layer for the on-chain world."}</h1>
          <p>{description || "Clear, evidence-led reporting on blockchain, crypto markets, protocols, policy and Web3 infrastructure—without the hype cycle."}</p>
          <div className="chain-hero__actions">
            <Link className="signal-button" href="/blog" prefetch>Read latest news <span aria-hidden="true">↗</span></Link>
            <Link className="signal-link" href="/newsletter" prefetch>Get the weekly chain brief →</Link>
          </div>
          <div className="chain-proof" aria-label="Editorial principles">
            <span><b>01</b> Source-led</span>
            <span><b>02</b> Hype-free</span>
            <span><b>03</b> Built for clarity</span>
          </div>
        </div>
        <div className="chain-hero__visual">
          <Image
            src="/images/web3/blockchain-network-hero.webp"
            alt="A decentralized blockchain network of transparent blocks and validator nodes"
            fill
            priority
            sizes="(max-width: 639px) 0px, (max-width: 767px) 100vw, 58vw"
          />
          <span className="node-pulse node-pulse--one" aria-hidden="true" />
          <span className="node-pulse node-pulse--two" aria-hidden="true" />
          <div className="chain-hero__caption"><span>Network state</span><strong>Consensus active</strong></div>
        </div>
      </div>
    </section>
  );
}
