/**
 * Embeddings provider-adapter (NEVER invent secrets).
 *
 * `getEmbeddingsProvider()` returns:
 *   - OpenAI `text-embedding-3-small` when OPENAI_API_KEY is set,
 *   - a deterministic mock otherwise.
 *
 * The mock maps text into a 64-dim hashed-token vector (unit-normalized).
 * Because query and chunk vectors share the space, cosine similarity is
 * genuinely correlated with term overlap — dense retrieval actually works
 * in tests, demos, and the eval harness. Dimension 64 keeps the in-memory
 * eval fast; the production schema uses 1536 (see migration 00003).
 */
import { isDemoMode } from "@/lib/demo";

export const MOCK_EMBEDDING_DIMS = 256;
export const PROD_EMBEDDING_DIMS = 1536;
export const EMBEDDING_MODEL = "text-embedding-3-small";

export interface EmbeddingsProvider {
  readonly model: string;
  readonly dims: number;
  embed(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
}

/** FNV-1a 32-bit hash — deterministic across runs and platforms. */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** English stopwords — excluded from mock embeddings and sparse scoring. */
const STOPWORDS = new Set(
  ("a,an,and,are,as,at,be,but,by,can,do,does,for,from,had,has,have,how,i,if,in,into,is,it,its," +
    "not,of,on,or,that,the,their,then,there,these,they,this,to,was,we,what,when,where,which,who," +
    "will,with,you,your,all,any,each,more,most,other,some,such,than,too,very,just,about,after," +
    "before,between,over,under,again,once,here,when,why,my,our,theirs,his,her,him,she,them,us," +
    "should,would,could,may,might,must,shall,also,however,therefore,thus,hence,per,via,etc,eg,ie")
    .split(","),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t))
    .map(stem);
}

/**
 * Compact Porter stemmer — normalizes morphological variants ("costs"→"cost",
 * "plans"→"plan") so term matching isn't defeated by plurals and inflections.
 * Standard IR practice; keeps the mock's sparse leg honest.
 */
function stem(word: string): string {
  if (word.length <= 3) return word;
  let w = word;

  // Step 1a: plurals
  if (w.endsWith("sses")) w = w.slice(0, -2);
  else if (w.endsWith("ies")) w = w.slice(0, -3) + "i";
  else if (w.endsWith("ss")) { /* keep */ }
  else if (w.endsWith("s")) w = w.slice(0, -1);

  // Step 1b: -ed, -ing
  if (w.endsWith("eed")) {
    if (measure(w.slice(0, -3)) > 0) w = w.slice(0, -1);
  } else if (w.endsWith("ed") && /[aeiou]/.test(w.slice(0, -2))) {
    w = w.slice(0, -2);
    w = step1bExtra(w);
  } else if (w.endsWith("ing") && /[aeiou]/.test(w.slice(0, -3))) {
    w = w.slice(0, -3);
    w = step1bExtra(w);
  }

  // Step 4-ish: common derivational suffixes
  const suffixes: Array<[string, number]> = [
    ["ational", 0], ["tional", 0], ["enci", 0], ["anci", 0], ["izer", 0],
    ["ation", 0], ["ator", 0], ["alism", 0], ["iveness", 0], ["fulness", 0],
    ["ousness", 0], ["aliti", 0], ["iviti", 0], ["biliti", 0],
  ];
  for (const [suf] of suffixes) {
    if (w.endsWith(suf) && measure(w.slice(0, -suf.length)) > 1) {
      w = w.slice(0, -suf.length) + "e";
      break;
    }
  }
  if (w.endsWith("ing") && measure(w.slice(0, -3)) > 1) w = w.slice(0, -3);

  return w;
}

function step1bExtra(w: string): string {
  if (w.endsWith("at") || w.endsWith("bl") || w.endsWith("iz")) return w + "e";
  const last = w[w.length - 1]!;
  const secondLast = w[w.length - 2]!;
  if (w.length >= 2 && last === secondLast && !"lsz".includes(last)) {
    return w.slice(0, -1);
  }
  if (measure(w) === 1 && cvc(w)) return w + "e";
  return w;
}

