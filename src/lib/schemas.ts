/**
 * Shared Zod schemas — validated at every route boundary and before DB writes.
 */
import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(200_000),
});

export const chatRequestSchema = z.object({
  conversationId: uuidSchema.optional(),
  messages: z.array(chatMessageSchema).min(1).max(100),
  modelId: z.string().min(1).max(64),
  temperature: z.number().min(0).max(2).optional(),
  templateId: uuidSchema.optional(),
  templateVariables: z.record(z.string(), z.string()).optional(),
});

export const conversationPatchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  folder: z.string().max(60).nullable().optional(),
  pinned: z.boolean().optional(),
  deleted: z.boolean().optional(), // soft delete → trash
});

export const templateVariableSchema = z.object({
  name: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/).max(40),
  label: z.string().max(80),
  defaultValue: z.string().max(2000),
  required: z.boolean(),
});

export const templateCreateSchema = z.object({
  name: z.string().min(3).max(80),
  description: z.string().max(2000).default(""),
  category: z.string().min(1).max(40).default("General"),
  promptBody: z.string().min(1).max(50_000),
  variables: z.array(templateVariableSchema).max(50).default([]),
  visibility: z.enum(["personal", "team"]).default("personal"),
});

export const templatePatchSchema = templateCreateSchema.partial().extend({
  featured: z.boolean().optional(),
});

export const inviteCreateSchema = z.object({
  email: z.string().email().max(254),
  role: z.enum(["admin", "member"]).default("member"),
});

export const teamCreateSchema = z.object({
  name: z.string().min(2).max(60),
});

export const kbCreateSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(2000).default(""),
});

export const kbPatchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(2000).optional(),
  chunkSizeTokens: z.number().int().min(200).max(2000).optional(),
  chunkOverlapPct: z.number().int().min(0).max(40).optional(),
  retrievalTopK: z.number().int().min(1).max(20).optional(),
  rerankTopN: z.number().int().min(1).max(10).optional(),
  similarityThreshold: z.number().min(0).max(1).optional(),
});

export const ragAskSchema = z.object({
  kbId: uuidSchema,
  conversationId: uuidSchema.optional(),
  question: z.string().min(1).max(8000),
  topK: z.number().int().min(1).max(20).optional(),
});

export const ragFeedbackSchema = z.object({
  messageId: uuidSchema,
  rating: z.enum(["up", "down"]),
  badCitation: z.boolean().default(false),
  note: z.string().max(2000).default(""),
});

export const apiKeyCreateSchema = z.object({
  name: z.string().min(1).max(80),
  expiresInDays: z.number().int().min(1).max(730).nullable().default(90),
});

export const budgetPatchSchema = z.object({
  monthlyTokenBudget: z.number().positive().nullable(),
  budgetHardStop: z.boolean(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
