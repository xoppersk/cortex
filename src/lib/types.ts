export type Role = "Admin" | "Editor" | "Viewer";

export interface Segment {
  text: string;
  footnote?: number;
  mark?: boolean;
}

export interface WorkspaceData {
  currentUser: { id: string; name: string; email: string; role: Role; owner: boolean };
  workspace: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    paidSeats: number;
    monthlyLimit: number;
    spend: number;
    projectedSpend: number;
    perAnswerCeiling: number;
    alertThreshold: number;
    billingCycle: { start: string; end: string; label: string; daysLeft: number };
    fixtureNow: string;
    fixtureDate: string;
    defaultModel: string;
    citationRule: string;
    sourceFreshnessDays: number;
  };
  models: Array<{ id: string; name: string }>;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  team: string;
  detail: string;
  lastActive: string;
}

export interface MembersData {
  members: Member[];
  pendingInvite: { name: string; email: string; role: Role; sent: string; expires: string };
  roleDefinitions: Array<{ role: Role; description: string }>;
}

export interface Conversation {
  id: string;
  title: string;
  project: string;
  startedBy: string;
  shared: boolean;
  pinned: boolean;
  sources: number;
  people: string[];
  cost: number;
  edited: string;
  group: "Today" | "This week" | "Earlier";
  snippet: string;
}

export interface ConversationsData {
  projects: Array<{ name: string; count: number }>;
  conversations: Conversation[];
}

export interface MarginNoteData {
  id: string;
  n: number;
  paragraphId: string;
  documentTitle: string;
  catalog: string;
  meta: string;
  excerpt: Segment[];
  expanded?: boolean;
  broken?: boolean;
}

export interface ThreadBlock {
  type: "paragraph" | "pullQuote";
  segments?: Segment[];
  text?: string;
  attribution?: string;
}

export interface ThreadTurn {
  id: string;
  speaker: string;
  time: string;
  question: string;
  answer: {
    heading: string;
    blocks: ThreadBlock[];
    footer: { tokens: string; duration: string; cost: number; citedLabel: string } | null;
    streaming?: { label: string; costSoFar: number };
  };
}

export interface ThreadData {
  id: string;
  header: { title: string; meta: string; project: string; edited: string };
  turns: ThreadTurn[];
  notes: MarginNoteData[];
  composer: { sources: string; playbook: string; model: string; costSentence: string };
  streamContinuation: string;
}

export interface PlaybookRow {
  id: string;
  name: string;
  owner?: string;
  runs: number;
  updated: string;
  avgCost?: number;
  passRate?: string;
  status?: string;
}

export interface PlaybooksData {
  featured: PlaybookRow & {
    instructions: string;
    inputs: string;
    sources: string;
    checks: string;
    passRate: string;
  };
  team: PlaybookRow[];
  private: PlaybookRow[];
  archived: PlaybookRow[];
  edit: {
    instructions: string;
    inputs: Array<{ input: string; type: string; example: string; notes: string }>;
    sources: Array<{ label: string; state: "checked" | "unchecked" | "disabled"; note?: string }>;
    checks: Array<
      | { label: string; type: "toggle"; value: boolean }
      | { label: string; type: "number"; value: number; prefix?: string; suffix?: string }
    >;
    sharing: { selected: string; options: Array<{ value: string; label: string }> };
    preview: string;
    testRunCost: number;
    changesSincePrevious: string[];
    version: string;
  };
}

export interface Collection {
  id: string;
  name: string;
  documents: number;
  passages: number;
  newest: string;
  cited30d: number;
  status: { type: "current" | "stale" | "indexing"; label: string; percent?: number };
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  collection: string;
  passages: number;
  status: "indexed" | "indexing" | "failed" | "stale";
  updated: string;
}

export interface PassageTraceRow {
  cite: number | null;
  excerpt: string;
  source: string;
  match: number;
  outcome: string;
  setAside?: boolean;
}

export interface KnowledgeData {
  collections: Collection[];
  documents: KnowledgeDocument[];
  needsAttention: Array<{ label: string; detail: string }>;
  ask: {
    collectionId: string;
    question: string;
    answerHeading: string;
    answerBlocks: ThreadBlock[];
    search: { top: number; minimumMatch: number; freshnessDays: number; reranking: boolean };
    trace: PassageTraceRow[];
  };
  inspector: {
    documentId: string;
    documentTitle: string;
    passages: Array<{ number: number; text: string; overlap: string; selected?: boolean }>;
    selectedPassage: { number: number; tokens: number; words: number; characters: number; match: number; cited: number };
  };
}

export interface UsageData {
  summary: string;
  series: Array<{ date: string; value: number }>;
  projection: { date: string; value: number };
  byProject: Array<{ name: string; amount: number; writtenTokens: number; readTokens: number }>;
  byModel: Array<{ name: string; amount: number; writtenTokens: number; readTokens: number }>;
  byPerson: Array<{ name: string; amount: number }>;
  marginActions: Array<{ label: string; description: string }>;
}

export interface EvaluationsData {
  summary: string;
  set: { name: string; questions: number };
  runs: Array<{ date: string; passed: number }>;
  failures: Array<{ id: string; question: string; expected: string; got: string; why: string; fixLabel: string }>;
  otherSets: Array<{ name: string; questions: number; latest: string }>;
  runCost: number;
}

export interface TemplateItem {
  id: string;
  name: string;
  category: string;
  inputs: string;
  sources: string;
  checks?: string;
  runs?: string;
}

export interface TemplatesData {
  categories: Array<{ name: string; count: number }>;
  featured: TemplateItem;
  templates: TemplateItem[];
}

export interface StatesData {
  invite: {
    inviter: string;
    role: Role;
    email: string;
    name: string;
    workspace: string;
    expires: string;
    waiting: string[];
  };
  emptyHistory: { workspace: string; heading: string; starters: Array<{ label: string; text: string }> };
  upgrade: { seats: number; perSeat: number; monthlyLimit: number; chargedDate: string; summary: string };
  auth: {
    quote: { segments: Segment[]; source: string };
    trialFacts: string[];
    signupError: string;
  };
}

export type AdminData = typeof import("../../data/admin.json");
