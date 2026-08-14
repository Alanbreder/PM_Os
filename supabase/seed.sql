-- ==============================================================================
-- Product OS - Seed Data for Testing & Multi-Tenant Verification
-- Creates two completely distinct Workspaces (Acme Corp vs Fintech Labs)
-- ==============================================================================

-- Create Sample Workspaces
INSERT INTO workspaces (id, name, slug) VALUES
('11111111-1111-1111-1111-111111111111', 'Acme E-Commerce', 'acme-ecommerce'),
('22222222-2222-2222-2222-222222222222', 'Fintech Pay', 'fintech-pay')
ON CONFLICT (id) DO NOTHING;

-- Seed Research in Workspace 1 (Acme)
INSERT INTO researches (id, workspace_id, title, source_type, raw_content, participant_info) VALUES
(
    'a1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Entrevista de Onboarding - Usuário Alpha',
    'interview',
    'O usuário relatou que demorou mais de 10 minutos para encontrar o botão de checkout e quase desistiu da compra.',
    '{"role": "B2C Buyer", "experience": "First-time"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Seed Evidence in Workspace 1 (Acme)
INSERT INTO evidences (id, workspace_id, research_id, quote, context, confidence_level, tags) VALUES
(
    'e1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Demorou mais de 10 minutos para encontrar o botão de checkout',
    'Fluxo de primeiro pedido no checkout mobile',
    'high',
    ARRAY['onboarding', 'checkout', 'ux-friction']
) ON CONFLICT (id) DO NOTHING;

-- Seed Problem in Workspace 1 (Acme)
INSERT INTO problems (id, workspace_id, title, description, impact_level, status) VALUES
(
    'p1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Dificuldade de localização do CTA de checkout mobile',
    'Usuários de primeira viagem não localizam a ação primária de pagamento abaixo da dobra.',
    'high',
    'validated'
) ON CONFLICT (id) DO NOTHING;

-- Link Problem to Evidence in Workspace 1
INSERT INTO problem_evidences (workspace_id, problem_id, evidence_id) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'p1111111-1111-1111-1111-111111111111',
    'e1111111-1111-1111-1111-111111111111'
) ON CONFLICT DO NOTHING;

-- Seed Opportunity in Workspace 1 (Acme)
INSERT INTO opportunities (id, workspace_id, title, description, strategic_value, status) VALUES
(
    'o1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Sticky Checkout Bar em Dispositivos Móveis',
    'Garantir visibilidade permanente do botão de compra sem depender de scroll do carrinho.',
    'high',
    'prioritized'
) ON CONFLICT (id) DO NOTHING;

-- Link Opportunity to Problem in Workspace 1
INSERT INTO opportunity_problems (workspace_id, opportunity_id, problem_id) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'o1111111-1111-1111-1111-111111111111',
    'p1111111-1111-1111-1111-111111111111'
) ON CONFLICT DO NOTHING;

-- Seed Hypothesis in Workspace 1 (Acme)
INSERT INTO hypotheses (id, workspace_id, opportunity_id, statement, metric_target, confidence_score, status) VALUES
(
    'h1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'o1111111-1111-1111-1111-111111111111',
    'Acreditamos que fixar a barra de checkout no rodapé mobile reduzirá o tempo até o pedido',
    'Aumento de 12% na taxa de conversão de carrinho em 14 dias',
    4,
    'testing'
) ON CONFLICT (id) DO NOTHING;

-- Seed Research in Workspace 2 (Fintech Pay)
INSERT INTO researches (id, workspace_id, title, source_type, raw_content, participant_info) VALUES
(
    'a2222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'Feedback de Pix Recorrente',
    'feedback',
    'Empresas relatam que a conciliação automática de Pix falha aos fins de semana.',
    '{"segment": "Enterprise Merchants"}'::jsonb
) ON CONFLICT (id) DO NOTHING;
