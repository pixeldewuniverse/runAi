import type { AgentId, RoomId } from "./agents";
import type { Brief, Idea, PublishPlan, Script, Storyboard, Trends } from "./schemas";

export type AgentState = "idle" | "working" | "waiting" | "error";

export interface AgentStatusRow {
  id: AgentId;
  state: AgentState;
  room: RoomId;
  task: string | null;
  updated_at: string;
}

export interface EventRow {
  id: string;
  agent_id: AgentId | "user" | "system";
  kind: "info" | "done" | "error" | "approval";
  message: string;
  ref_type: "content" | "brainstorm" | null;
  ref_id: string | null;
  created_at: string;
}

export type ContentStatus =
  | "researching"
  | "awaiting_pick"
  | "scripting"
  | "awaiting_script"
  | "rendering"
  | "awaiting_final"
  | "ready"
  | "published"
  | "rejected"
  | "failed";

export interface RenderScene {
  voiceover: string;
  on_screen: string;
  seconds: number;
  layout: Storyboard["scenes"][number]["layout"];
  headline: string;
  items: string[];
  code: string;
  stat: string;
  accent: string;
  /** Filled by the render worker once TTS exists. */
  audio_url?: string;
}

export interface ContentRow {
  id: string;
  status: ContentStatus;
  title: string | null;
  trends: Trends | null;
  ideas: Idea[] | null;
  picked: Idea | null;
  script: Script | null;
  storyboard: Storyboard | null;
  scenes: RenderScene[] | null;
  publish: PublishPlan | null;
  video_url: string | null;
  feedback: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface RenderJobRow {
  id: string;
  content_id: string;
  status: "queued" | "processing" | "done" | "failed";
  output_url: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrainstormRow {
  id: string;
  title: string;
  idea: string;
  status: "running" | "awaiting_user" | "done" | "failed";
  brief: Brief | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrainstormMessageRow {
  id: string;
  session_id: string;
  author: AgentId | "user";
  /** Structured output of the agent, or { text } for the user. */
  body: Record<string, unknown>;
  created_at: string;
}

export interface SettingRow {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface Tables {
  agent_status: AgentStatusRow;
  events: EventRow;
  contents: ContentRow;
  render_jobs: RenderJobRow;
  brainstorms: BrainstormRow;
  brainstorm_messages: BrainstormMessageRow;
  settings: SettingRow;
}
export type TableName = keyof Tables;

export interface OfficeData {
  agents: AgentStatusRow[];
  events: EventRow[];
  approvals: { id: string; status: ContentStatus; title: string | null }[];
  stats: { contentToday: number; ready: number; published: number; brainstorms: number };
  config: { claude: boolean; supabase: boolean; worker: boolean; store: "supabase" | "memory" };
}
