/**
 * Shared Zod schemas — validated at every route boundary and before DB writes.
 */
import { z } from "zod";

export const uuidSchema = z.string().uuid();

/* ------------------------------------------------------------------ */
/* Auth (W1)                                                           */
/* ------------------------------------------------------------------ */

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128, "That password is too long.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(128),
  next: z.string().max(2048).optional(),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80),
  email: emailSchema,
  password: passwordSchema,
  workspaceName: z
    .string()
    .trim()
    .min(2, "Name your workspace (at least 2 characters).")
    .max(60, "Keep the workspace name under 60 characters."),
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordUpdateSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "The two passwords don't match.",
    path: ["confirmPassword"],
  });

export const inviteAcceptSchema = z.object({
  token: z.string().min(16).max(512),
  name: z.string().trim().max(80).optional(),
});

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
