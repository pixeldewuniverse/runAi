"use client";

import Link from "next/link";
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FeatureCard } from "@/components/features/FeatureCard";
import { PricingCard } from "@/components/features/PricingCard";

/* ─── data ─────────────────────────────────────────────────────── */

const features = [
  {
    icon: "📣",
    title: "Full Campaign Strategy",
    description:
      "Target audience analysis, positioning, messaging framework, competitive insights",
  },
  {
    icon: "✍️",
    title: "Copy & Content",
    description:
      "Headlines, body copy, CTAs, email sequences, and messaging variations",
  },
  {
    icon: "🎯",
    title: "Ad Creative Brief",
    description:
      "Visual direction, copy variants, platform specs for all major networks",
  },
  {
    icon: "📊",
    title: "Content Calendar",
    description: "30-day plan with specific dates, post types, and themes",
  },
  {
    icon: "🔍",
    title: "SEO & Keywords",
    description:
      "Keyword clusters, meta tags, title suggestions, and blog outlines",
  },
  {
    icon: "📱",
    title: "Social Media Kit",
    description:
      "Captions, hashtags, posting strategy, and content mix per platform",
  },
];

const howItWorks = [
  {
    step: 1,
    title: "Write Your Prompt",
    description:
      "Describe your business, product, target audience, goals, tone, and any specific requirements.",
  },
  {
    step: 2,
    title: "AI Processes Everything",
    description:
      "RunAI analyzes your input and generates a complete marketing package across all categories.",
  },
  {
    step: 3,
    title: "Get Complete Results",
    description:
      "Download or copy all output. Everything is production-ready and immediately actionable.",
  },
];

const useCases = [
  {
    id: "product_launch",
    label: "Product Launch",
    prompt:
      "We are launching a new AI-powered marketing automation tool for SMBs.",
    preview:
      "Full go-to-market strategy, launch timeline, press release, social teasers, email drip, ad briefs for Google & Meta.",
  },
  {
    id: "brand_awareness",
    label: "Brand Awareness",
    prompt: "Tech startup in B2B SaaS space, founded 2 years ago.",
    preview:
      "Brand positioning, messaging framework, content pillars, channel strategy, PR angles.",
  },
  {
    id: "lead_generation",
    label: "Lead Generation",
    prompt:
      "E-commerce platform targeting online store owners, focus on free trial signups.",
    preview:
      "Lead magnet ideas, email sequences, landing page copy, conversion funnel, retargeting strategy.",
  },
  {
    id: "event_marketing",
    label: "Event Marketing",
    prompt: "Virtual summit for SaaS founders, 500 expected attendees.",
    preview:
      "Promotion timeline, speaker outreach templates, email drip campaign, event day social kit.",
  },
  {
    id: "content_marketing",
    label: "Content Marketing",
    prompt:
      "Financial services firm targeting millennial investors with education content.",
    preview:
      "Content calendar, article angles, SEO strategy, distribution plan, newsletter templates.",
  },
];

const testimonials = [
  {
    quote:
      "RunAI saved us weeks of brainstorming and strategy work. We went from idea to campaign in hours.",
    author: "Sarah Chen",
    role: "Marketing Director",
    company: "TechStart Inc",
  },
  {
    quote:
      "The quality of generated copy is production-ready. Our team loves using it as a starting point.",
    author: "Michael Rodriguez",
    role: "Growth Lead",
    company: "Commerce Labs",
  },
  {
    quote:
      "Finally a tool that understands what we need in marketing output. Absolutely game-changing.",
    author: "Emily Watson",
    role: "CMO",
    company: "Digital Ventures",
  },
];

/* ─── page ─────────────────────────────────────────────────────── */

