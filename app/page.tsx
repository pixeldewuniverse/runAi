"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FeatureCard } from "@/components/features/FeatureCard";
import { PricingCard } from "@/components/features/PricingCard";
import { useState } from "react";

export default function Home() {
  const [activeUseCase, setActiveUseCase] = useState("product_launch");

  const useCases = [
    {
      id: "product_launch",
      label: "Product Launch",
      prompt: "We are launching a new AI-powered marketing automation tool for SMBs",
      preview:
        "Full go-to-market strategy, launch timeline, press release, social teasers...",
    },
    {
      id: "brand_awareness",
      label: "Brand Awareness",
      prompt: "Tech startup in B2B SaaS space, founded 2 years ago",
      preview:
        "Brand positioning, messaging framework, content pillars, channel strategy...",
    },
    {
      id: "lead_generation",
      label: "Lead Generation",
      prompt:
        "E-commerce platform targeting online store owners, focus on free trial signups",
      preview:
        "Lead magnet ideas, email sequences, landing page copy, conversion funnel...",
    },
    {
      id: "event_marketing",
      label: "Event Marketing",
      prompt: "Virtual summit for SaaS founders, 500 expected attendees",
      preview:
        "Promotion timeline, speaker outreach, email drip campaign, event day guide...",
    },
    {
      id: "content_marketing",
      label: "Content Marketing",
      prompt:
        "Financial services firm, targeting millennial investors with education content",
      preview:
        "Content calendar, article angles, SEO strategy, distribution plan...",
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

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-purple rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-brand-teal rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-orange rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <Container>
          <div className="text-center max-w-4xl mx-auto space-y-6 md:space-y-8">
            <h1 className="text-display-h1 font-bold leading-tight">
              One Prompt.{" "}
              <span className="bg-gradient-to-r from-brand-purple to-brand-teal bg-clip-text text-transparent">
                Everything Done.
              </span>
            </h1>
            <p className="text-body-large text-brand-text-muted max-w-2xl mx-auto">
              RunAI generates complete marketing campaigns, copy, strategy, and
              assets — end-to-end, from a single detailed prompt.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
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

          {/* Floating preview card */}
          <div className="mt-12 md:mt-20">
            <Card glass glow="purple" className="p-6 md:p-8 max-w-2xl mx-auto">
              <div className="space-y-4">
                <div className="text-sm font-semibold text-brand-purple">
                  Example Output
                </div>
                <div className="text-sm text-brand-white space-y-2">
                  <p>
                    <span className="font-semibold">Input:</span> &quot;We sell
                    eco-friendly water bottles to young professionals...&quot;
                  </p>
                  <p className="pt-2">
                    <span className="font-semibold">Output:</span>
                  </p>
                  <ul className="text-brand-text-muted space-y-1 ml-4">
                    <li>✓ Campaign strategy & positioning</li>
                    <li>✓ 5 headline variations</li>
                    <li>✓ 30-day social media calendar</li>
                    <li>✓ Ad copy for 3 platforms</li>
                    <li>✓ 15 SEO keywords with meta tags</li>
                    <li>✓ Instagram & TikTok content kit</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-black border-t border-brand-border">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-h2 font-bold mb-4">
              Everything Generated. Nothing Manual.
            </h2>
            <p className="text-body-large text-brand-text-muted max-w-2xl mx-auto">
              Get everything you need to launch a marketing campaign
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon="📣"
              title="Full Campaign Strategy"
              description="Target audience analysis, positioning, messaging framework, competitive insights"
            />
            <FeatureCard
              icon="✍️"
              title="Copy & Content"
              description="Headlines, body copy, CTAs, email sequences, and messaging variations"
            />
            <FeatureCard
              icon="🎯"
              title="Ad Creative Brief"
              description="Visual direction, copy variants, platform specs for all major networks"
            />
            <FeatureCard
              icon="📊"
              title="Content Calendar"
              description="30-day plan with specific dates, post types, and content themes"
            />
            <FeatureCard
              icon="🔍"
              title="SEO & Keywords"
              description="Keyword clusters, meta tags, title suggestions, and blog outlines"
            />
            <FeatureCard
              icon="📱"
              title="Social Media Kit"
              description="Captions, hashtags, posting strategy, and content mix per platform"
            />
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-32 border-t border-brand-border">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-h2 font-bold">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
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
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-brand-purple text-brand-white font-bold">
                      {item.step}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-h3 font-semibold mb-2">{item.title}</h3>
                    <p className="text-body text-brand-text-muted">
                      {item.description}
                    </p>
                  </div>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-6 right-0 translate-x-[calc(100%+32px)] w-8 h-0.5 bg-gradient-to-r from-brand-teal to-transparent" />
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-20 md:py-32 border-t border-brand-border">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-h2 font-bold">Built for Every Marketing Need</h2>
          </div>

          <div className="space-y-8">
            <div className="flex flex-wrap gap-3 justify-center">
              {useCases.map((useCase) => (
                <button
                  key={useCase.id}
                  onClick={() => setActiveUseCase(useCase.id)}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    activeUseCase === useCase.id
                      ? "bg-brand-purple text-brand-white"
                      : "bg-brand-surface border border-brand-border text-brand-text-muted hover:border-brand-border-hover"
                  }`}
                >
                  {useCase.label}
                </button>
              ))}
            </div>

            {useCases.map((useCase) => (
              <div
                key={useCase.id}
                className={`space-y-4 transition-all ${
                  activeUseCase === useCase.id ? "block" : "hidden"
                }`}
              >
                <Card glass glow="teal">
                  <div className="space-y-4">
                    <div>
                      <p className="text-label text-brand-purple font-semibold mb-2">
                        Example Prompt
                      </p>
                      <p className="text-body text-brand-white">
                        {useCase.prompt}
                      </p>
                    </div>
                    <div className="border-t border-brand-border pt-4">
                      <p className="text-label text-brand-teal font-semibold mb-2">
                        Generated Output Preview
                      </p>
                      <p className="text-body text-brand-text-muted">
                        {useCase.preview}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-32 border-t border-brand-border">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-h2 font-bold">Loved by Marketing Teams</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} glass glow="teal">
                <p className="text-body text-brand-white mb-4 italic">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div className="border-t border-brand-border pt-4">
                  <p className="font-semibold text-brand-white text-sm">
                    {testimonial.author}
                  </p>
                  <p className="text-label text-brand-text-muted">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-32 border-t border-brand-border">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-h2 font-bold">Simple, Transparent Pricing</h2>
            <p className="text-body-large text-brand-text-muted mt-2">
              No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            <PricingCard
              name="Free"
              price="$0"
              description="Perfect for trying it out"
              features={[
                "3 generations/month",
                "All export formats",
                "Standard output quality",
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
