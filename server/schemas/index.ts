import { z } from 'zod';

export const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    { message: 'Identificador UUID inválido' }
  );

export const uuidParamSchema = z.object({
  id: uuidSchema,
});

// Workspace Schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'O nome do workspace deve ter no mínimo 2 caracteres').max(100),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
});

export const addWorkspaceMemberSchema = z.object({
  user_id: z.string().min(1, 'ID do usuário é obrigatório'),
  role: z.enum(['owner', 'admin', 'member', 'viewer']).default('member'),
});

// Research Schemas
export const createResearchSchema = z.object({
  title: z.string().min(3, 'O título da pesquisa deve ter no mínimo 3 caracteres').max(200),
  source_type: z.enum(['interview', 'survey', 'feedback', 'usability_test', 'document']).default('interview'),
  source_url: z.string().url('URL de origem inválida').optional().nullable(),
  participant_info: z.record(z.string(), z.any()).default({}),
  raw_content: z.string().min(10, 'O conteúdo da pesquisa deve ter pelo menos 10 caracteres'),
});

export const updateResearchSchema = createResearchSchema.partial();

// Evidence Schemas
export const createEvidenceSchema = z.object({
  research_id: uuidSchema,
  quote: z.string().min(5, 'A citação deve ter pelo menos 5 caracteres'),
  context: z.string().max(1000).optional().nullable(),
  confidence_level: z.enum(['high', 'medium', 'low']).default('medium'),
  tags: z.array(z.string().min(1).max(50)).default([]),
});

export const updateEvidenceSchema = createEvidenceSchema.omit({ research_id: true }).partial();

export const batchCreateEvidenceSchema = z.object({
  research_id: uuidSchema,
  evidences: z.array(
    z.object({
      quote: z.string().min(5),
      context: z.string().optional().nullable(),
      confidence_level: z.enum(['high', 'medium', 'low']).default('medium'),
      tags: z.array(z.string()).default([]),
    })
  ).min(1, 'Pelo menos uma evidência deve ser fornecida'),
});

// Problem Schemas
export const createProblemSchema = z.object({
  title: z.string().min(3, 'O título do problema deve ter pelo menos 3 caracteres').max(200),
  description: z.string().min(10, 'A descrição do problema deve ter pelo menos 10 caracteres'),
  impact_level: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  status: z.enum(['identified', 'exploring', 'validated', 'archived']).default('identified'),
  evidence_ids: z.array(uuidSchema).default([]),
});

export const updateProblemSchema = createProblemSchema.omit({ evidence_ids: true }).partial();

export const linkProblemEvidencesSchema = z.object({
  evidence_ids: z.array(uuidSchema).min(1, 'Pelo menos uma evidência deve ser vinculada'),
});

// Opportunity Schemas
export const createOpportunitySchema = z.object({
  title: z.string().min(3, 'O título da oportunidade deve ter pelo menos 3 caracteres').max(200),
  description: z.string().min(10, 'A descrição da oportunidade deve ter pelo menos 10 caracteres'),
  strategic_value: z.enum(['high', 'medium', 'low']).default('medium'),
  status: z.enum(['draft', 'prioritized', 'in_progress', 'solved', 'discarded']).default('draft'),
  problem_ids: z.array(uuidSchema).default([]),
});

export const updateOpportunitySchema = createOpportunitySchema.omit({ problem_ids: true }).partial();

export const linkOpportunityProblemsSchema = z.object({
  problem_ids: z.array(uuidSchema).min(1, 'Pelo menos um problema deve ser vinculado'),
});

// Hypothesis Schemas
export const createHypothesisSchema = z.object({
  opportunity_id: uuidSchema,
  statement: z.string().min(10, 'A formulação da hipótese deve ter pelo menos 10 caracteres'),
  metric_target: z.string().min(3, 'A métrica de validação deve ser definida'),
  confidence_score: z.number().int().min(1).max(5).default(3),
  status: z.enum(['draft', 'testing', 'validated', 'invalidated']).default('draft'),
});

export const updateHypothesisSchema = createHypothesisSchema.omit({ opportunity_id: true }).partial();

// AI Analysis Validation Schemas
export const suggestedEvidenceSchema = z.object({
  quote: z.string().min(3, 'A citação deve ter conteúdo extraído do texto'),
  context: z.string().optional().nullable(),
  confidence_level: z.enum(['high', 'medium', 'low']).default('medium'),
  tags: z.array(z.string()).default([]),
});

export const suggestedProblemSchema = z.object({
  title: z.string().min(3, 'Título do problema sugerido'),
  description: z.string().min(5, 'Descrição do problema sugerido'),
  impact_level: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  supporting_evidence_indices: z.array(z.number().int().min(0)).default([]),
});

export const aiAnalysisResultSchema = z.object({
  evidences: z.array(suggestedEvidenceSchema).default([]),
  problems: z.array(suggestedProblemSchema).default([]),
});

export const approveAnalysisSchema = z.object({
  approved_evidences: z.array(
    z.object({
      local_id: z.string().optional(),
      quote: z.string().min(3),
      context: z.string().optional().nullable(),
      confidence_level: z.enum(['high', 'medium', 'low']).default('medium'),
      tags: z.array(z.string()).default([]),
    })
  ).default([]),
  approved_problems: z.array(
    z.object({
      title: z.string().min(3),
      description: z.string().min(5),
      impact_level: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
      status: z.enum(['identified', 'exploring', 'validated', 'archived']).default('identified'),
      supporting_evidence_local_indices: z.array(z.number().int().min(0)).default([]),
    })
  ).default([]),
});
