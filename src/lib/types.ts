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
  self?: boolean;
  note?: string;
  removable?: boolean;
}

export interface MembersData {
  summary: string;
  members: Member[];
  pendingInvite: { name: string; email: string; role: Role; sent: string; expires: string; label: string; status: string };
  roleDefinitions: Array<{ role: Role; description: string }>;
  rolesFooter: string;
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
  searchText: string;
}

export interface ConversationsData {
  projects: Array<{ name: string; count: number }>;
  sharedWithYou: number;
  conversations: Conversation[];
}

export interface MarginNoteData {
  id: string;
  n: number;
  paragraphId: string;
  documentTitle: string;
  catalog: string;
  meta: string;
  excerpt?: Segment[];
  expanded?: boolean;
  broken?: boolean;
  openPassage?: boolean;
}

export interface ThreadBlock {
  type: "paragraph" | "pullQuote" | "list";
  segments?: Segment[];
  items?: Segment[][];
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
  composer: { sources: string; playbook: string; model: string; costSentence: string; placeholder?: string };
  streamContinuation: string;
  sourcesDown: {
    meta: string;
    banner: string;
    question: string;
    footerLine: string;
    marginNoteTitle: string;
    marginNoteStatus: string;
    marginNoteText: string;
    composerNote: string;
  };
  limitState: {
    title: string;
    speaker: string;
    time: string;
    question: string;
    partialSegments: Segment[];
    headline: string;
    body: string;
    adminHeading: string;
    actions: Array<{ label: string; detail: string }>;
    usageLinkLabel: string;
    editorsNote: string;
    composerNote: string;
  };
  blocked: {
    meta: string;
    heading: string;
    segments: Segment[];
    noticeHeading: string;
    noticeBody: string;
  };
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
  description?: string;
  inputsLabel?: string;
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
    inputs: Array<{ input: string; type: string; required?: boolean; example: string; notes?: string }>;
    sources: Array<{ label: string; state: "checked" | "unchecked" | "disabled"; note?: string }>;
    checks: Array<{ label: string; checked: boolean; inputValue?: string; inputSuffix?: string }>;
    sharing: { selected: string; options: Array<{ value: string; label: string }> };
    preview: string;
    testRunCost: number;
    changesSincePrevious: string[];
    version: string;
    liveVersion: string;
    savedNote: string;
  };
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  owner: string;
  documents: number;
  passages: number;
  newest: string;
  cited30d: number | null;
  status: { type: "current" | "stale" | "indexing"; label: string; percent?: number; note?: string };
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  collection: string;
  passages: number | null;
  status: "indexed" | "indexing" | "failed" | "stale";
  updated: string;
  format: string;
  owner: string;
  statusDetail?: string;
  statusNote?: string;
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
  summary: string;
  collections: Collection[];
  documents: KnowledgeDocument[];
  needsAttention: Array<{ label: string; detail: string; actionLabel?: string }>;
  evaluationLine: { label: string; detail: string; actionLabel: string };
  ask: {
    collectionId: string;
    collectionLabel: string;
    question: string;
    answerHeading: string;
    answerBlocks: ThreadBlock[];
    answerMeta: string;
    search: { top: number; minimumMatch: number; freshnessDays: number; reranking: boolean };
    traceIntro: string;
    trace: PassageTraceRow[];
  };
  inspector: {
    documentId: string;
    documentTitle: string;
    collectionName: string;
    totalPassages: number;
    splitting: string;
    indexedLabel: string;
    sectionHeading: string;
    passages: Array<{ number: number; text: string; overlapPrefix?: string; selected?: boolean }>;
    selectedPassage: { number: number; tokens: number; page: string; heading: string; usage: string };
  };
}

export interface UsageData {
  summary: string;
  cycleLabel: string;
  chartCaption: string;
  series: Array<{ date: string; value: number }>;
  projection: { date: string; value: number };
  byProject: Array<{ name: string; detail: string; amount: number; conversations: number; tokensK: number | null; writtenTokens: number; readTokens: number }>;
  byModel: Array<{ name: string; amount: number; median: string }>;
  byPerson: Array<{ name: string; amount: number }>;
  marginActions: Array<{ label: string; description: string }>;
}

export interface EvaluationsData {
  summary: string;
  set: { name: string; questions: number; edited: string; schedule: string };
  runs: Array<{ date: string; passed: number; cost: number }>;
  runsNote: string;
  failures: Array<{ id: string; tag: string; question: string; expected: string; got: string; why: string; fixLabel: string; actions: string[] }>;
  otherSets: Array<{ name: string; questions: number; latest: string }>;
  runCost: number;
}

export interface TemplateItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  expects?: string;
  copied?: string;
  instructions?: string;
  inputs?: string;
  sources?: string;
  checks?: string;
  runs?: string;
  typicalRun?: string;
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
    roleDescription: string;
    waiting: Array<{ label: string; detail: string }>;
    quote: { text: string; author: string };
  };
  emptyHistory: {
    workspace: string;
    caption: string;
    heading: string;
    body: string;
    starters: string[];
    readyToCite: string[];
  };
  upgrade: {
    workspace: string;
    trialEnds: string;
    heading: string;
    body: string;
    seatsInTrial: number;
    perSeat: number;
    limitValue: string;
    usageNote: string;
    modelUseNote: string;
    chargedDate: string;
    footerNote: string;
  };
  signup: { stepLabel: string; errorName: string; errorEmail: string; legal: string };
  auth: {
    quote: { segments: Segment[]; source: string };
    trialFacts: string[];
    signupError: string;
  };
}

export type AdminData = typeof import("../../data/admin.json");
