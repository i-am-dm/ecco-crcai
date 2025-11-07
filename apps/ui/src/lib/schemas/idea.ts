import { z } from 'zod';

/**
 * Zod schema for Idea form validation (FR-1)
 */

export const ideaScoringSchema = z.object({
  overall: z.number().min(0).max(10).optional(),
  market: z.number().min(0).max(10).optional(),
  team: z.number().min(0).max(10).optional(),
  tech: z.number().min(0).max(10).optional(),
  timing: z.number().min(0).max(10).optional(),
  notes: z.string().optional(),
});

export const ideaFormSchema = z.object({
  // Required fields (FR-1)
  theme: z.string()
    .min(3, 'Theme must be at least 3 characters')
    .max(200, 'Theme must be less than 200 characters'),

  problem: z.string()
    .min(10, 'Problem description must be at least 10 characters')
    .max(2000, 'Problem description must be less than 2000 characters'),

  market: z.string()
    .min(10, 'Market description must be at least 10 characters')
    .max(2000, 'Market description must be less than 2000 characters'),

  team: z.string()
    .min(10, 'Team description must be at least 10 characters')
    .max(2000, 'Team description must be less than 2000 characters'),

  tech: z.string()
    .min(10, 'Tech description must be at least 10 characters')
    .max(2000, 'Tech description must be less than 2000 characters'),

  // Optional fields
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .optional(),

  description: z.string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),

  tags: z.array(z.string()).optional(),
  score: ideaScoringSchema.optional(),
});

const researchDocVersionSchema = z.object({
  id: z.string().optional(),
  version: z.string(),
  url: z.string().url('Provide a valid URL'),
  storagePath: z.string().optional(),
  uploadedAt: z.string(),
  uploadedBy: z.string().optional(),
  notes: z.string().optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().optional(),
  checksum: z.string().optional(),
});

const researchDocSchema = z.object({
  id: z.string(),
  title: z.string(),
  docType: z.enum(['market', 'customer', 'product', 'financial', 'experiment', 'ops', 'other']),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['active', 'archived']).optional(),
  lastUpdated: z.string().optional(),
  versions: z.array(researchDocVersionSchema),
});

export const ideaSchema = z.object({
  id: z.string(),
  theme: z.string(),
  problem: z.string(),
  market: z.string(),
  team: z.string(),
  tech: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  score: ideaScoringSchema.optional(),
  status: z.enum(['New', 'Under Review', 'Approved', 'Rejected', 'On Hold']).optional(),
  stage: z.enum(['Idea', 'Validation', 'Build', 'Launch', 'Scale', 'Spin-Out']).optional(),
  stageOwner: z.string().optional(),
  stageDueDate: z.string().optional(),
  createdBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  researchDocs: z.array(researchDocSchema).optional(),
});

export type IdeaFormInput = z.infer<typeof ideaFormSchema>;
export type IdeaScoring = z.infer<typeof ideaScoringSchema>;