export default function Home() {
  const [activeUseCase, setActiveUseCase] = useState("product_launch");

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-24 md:py-36">
        {/* animated orbs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="animate-orb-1 absolute top-1/4 left-1/4 w-[480px] h-[480px] rounded-full bg-brand-purple blur-[120px] opacity-25" />
          <div className="animate-orb-2 absolute top-1/3 right-1/4 w-[420px] h-[420px] rounded-full bg-brand-teal blur-[100px] opacity-20" />
          <div className="animate-orb-3 absolute bottom-0 right-10 w-[320px] h-[320px] rounded-full bg-brand-orange blur-[100px] opacity-15" />
        </div>

        <Container>
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <h1 className="text-display-h1 font-bold leading-tight text-white">
              One Prompt.{" "}
              <span className="bg-gradient-to-r from-brand-purple to-brand-teal bg-clip-text text-transparent">
                Everything Done.
              </span>
            </h1>

            <p className="text-body-large text-white/60 max-w-2xl mx-auto">
              RunAI generates complete marketing campaigns, copy, strategy, and
              assets — end-to-end, from a single detailed prompt.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link href="/generate">
                <Button variant="primary" size="lg">
                  Generate Now
                </Button>
              </Link>
              <Button variant="ghost" size="lg">
                See Example
              </Button>
            </div>
          </div>

          {/* floating demo card */}
          <div className="mt-16 max-w-2xl mx-auto">
            <Card glass glow="purple">
              <p className="text-label font-semibold text-brand-purple mb-3">
                Example Output Preview
              </p>
              <p className="text-sm text-white mb-3">
                <span className="font-semibold">Input:</span>{" "}
                <span className="text-white/70">
                  &quot;We sell eco-friendly water bottles to young
                  professionals who care about sustainability…&quot;
                </span>
              </p>
              <div className="border-t border-brand-border pt-3 space-y-1">
                {[
                  "✓ Campaign strategy & target audience positioning",
                  "✓ 5 headline variations + body copy",
                  "✓ 30-day social media content calendar",
                  "✓ Ad copy briefs for Google, Meta & LinkedIn",
                  "✓ 15 SEO keywords with meta tags",
                  "✓ Instagram & TikTok content kit",
                ].map((line) => (
                  <p key={line} className="text-sm text-white/60">
                    {line}
                  </p>
                ))}
              </div>
            </Card>
          </div>
        </Container>
      </section>

      {/* ── Features ── */}
      <section
        id="features"
        className="py-20 md:py-32 border-t border-brand-border"
      >
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-h2 font-bold text-white mb-4">
              Everything Generated. Nothing Manual.
            </h2>
            <p className="text-body-large text-white/60 max-w-xl mx-auto">
              Get everything you need to launch a marketing campaign — from
              strategy to captions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </Container>
      </section>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        className="py-20 md:py-32 border-t border-brand-border"
      >
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-h2 font-bold text-white">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {howItWorks.map((item, idx) => (
              <div key={item.step} className="flex gap-4">
                <div className="shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-md bg-brand-teal text-black font-bold text-lg">
                    {item.step}
                  </div>
                </div>
                <div>
                  <h3 className="text-h3 font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-5 right-[calc(33.33%-16px)] translate-x-1/2 w-8 h-px bg-brand-teal/40" />
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Use Cases ── */}
      <section
        id="use-cases"
        className="py-20 md:py-32 border-t border-brand-border"
      >
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-h2 font-bold text-white">
              Built for Every Marketing Need
            </h2>
          </div>

          {/* tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {useCases.map((uc) => (
              <button
                key={uc.id}
                onClick={() => setActiveUseCase(uc.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeUseCase === uc.id
                    ? "bg-brand-purple text-white"
                    : "bg-brand-surface border border-brand-border text-white/60 hover:border-brand-border-hover hover:text-white"
                }`}
              >
                {uc.label}
              </button>
            ))}
          </div>

          {useCases.map((uc) =>
            uc.id === activeUseCase ? (
              <Card key={uc.id} glass glow="teal" className="max-w-3xl mx-auto">
                <p className="text-label font-semibold text-brand-purple mb-1">
                  Example Prompt
                </p>
                <p className="text-sm text-white mb-4">{uc.prompt}</p>
                <div className="border-t border-brand-border pt-4">
                  <p className="text-label font-semibold text-brand-teal mb-1">
                    Generated Output Preview
                  </p>
                  <p className="text-sm text-white/60">{uc.preview}</p>
                </div>
              </Card>
            ) : null
          )}
        </Container>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 md:py-32 border-t border-brand-border">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-h2 font-bold text-white">
              Loved by Marketing Teams
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <Card key={t.author} glass glow="teal">
                <p className="text-sm text-white/80 italic mb-4 leading-relaxed">
                  &quot;{t.quote}&quot;
                </p>
                <div className="border-t border-brand-border pt-4">
                  <p className="font-semibold text-white text-sm">
                    {t.author}
                  </p>
                  <p className="text-label text-white/50">
                    {t.role} · {t.company}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Pricing ── */}
      <section
        id="pricing"
        className="py-20 md:py-32 border-t border-brand-border"
      >
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-h2 font-bold text-white">
              Simple, Transparent Pricing
            </h2>
            <p className="text-body-large text-white/60 mt-2">
              No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            <PricingCard
              name="Free"
              price="$0"
              description="Perfect for trying it out"
              features={[
                "3 generations / month",
                "All 6 output sections",
                "TXT & MD export",
              ]}
              cta="Get Started"
            />
            <PricingCard
              name="Pro"
              price="$29"
              description="Most popular for individuals"
              highlighted
              features={[
                "Unlimited generations",
                "Priority processing",
                "All export formats",
                "API access",
                "Custom templates",
              ]}
              cta="Start Free Trial"
            />
            <PricingCard
              name="Enterprise"
              price="Custom"
              description="For large teams"
              features={[
                "Custom solutions",
                "Dedicated support",
                "Team collaboration",
                "Advanced analytics",
                "Custom integrations",
              ]}
              cta="Contact Sales"
            />
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