/** Porter "measure": VC sequence count. */
function measure(w: string): number {
  let m = 0;
  let prevVowel = false;
  let seenVowel = false;
  for (const ch of w) {
    const isVowel = "aeiou".includes(ch) || (ch === "y" && seenVowel);
    if (!isVowel && prevVowel) m++;
    if (isVowel) seenVowel = true;
    prevVowel = isVowel;
  }
  return m;
}

/** Consonant-vowel-consonant pattern (for short-word rule). */
function cvc(w: string): boolean {
  if (w.length < 3) return false;
  const a = w[w.length - 3]!;
  const b = w[w.length - 2]!;
  const c = w[w.length - 1]!;
  const v = (ch: string) => "aeiou".includes(ch);
  return !v(a) && v(b) && !v(c) && !"wxy".includes(c);
}

/** Deterministic hashed bag-of-words vector, L2-normalized.
 *
 * Uses fastText-style subword features: each token contributes its whole
 * form plus character trigrams (^ and $ mark boundaries), and adjacent
 * token pairs contribute bigram features. Trigrams give the mock genuine
 * morphological generalization ("cost"~"costs", "plan"~"plans"); bigrams
 * preserve short phrases ("pro plan" vs "cortex pro", "per seat") which is
 * what lets the mock stand in for a real embedding model in tests.
 */
export function mockEmbedOne(text: string, dims = MOCK_EMBEDDING_DIMS): number[] {
  const vec = new Array<number>(dims).fill(0);
  const add = (feature: string, weight: number) => {
    const idx = fnv1a(feature) % dims;
    vec[idx] = (vec[idx] ?? 0) + (fnv1a(feature + "#sign") % 2 === 0 ? 1 : -1) * weight;
  };
  const tokens = tokenize(text);
  for (const token of tokens) {
    add(`w:${token}`, 1.0);
    const t = `^${token}$`;
    for (let i = 0; i < t.length - 2; i++) {
      add(`g:${t.slice(i, i + 3)}`, 0.35);
    }
  }
  for (let i = 0; i < tokens.length - 1; i++) {
    add(`b:${tokens[i]}+${tokens[i + 1]}`, 0.8);
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) dot += (a[i] ?? 0) * (b[i] ?? 0);
  return dot; // inputs are unit-normalized
}

export class MockEmbeddingsProvider implements EmbeddingsProvider {
  readonly model = `mock-${EMBEDDING_MODEL}`;
  readonly dims = MOCK_EMBEDDING_DIMS;

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((t) => mockEmbedOne(t, this.dims));
  }

  async embedQuery(text: string): Promise<number[]> {
    return mockEmbedOne(text, this.dims);
  }
}

class OpenAIEmbeddingsProvider implements EmbeddingsProvider {
  readonly model = EMBEDDING_MODEL;
  readonly dims = PROD_EMBEDDING_DIMS;

  private async client() {
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { embedMany } = await import("ai");
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return { openai, embedMany };
  }

  async embed(texts: string[]): Promise<number[][]> {
    const { openai, embedMany } = await this.client();
    // Batch in groups of 100 (API limit friendly).
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += 100) {
      const batch = texts.slice(i, i + 100);
      const { embeddings } = await embedMany({
        model: openai.embedding(this.model),
        values: batch,
      });
      out.push(...embeddings);
    }
    return out;
  }

  async embedQuery(text: string): Promise<number[]> {
    const [vec] = await this.embed([text]);
    return vec ?? mockEmbedOne(text);
  }
}

export function shouldUseMockEmbeddings(): boolean {
  if (isDemoMode()) return true;
  if (process.env.MOCK_EMBEDDINGS === "true") return true;
  return !process.env.OPENAI_API_KEY;
}

let cached: EmbeddingsProvider | null = null;

export function getEmbeddingsProvider(): EmbeddingsProvider {
  if (cached) return cached;
  cached = shouldUseMockEmbeddings()
    ? new MockEmbeddingsProvider()
    : new OpenAIEmbeddingsProvider();
  return cached;
}

/** Test helper: reset the cached provider between tests. */
export function resetEmbeddingsProvider(): void {
  cached = null;
}
