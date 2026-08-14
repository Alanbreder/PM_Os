import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Search, Filter, AlertCircle, Save, Lightbulb } from 'lucide-react';
import { Hypothesis, Opportunity, HypothesisStatus } from '../types';
import { PageHeader } from './ui/PageHeader';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { LoadingState } from './ui/LoadingState';
import { ErrorState } from './ui/ErrorState';

interface HypothesesListViewProps {
  workspaceId: string;
  opportunities: Opportunity[];
  onNavigateToOpportunity: (opportunityId: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error') => void;
}

export function HypothesesListView({
  workspaceId,
  opportunities,
  onNavigateToOpportunity,
  onShowToast,
}: HypothesesListViewProps) {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // New Hypothesis Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>('');
  const [statement, setStatement] = useState('');
  const [metricTarget, setMetricTarget] = useState('');
  const [confidenceScore, setConfidenceScore] = useState<number>(3);
  const [status, setStatus] = useState<HypothesisStatus>('draft');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchHypotheses();
  }, [workspaceId]);

  const fetchHypotheses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/hypotheses', {
        headers: { 'x-workspace-id': workspaceId },
      });
      if (!res.ok) throw new Error('Falha ao carregar hipóteses');
      const data = await res.json();
      setHypotheses(data.hypotheses || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar hipóteses do workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHypothesis = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOpportunityId) {
      setFormError('Selecione obrigatoriamente uma Oportunidade para vincular a hipótese.');
      return;
    }

    if (!statement.trim() || statement.trim().length < 10) {
      setFormError('A declaração da hipótese deve ter pelo menos 10 caracteres.');
      return;
    }

    if (!metricTarget.trim() || metricTarget.trim().length < 3) {
      setFormError('A métrica de sucesso (alvo) é obrigatória (mínimo 3 caracteres).');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        opportunity_id: selectedOpportunityId,
        statement: statement.trim(),
        metric_target: metricTarget.trim(),
        confidence_score: confidenceScore,
        status,
      };

      const res = await fetch('/api/hypotheses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao criar hipótese');
      }

      const data = await res.json();
      setHypotheses((prev) => [data.hypothesis, ...prev]);
      onShowToast('Hipótese criada', 'A aposta de solução foi formulada com sucesso.', 'success');

      // Reset form
      setStatement('');
      setSelectedOpportunityId('');
      setMetricTarget('');
      setConfidenceScore(3);
      setStatus('draft');
      setIsFormOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Falha ao salvar hipótese.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOpp = opportunities.find((o) => o.id === selectedOpportunityId);

  const filteredHypotheses = hypotheses.filter((h) => {
    const matchesSearch =
      h.statement.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.metric_target && h.metric_target.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || h.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hipóteses de Solução"
        description="Apostas testáveis de solução vinculadas a Oportunidades para direcionar a validação do produto."
        badge={
          <Badge variant="indigo" icon={<Sparkles className="w-3.5 h-3.5" />}>
            Hypothesis Engine
          </Badge>
        }
        actions={
          <Button onClick={() => setIsFormOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Nova Hipótese
          </Button>
        }
      />

      {/* Form Card for Creating a New Hypothesis */}
      {isFormOpen && (
        <Card className="border-indigo-500/30 bg-neutral-900/90 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Formular Nova Hipótese</span>
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-neutral-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          {formError && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateHypothesis} className="space-y-4">
            {/* Step 1: Mandatory Opportunity Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>1. Selecionar Oportunidade Relacionada *</span>
              </label>

              {opportunities.length === 0 ? (
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3.5 text-xs text-neutral-400 space-y-2">
                  <p>
                    Nenhuma Oportunidade foi encontrada neste workspace. É necessário cadastrar pelo menos uma Oportunidade no Opportunity Backlog antes de formular uma hipótese.
                  </p>
                </div>
              ) : (
                <select
                  value={selectedOpportunityId}
                  onChange={(e) => setSelectedOpportunityId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                >
                  <option value="" disabled>
                    -- Selecione uma Oportunidade existente (Obrigatório) --
                  </option>
                  {opportunities.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Context Box of Selected Opportunity */}
            {selectedOpp && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3.5 space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                    Contexto da Oportunidade Selecionada
                  </span>
                  <Badge
                    variant={
                      selectedOpp.status === 'active'
                        ? 'amber'
                        : selectedOpp.status === 'draft'
                        ? 'neutral'
                        : 'neutral'
                    }
                  >
                    {selectedOpp.status === 'active'
                      ? 'Ativa'
                      : selectedOpp.status === 'draft'
                      ? 'Rascunho'
                      : 'Arquivada'}
                  </Badge>
                </div>
                <h4 className="text-xs font-bold text-white leading-snug">{selectedOpp.title}</h4>
                <p className="text-xs text-neutral-300 leading-relaxed">{selectedOpp.description}</p>
              </div>
            )}

            {/* Step 2: Hypothesis Details */}
            <div className="space-y-4 pt-2 border-t border-neutral-800">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-300">
                  Declaração da Hipótese (Nós acreditamos que...) <span className="text-amber-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="Ex: Se simplificarmos o fluxo de checkout para 2 passos, reduziremos a taxa de abandono do carrinho..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-300">
                  Métrica de Sucesso / Alvo de Validação <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={metricTarget}
                  onChange={(e) => setMetricTarget(e.target.value)}
                  placeholder="Ex: Aumentar a taxa de conversão do checkout de 2.5% para 4.0%"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-neutral-300">
                    Pontuação de Confiança (1 a 5)
                  </label>
                  <select
                    value={confidenceScore}
                    onChange={(e) => setConfidenceScore(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                  >
                    <option value={1}>1 - Baixa confiança (Aposta arriscada)</option>
                    <option value={2}>2 - Confiança moderada-baixa</option>
                    <option value={3}>3 - Confiança média (Padrão)</option>
                    <option value={4}>4 - Alta confiança (Baseada em forte evidência)</option>
                    <option value={5}>5 - Confiança altíssima (Pré-validada)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-neutral-300">
                    Status da Hipótese
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as HypothesisStatus)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                  >
                    <option value="draft">Rascunho (Em Formulação)</option>
                    <option value="testing">Em Validação (Em Teste)</option>
                    <option value="validated">Validada (Sucesso Comprovado)</option>
                    <option value="invalidated">Invalidada (Refutada)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={submitting}
                disabled={!selectedOpportunityId || !statement.trim() || !metricTarget.trim()}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                Salvar Hipótese
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por declaração ou métrica alvo..."
            className="w-full pl-8 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-xs text-neutral-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            <option value="all">Todas ({hypotheses.length})</option>
            <option value="draft">Rascunho</option>
            <option value="testing">Em Validação</option>
            <option value="validated">Validada</option>
            <option value="invalidated">Invalidada</option>
          </select>
        </div>
      </div>

      {/* Hypotheses Cards Grid */}
      {loading ? (
        <LoadingState message="Carregando hipóteses..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchHypotheses} />
      ) : filteredHypotheses.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-6 h-6" />}
          title="Nenhuma hipótese cadastrada"
          description="Formule hipóteses testáveis vinculadas a Oportunidades para direcionar a validação do produto."
          action={{
            label: 'Formular Primeira Hipótese',
            onClick: () => setIsFormOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHypotheses.map((h) => (
            <Card key={h.id} className="space-y-3 border-neutral-800 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={
                      h.status === 'validated'
                        ? 'emerald'
                        : h.status === 'invalidated'
                        ? 'rose'
                        : h.status === 'testing'
                        ? 'cyan'
                        : 'neutral'
                    }
                  >
                    {h.status === 'draft'
                      ? 'Rascunho'
                      : h.status === 'testing'
                      ? 'Em Validação'
                      : h.status === 'validated'
                      ? 'Validada'
                      : 'Invalidada'}
                  </Badge>

                  {h.confidence_score && (
                    <span className="text-[10px] text-neutral-400 font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      Confiança: {h.confidence_score}/5
                    </span>
                  )}
                </div>

                <p className="text-xs text-white font-medium leading-relaxed">{h.statement}</p>

                {h.metric_target && (
                  <div className="text-[11px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-lg">
                    <strong>Métrica de Sucesso:</strong> {h.metric_target}
                  </div>
                )}
              </div>

              {h.opportunity_id && (
                <div className="pt-2.5 border-t border-neutral-800 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500">Oportunidade vinculada</span>
                  <button
                    onClick={() => onNavigateToOpportunity(h.opportunity_id!)}
                    className="text-amber-400 hover:underline font-semibold cursor-pointer truncate max-w-[200px] flex items-center gap-1"
                  >
                    <Lightbulb className="w-3 h-3 shrink-0" />
                    <span>{h.opportunity_title || 'Ver Oportunidade'}</span>
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

