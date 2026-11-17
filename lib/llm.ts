import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { getAgent, type AgentId } from "./agents";
import { mockOutput } from "./mock";

export const hasClaude = () => Boolean(process.env.ANTHROPIC_API_KEY);

const MODEL = () => process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic());

interface RunOpts<S extends z.ZodType> {
  agent: AgentId;
  /** Brand profile + task-specific context. */
  prompt: string;
  schema: S;
  /** Let the agent use Claude's web search tool (Scout & Researcher). */
  webSearch?: boolean;
  maxTokens?: number;
}

/**
 * One agent turn = one Claude call with a JSON schema for the answer.
 * Without ANTHROPIC_API_KEY it returns realistic demo data so the whole
 * office can be clicked through locally.
 */
export async function runAgent<S extends z.ZodType>(opts: RunOpts<S>): Promise<z.infer<S>> {
  if (!hasClaude()) {
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 900));
    return opts.schema.parse(mockOutput(opts.agent, opts.prompt));
  }

  const agent = getAgent(opts.agent);
  const base = {
    model: MODEL(),
    max_tokens: opts.maxTokens ?? 4000,
    system: agent.system,
    messages: [{ role: "user" as const, content: opts.prompt }],
    output_config: { format: zodOutputFormat(opts.schema) },
  };

  const useSearch = opts.webSearch && process.env.ENABLE_WEB_SEARCH !== "false";
  try {
    const msg = await anthropic().messages.parse(
      useSearch
        ? { ...base, tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }] }
        : base,
    );
    if (msg.parsed_output == null) throw new Error(`${agent.name}: jawaban tidak sesuai format`);
    return msg.parsed_output as z.infer<S>;
  } catch (err) {
    // Web search may be disabled for the org — retry once without it.
    if (useSearch) {
      const msg = await anthropic().messages.parse(base);
      if (msg.parsed_output == null) throw new Error(`${agent.name}: jawaban tidak sesuai format`);
      return msg.parsed_output as z.infer<S>;
    }
    throw err;
  }
}
