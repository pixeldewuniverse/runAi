import { NextRequest, NextResponse } from "next/server";
import { Anthropic } from "@anthropic-ai/sdk";
import { GenerateRequest } from "@/lib/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function getSystemPrompt(category: string): string {
  const basePrompt = `You are RunAI, an expert marketing AI assistant. Given the user's business prompt, generate a comprehensive, production-ready marketing package.

Structure your response with these XML sections (REQUIRED - use these exact tags):
<strategy>Campaign strategy, positioning, target audience analysis, competitive insights</strategy>
<copy>Headlines, taglines, body copy, call-to-action phrases, email subject lines</copy>
<calendar>30-day content calendar with specific dates, post types, and content themes</calendar>
<ads>Ad creative briefs per platform (Google, Facebook, Instagram, LinkedIn), copy variants, visual direction</ads>
<seo>Keywords clusters, meta tags, title and description suggestions, blog outline</seo>
<social>Social media kit per platform (captions, hashtags, posting strategy, content mix)</social>

Be specific, actionable, and professional. Output must be immediately usable by marketing teams.
Focus on the "${category}" category for this request.

Ensure each section is detailed, practical, and contains real, usable output that a marketer can implement immediately.`;

  return basePrompt;
}

function parseXMLResponse(content: string) {
  const parseTag = (tag: string) => {
    const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, "s");
    const match = content.match(regex);
    return match ? match[1].trim() : "";
  };

  return {
    strategy: parseTag("strategy") || "Strategy content not generated",
    copy: parseTag("copy") || "Copy content not generated",
    calendar: parseTag("calendar") || "Calendar not generated",
    ads: parseTag("ads") || "Ad briefs not generated",
    seo: parseTag("seo") || "SEO content not generated",
    social: parseTag("social") || "Social media kit not generated",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { prompt, category } = body;

    if (!prompt || !category) {
      return NextResponse.json(
        { error: "Missing prompt or category" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: getSystemPrompt(category),
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = parseXMLResponse(content);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Generation error:", error);

    if (error instanceof Error) {
      if (error.message.includes("401")) {
        return NextResponse.json(
          { error: "API key is invalid" },
          { status: 401 }
        );
      }
      if (error.message.includes("rate_limit")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate content. Please try again." },
      { status: 500 }
    );
  }
}
