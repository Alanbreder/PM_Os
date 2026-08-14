import React, { useState, useEffect } from 'react';
import { GitBranch, ArrowRight, FileText, Quote, AlertCircle, Lightbulb, Sparkles } from 'lucide-react';
import { Research, Problem, Opportunity, Evidence, Hypothesis } from '../types';
import { PageHeader } from './ui/PageHeader';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { LoadingState } from './ui/LoadingState';
import { ErrorState } from './ui/ErrorState';
import { EmptyState } from './ui/EmptyState';

interface TraceabilityViewProps {
  workspaceId: string;
  onNavigateToResearch: (id: string) => void;
  onNavigateToProblem: (id: string) => void;
  onNavigateToOpportunity: (id: string) => void;
}

export function TraceabilityView({
  workspaceId,
  onNavigateToResearch,
  onNavigateToProblem,
  onNavigateToOpportunity,
}: TraceabilityViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [researches, setResearches] = useState<Research[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);

  useEffect(() => {
    fetchAllData();
  }, [workspaceId]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resRes, resEvi, resProb, resOpp, resHyp] = await Promise.all([
        fetch('/api/researches', { headers: { 'x-workspace-id': workspaceId } }),
        fetch('/api/evidences', { headers: { 'x-workspace-id': workspaceId } }),
        fetch('/api/problems', { headers: { 'x-workspace-id': workspaceId } }),
        fetch('/api/opportunities', { headers: { 'x-workspace-id': workspaceId } }),
        fetch('/api/hypotheses', { headers: { 'x-workspace-id': workspaceId } }),
      ]);

      if (!resRes.ok || !resEvi.ok || !resProb.ok || !resOpp.ok || !resHyp.ok) {
        throw new Error('Erro ao buscar mapa completo de rastreabilidade do workspace.');
      }

      const dataRes = await resRes.json();
      const dataEvi = await resEvi.json();
      const dataProb = await resProb.json();
      const dataOpp = await resOpp.json();
      const dataHyp = await resHyp.json();

      setResearches(dataRes.researches || []);
      setEvidences(dataEvi.evidences || []);
      setProblems(dataProb.problems || []);
      setOpportunities(dataOpp.opportunities || []);
      setHypotheses(dataHyp.hypotheses || []);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar a matriz de rastreabilidade.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matriz de Rastreabilidade e Árvore de Valor"
        description="Acompanhe a Linhagem Contínua de Decisão: da pesquisa bruta do cliente até as apostas de produto."
        badge={
          <Badge variant="amber" icon={<GitBranch className="w-3.5 h-3.5" />}>
            Continuous Traceability
          </Badge>
        }
      />

      {loading ? (
        <LoadingState message="Mapeando nós e linhagem de decisão do workspace..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchAllData} />
      ) : opportunities.length === 0 && problems.length === 0 && researches.length === 0 ? (
        <EmptyState
          icon={<GitBranch className="w-6 h-6" />}
          title="Nenhum dado de rastreabilidade cadastrado"
          description="Crie pesquisas, extraia evidências e conecte-as a problemas e oportunidades para visualizar o fluxo completo de decisão."
        />
      ) : (
        <div className="space-y-6">
          {/* Summary Stepper Guide */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
              <div className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                <FileText className="w-3.5 h-3.5" /> 1. Pesquisa
              </div>
              <p className="text-[10px] text-neutral-400">{researches.length} entrevistas/dados</p>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
              <div className="text-cyan-400 font-bold flex items-center justify-center gap-1">
                <Quote className="w-3.5 h-3.5" /> 2. Evidência
              </div>
              <p className="text-[10px] text-neutral-400">{evidences.length} fatos extraídos</p>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
              <div className="text-orange-400 font-bold flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> 3. Problema
              </div>
              <p className="text-[10px] text-neutral-400">{problems.length} dores validadas</p>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
              <div className="text-amber-400 font-bold flex items-center justify-center gap-1">
                <Lightbulb className="w-3.5 h-3.5" /> 4. Oportunidade
              </div>
              <p className="text-[10px] text-neutral-400">{opportunities.length} áreas de foco</p>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
              <div className="text-indigo-400 font-bold flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> 5. Hipótese
              </div>
              <p className="text-[10px] text-neutral-400">{hypotheses.length} apostas/testes</p>
            </div>
          </div>

          {/* Traceability Flow Cards */}
          <div className="space-y-4">
            {opportunities.map((opportunity) => {
              const connectedProblems = opportunity.problems || [];
              const connectedHypotheses = hypotheses.filter((h) => h.opportunity_id === opportunity.id);

              return (
                <Card key={opportunity.id} className="space-y-4 border-amber-500/20 bg-neutral-900/80">
                  {/* Opportunity Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" /> Oportunidade
                        </span>
                        <Badge variant={opportunity.status}>{opportunity.status}</Badge>
                      </div>
                      <h3
                        onClick={() => onNavigateToOpportunity(opportunity.id)}
                        className="text-sm font-bold text-white hover:text-amber-400 cursor-pointer transition-colors"
                      >
                        {opportunity.title}
                      </h3>
                      <p className="text-xs text-neutral-400">{opportunity.description}</p>
                    </div>
                  </div>

                  {/* Cascade Level: Problems supporting this Opportunity */}
                  <div className="pl-4 border-l-2 border-amber-500/30 space-y-3">
                    <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
                      <span>Problemas que Sustentam esta Oportunidade ({connectedProblems.length})</span>
                    </h4>

                    {connectedProblems.length === 0 ? (
                      <p className="text-xs text-neutral-500 italic">
                        Nenhum problema vinculado a esta oportunidade.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {connectedProblems.map((prob) => {
                          const probEvidences = prob.evidences || [];

                          return (
                            <div
                              key={prob.id}
                              className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  onClick={() => onNavigateToProblem(prob.id)}
                                  className="text-xs font-bold text-orange-200 hover:underline cursor-pointer"
                                >
                                  {prob.title}
                                </span>
                                <Badge variant={prob.impact_level}>{prob.impact_level}</Badge>
                              </div>
                              <p className="text-[11px] text-neutral-400">{prob.description}</p>

                              {/* Evidences level */}
                              {probEvidences.length > 0 && (
                                <div className="pt-2 border-t border-neutral-800/80 space-y-1.5">
                                  <span className="text-[10px] font-semibold text-neutral-500 uppercase flex items-center gap-1">
                                    <Quote className="w-3 h-3 text-cyan-400" /> Evidências do Cliente ({probEvidences.length})
                                  </span>
                                  <div className="space-y-1">
                                    {probEvidences.map((evi) => (
                                      <div
                                        key={evi.id}
                                        className="text-[11px] text-neutral-300 italic bg-neutral-900/80 p-2 rounded border border-neutral-800 flex items-center justify-between gap-2"
                                      >
                                        <span className="truncate">"{evi.quote}"</span>
                                        {evi.research_id && (
                                          <button
                                            onClick={() => onNavigateToResearch(evi.research_id)}
                                            className="text-emerald-400 hover:underline text-[10px] font-semibold shrink-0 cursor-pointer"
                                          >
                                            Ver Pesquisa
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Cascade Level: Hypotheses connected to this Opportunity */}
                    {connectedHypotheses.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Hipóteses e Experimentos ({connectedHypotheses.length})</span>
                        </h4>
                        <div className="space-y-1.5">
                          {connectedHypotheses.map((hyp) => (
                            <div
                              key={hyp.id}
                              className="text-xs bg-indigo-950/20 border border-indigo-500/20 p-2.5 rounded-lg text-indigo-200 flex items-center justify-between gap-2"
                            >
                              <span>{hyp.statement}</span>
                              <Badge variant="testing">{hyp.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
