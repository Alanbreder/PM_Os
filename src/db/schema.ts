import { relations } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp, integer, jsonb, index, unique } from 'drizzle-orm/pg-core';

// Users table (synchronized from Firebase Auth or local auth)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID / local auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Workspaces
export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Workspace Members
export const workspaceMembers = pgTable('workspace_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id').notNull(),
  role: text('role').notNull().default('member'), // owner, admin, member, viewer
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_workspace_members_workspace_id').on(table.workspaceId),
]);

// Researches (Entrevistas, Descobertas, Transcrições)
export const researches = pgTable('researches', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  sourceType: text('source_type').notNull(), // 'interview', 'survey', 'support_ticket', 'user_testing', 'sales_call'
  rawContent: text('raw_content').notNull(),
  participantInfo: jsonb('participant_info').$type<Record<string, any>>().default({}),
  status: text('status').notNull().default('processed'), // 'draft', 'processing', 'processed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_researches_workspace_id').on(table.workspaceId),
]);

// Evidences (Fatos atômicos extraídos das pesquisas)
export const evidences = pgTable('evidences', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  researchId: uuid('research_id')
    .references(() => researches.id, { onDelete: 'cascade' })
    .notNull(),
  quote: text('quote').notNull(),
  context: text('context'),
  confidenceLevel: text('confidence_level').notNull().default('medium'), // 'high', 'medium', 'low'
  tags: jsonb('tags').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_evidences_workspace_id').on(table.workspaceId),
  index('idx_evidences_research_id').on(table.researchId),
]);

// Problems (Dores e necessidades mapeadas)
export const problems = pgTable('problems', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  impactLevel: text('impact_level').notNull().default('medium'), // 'critical', 'high', 'medium', 'low'
  status: text('status').notNull().default('open'), // 'open', 'investigating', 'validated', 'deprioritized'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_problems_workspace_id').on(table.workspaceId),
]);

// Problem Evidences (N:N Junction Table)
export const problemEvidences = pgTable('problem_evidences', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  problemId: uuid('problem_id')
    .references(() => problems.id, { onDelete: 'cascade' })
    .notNull(),
  evidenceId: uuid('evidence_id')
    .references(() => evidences.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  unique('uq_problem_evidences_problem_evidence').on(table.problemId, table.evidenceId),
  index('idx_problem_evidences_workspace_id').on(table.workspaceId),
  index('idx_problem_evidences_problem_id').on(table.problemId),
  index('idx_problem_evidences_evidence_id').on(table.evidenceId),
]);

// Opportunities (Áreas de oportunidade de valor / resultado)
export const opportunities = pgTable('opportunities', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('draft'), // 'draft', 'active', 'archived'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_opportunities_workspace_id').on(table.workspaceId),
]);

// Opportunity Problems (N:N Junction Table)
export const opportunityProblems = pgTable('opportunity_problems', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  opportunityId: uuid('opportunity_id')
    .references(() => opportunities.id, { onDelete: 'cascade' })
    .notNull(),
  problemId: uuid('problem_id')
    .references(() => problems.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  unique('uq_opportunity_problems_opp_problem').on(table.opportunityId, table.problemId),
  index('idx_opportunity_problems_workspace_id').on(table.workspaceId),
  index('idx_opportunity_problems_opportunity_id').on(table.opportunityId),
  index('idx_opportunity_problems_problem_id').on(table.problemId),
]);

// Hypotheses (Hipóteses com métricas de validação)
export const hypotheses = pgTable('hypotheses', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  opportunityId: uuid('opportunity_id')
    .references(() => opportunities.id, { onDelete: 'cascade' })
    .notNull(),
  statement: text('statement').notNull(),
  metricTarget: text('metric_target').notNull(),
  confidenceScore: integer('confidence_score').notNull().default(50),
  status: text('status').notNull().default('draft'), // 'draft', 'testing', 'validated', 'invalidated'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_hypotheses_workspace_id').on(table.workspaceId),
  index('idx_hypotheses_opportunity_id').on(table.opportunityId),
]);

// Relations definitions
export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  researches: many(researches),
  evidences: many(evidences),
  problems: many(problems),
  opportunities: many(opportunities),
  hypotheses: many(hypotheses),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
}));

export const researchesRelations = relations(researches, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [researches.workspaceId],
    references: [workspaces.id],
  }),
  evidences: many(evidences),
}));

export const evidencesRelations = relations(evidences, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [evidences.workspaceId],
    references: [workspaces.id],
  }),
  research: one(researches, {
    fields: [evidences.researchId],
    references: [researches.id],
  }),
  problemLinks: many(problemEvidences),
}));

export const problemsRelations = relations(problems, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [problems.workspaceId],
    references: [workspaces.id],
  }),
  evidenceLinks: many(problemEvidences),
  opportunityLinks: many(opportunityProblems),
}));

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [opportunities.workspaceId],
    references: [workspaces.id],
  }),
  problemLinks: many(opportunityProblems),
  hypotheses: many(hypotheses),
}));

export const hypothesesRelations = relations(hypotheses, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [hypotheses.workspaceId],
    references: [workspaces.id],
  }),
  opportunity: one(opportunities, {
    fields: [hypotheses.opportunityId],
    references: [opportunities.id],
  }),
}));
