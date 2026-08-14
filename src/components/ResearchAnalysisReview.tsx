import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Check,
  X,
  Edit2,
  Save,
  Quote,
  AlertCircle,
  CheckCircle2,
  Database,
  ArrowLeft,
  Loader2,
  Link as LinkIcon,
  RefreshCw,
} from 'lucide-react';
import {
  Research,
  SuggestedEvidenceItem,
  SuggestedProblemItem,
  ConfidenceLevel,
  ProblemImpact,
} from '../types';

interface ResearchAnalysisReviewProps {
  research: Research;
  workspaceId: string;
  onBack: () => void;
  onSavedSuccess: () => void;
}

export const ResearchAnalysisReview: React.FC<ResearchAnalysisReviewProps> = ({
  research,
  workspaceId,
  onBack,
  onSavedSuccess,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [evidences, setEvidences] = useState<SuggestedEvidenceItem[]>([]);
  const [problems, setProblems] = useState<SuggestedProblemItem[]>([]);

  // Trigger Gemini analysis on mount if empty
  useEffect(() => {
    runAnalysis();
  }, [research.id]);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/researches/${research.id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao processar análise com IA');
      }

      // Initialize suggestions with 'accepted' status by default for smooth PM review
      const rawEvidences = data.analysis.evidences || [];
      const rawProblems = data.analysis.problems || [];

      setEvidences(
        rawEvidences.map((e: any, idx: number) => ({
          id: `ev-${idx}`,
          quote: e.quote,
          context: e.context || '',
          confidence_level: (e.confidence_level || 'medium') as ConfidenceLevel,
          tags: e.tags || [],
          status: 'accepted',
          isEditing: false,
        }))
      );

      setProblems(
        rawProblems.map((p: any, idx: number) => ({
          id: `prob-${idx}`,
          title: p.title,
          description: p.description,
          impact_level: (p.impact_level || 'medium') as ProblemImpact,
          supporting_evidence_indices: p.supporting_evidence_indices || [],
          status: 'accepted',
          isEditing: false,
        }))
      );
    } catch (err: any) {
      console.error('Erro na análise da pesquisa:', err);
      setError(err.message || 'Falha na comunicação com o serviço de IA.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle Evidence acceptance
  const toggleEvidenceStatus = (index: number) => {
    setEvidences((prev) =>
      prev.map((e, idx) =>
        idx === index ? { ...e, status: e.status === 'accepted' ? 'rejected' : 'accepted' } : e
      )
    );
  };

  // Toggle Evidence edit mode
  const toggleEvidenceEdit = (index: number) => {
    setEvidences((prev) =>
      prev.map((e, idx) => (idx === index ? { ...e, isEditing: !e.isEditing } : e))
    );
  };

  const updateEvidenceField = (
    index: number,
    field: keyof SuggestedEvidenceItem,
    value: any
  ) => {
    setEvidences((prev) =>
      prev.map((e, idx) => (idx === index ? { ...e, [field]: value } : e))
    );
  };

  // Toggle Problem acceptance
  const toggleProblemStatus = (index: number) => {
    setProblems((prev) =>
      prev.map((p, idx) =>
        idx === index ? { ...p, status: p.status === 'accepted' ? 'rejected' : 'accepted' } : p
      )
    );
  };

  // Toggle Problem edit mode
  const toggleProblemEdit = (index: number) => {
    setProblems((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, isEditing: !p.isEditing } : p))
    );
  };

  const updateProblemField = (
    index: number,
    field: keyof SuggestedProblemItem,
    value: any
  ) => {
    setProblems((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, [field]: value } : p))
    );
  };

  // Counts of approved items
  const acceptedEvidences = evidences.filter((e) => e.status === 'accepted');
  const acceptedProblems = problems.filter((p) => p.status === 'accepted');

  // Submit approved items to PostgreSQL Cloud SQL
  const handleSaveApproved = async () => {
    if (acceptedEvidences.length === 0 && acceptedProblems.length === 0) {
      setError('Selecione ao menos uma evidência ou problema para salvar no workspace.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Map indices correctly for approved evidences
      // We pass the full approved list and re-map the problem references
      const evidenceIndexMap = new Map<number, number>();
      let approvedEvidenceCounter = 0;

      evidences.forEach((ev, originalIdx) => {
        if (ev.status === 'accepted') {
          evidenceIndexMap.set(originalIdx, approvedEvidenceCounter);
          approvedEvidenceCounter++;
        }
      });

      const payloadApprovedEvidences = acceptedEvidences.map((e) => ({
        quote: e.quote,
        context: e.context || null,
        confidence_level: e.confidence_level,
        tags: e.tags || [],
      }));

      const payloadApprovedProblems = acceptedProblems.map((p) => {
        // Map original evidence indices to new filtered indices
        const remappedEvidenceIndices = p.supporting_evidence_indices
          .map((origIdx) => evidenceIndexMap.get(origIdx))
          .filter((val): val is number => typeof val === 'number');

        return {
          title: p.title,
          description: p.description,
          impact_level: p.impact_level,
          status: 'identified' as const,
          supporting_evidence_local_indices: remappedEvidenceIndices,
        };
      });

      const res = await fetch(`/api/researches/${research.id}/approve-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({
          approved_evidences: payloadApprovedEvidences,
          approved_problems: payloadApprovedProblems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao persistir itens aprovados no banco.');
      }

      setSuccessMessage(
        `Sucesso! ${data.saved_evidences_count} evidência(s) e ${data.saved_problems_count} problema(s) foram gravados no PostgreSQL.`
      );

      setTimeout(() => {
        onSavedSuccess();
      }, 1200);
    } catch (err: any) {
      console.error('Erro ao aprovar sugestões:', err);
      setError(err.message || 'Falha ao salvar no banco de dados.');
    } finally {
      setIsSaving(false);
    }
  };

  const getConfidenceBadge = (level: ConfidenceLevel) => {
    switch (level) {
      case 'high':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'medium':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'low':
        return 'bg-neutral-800 text-neutral-400 border-neutral-700';
    }
  };

  const getImpactBadge = (level: ProblemImpact) => {
    switch (level) {
      case 'critical':
        return 'bg-red-950 text-red-400 border-red-800 font-semibold';
      case 'high':
        return 'bg-orange-950 text-orange-400 border-orange-800';
      case 'medium':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'low':
        return 'bg-blue-950 text-blue-400 border-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Controls */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold px-2 py-0.5 rounded">
                ✨ Human-in-the-Loop
              </span>
              <span className="text-xs text-neutral-400">Revisão de Descoberta</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{research.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing || isSaving}
            className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg border border-neutral-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analisando...' : 'Reanalisar com IA'}
          </button>
        </div>
      </div>

      {/* Error & Success Feedback */}
      {error && (
        <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl flex items-start gap-3 text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300">Falha na operação</p>
            <p className="text-xs mt-0.5 text-red-300/90">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-200 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isAnalyzing && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Sparkles className="w-10 h-10 text-emerald-400 animate-pulse" />
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              O Gemini está analisando a transcrição...
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
              Separando fatos de interpretações, extraindo citações literais e mapeando dores concretas relatadas pelo usuário.
            </p>
          </div>
        </div>
      )}

      {/* Suggestions Main Content */}
      {!isAnalyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Evidências */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Quote className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-white text-base">
                  Evidências Extraídas ({acceptedEvidences.length}/{evidences.length})
                </h3>
              </div>
              <span className="text-xs text-neutral-500">Citações fiéis e observações</span>
            </div>

            {evidences.length === 0 ? (
              <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-xl text-center text-xs text-neutral-500">
                Nenhuma evidência extraída pelo modelo.
              </div>
            ) : (
              <div className="space-y-3">
                {evidences.map((ev, idx) => {
                  const isAccepted = ev.status === 'accepted';

                  return (
                    <div
                      key={ev.id}
                      className={`border rounded-xl p-4 transition-all ${
                        isAccepted
                          ? 'bg-neutral-900 border-neutral-800 text-neutral-200'
                          : 'bg-neutral-950/60 border-neutral-900 opacity-50'
                      }`}
                    >
                      {/* Card Header & Controls */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                            #{idx + 1}
                          </span>
                          <span
                            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${getConfidenceBadge(
                              ev.confidence_level
                            )}`}
                          >
                            Confiança: {ev.confidence_level}
                          </span>
                        </div>

                        {/* Acceptance and Edit Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleEvidenceEdit(idx)}
                            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                            title={ev.isEditing ? 'Concluir edição' : 'Editar evidência'}
                          >
                            {ev.isEditing ? (
                              <Save className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Edit2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleEvidenceStatus(idx)}
                            className={`px-2 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
                              isAccepted
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:bg-red-950/80 hover:text-red-300 hover:border-red-800'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-emerald-950 hover:text-emerald-300'
                            }`}
                          >
                            {isAccepted ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Aceita</span>
                              </>
                            ) : (
                              <>
                                <X className="w-3 h-3" />
                                <span>Rejeitada</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Content Body */}
                      {ev.isEditing ? (
                        <div className="space-y-2 mt-2">
                          <div>
                            <label className="text-[11px] text-neutral-400">Citação (Quote):</label>
                            <textarea
                              rows={3}
                              value={ev.quote}
                              onChange={(e) => updateEvidenceField(idx, 'quote', e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-xs text-white focus:outline-none focus:border-neutral-500 font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-neutral-400">Contexto:</label>
                            <input
                              type="text"
                              value={ev.context || ''}
                              onChange={(e) => updateEvidenceField(idx, 'context', e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-neutral-500"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-neutral-400">Nível de Confiança:</label>
                            <select
                              value={ev.confidence_level}
                              onChange={(e) =>
                                updateEvidenceField(
                                  idx,
                                  'confidence_level',
                                  e.target.value as ConfidenceLevel
                                )
                              }
                              className="w-full bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                            >
                              <option value="high">Alta (High)</option>
                              <option value="medium">Média (Medium)</option>
                              <option value="low">Baixa (Low)</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <blockquote className="text-xs text-neutral-200 border-l-2 border-emerald-500/50 pl-2.5 italic">
                            "{ev.quote}"
                          </blockquote>
                          {ev.context && (
                            <p className="text-[11px] text-neutral-400 pl-2.5">
                              <span className="text-neutral-500">Contexto:</span> {ev.context}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 2: Problemas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <h3 className="font-semibold text-white text-base">
                  Problemas Sugeridos ({acceptedProblems.length}/{problems.length})
                </h3>
              </div>
              <span className="text-xs text-neutral-500">Mapeados a partir das evidências</span>
            </div>

            {problems.length === 0 ? (
              <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-xl text-center text-xs text-neutral-500">
                Nenhum problema derivado pelo modelo.
              </div>
            ) : (
              <div className="space-y-3">
                {problems.map((prob, idx) => {
                  const isAccepted = prob.status === 'accepted';

                  return (
                    <div
                      key={prob.id}
                      className={`border rounded-xl p-4 transition-all ${
                        isAccepted
                          ? 'bg-neutral-900 border-neutral-800 text-neutral-200'
                          : 'bg-neutral-950/60 border-neutral-900 opacity-50'
                      }`}
                    >
                      {/* Card Header & Controls */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                            P{idx + 1}
                          </span>
                          <span
                            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${getImpactBadge(
                              prob.impact_level
                            )}`}
                          >
                            Impacto: {prob.impact_level}
                          </span>
                        </div>

                        {/* Acceptance and Edit Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleProblemEdit(idx)}
                            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                            title={prob.isEditing ? 'Concluir edição' : 'Editar problema'}
                          >
                            {prob.isEditing ? (
                              <Save className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Edit2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleProblemStatus(idx)}
                            className={`px-2 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
                              isAccepted
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:bg-red-950/80 hover:text-red-300 hover:border-red-800'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-emerald-950 hover:text-emerald-300'
                            }`}
                          >
                            {isAccepted ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Aceito</span>
                              </>
                            ) : (
                              <>
                                <X className="w-3 h-3" />
                                <span>Rejeitado</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Problem Body */}
                      {prob.isEditing ? (
                        <div className="space-y-2 mt-2">
                          <div>
                            <label className="text-[11px] text-neutral-400">Título:</label>
                            <input
                              type="text"
                              value={prob.title}
                              onChange={(e) => updateProblemField(idx, 'title', e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-neutral-500"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-neutral-400">Descrição:</label>
                            <textarea
                              rows={3}
                              value={prob.description}
                              onChange={(e) =>
                                updateProblemField(idx, 'description', e.target.value)
                              }
                              className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-xs text-white focus:outline-none focus:border-neutral-500"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-neutral-400">Nível de Impacto:</label>
                            <select
                              value={prob.impact_level}
                              onChange={(e) =>
                                updateProblemField(
                                  idx,
                                  'impact_level',
                                  e.target.value as ProblemImpact
                                )
                              }
                              className="w-full bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                            >
                              <option value="critical">Crítico (Critical)</option>
                              <option value="high">Alto (High)</option>
                              <option value="medium">Médio (Medium)</option>
                              <option value="low">Baixo (Low)</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-white">{prob.title}</h4>
                          <p className="text-xs text-neutral-400 leading-relaxed">
                            {prob.description}
                          </p>

                          {/* Supporting Evidences Links */}
                          {prob.supporting_evidence_indices.length > 0 && (
                            <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                                <LinkIcon className="w-2.5 h-2.5" /> Baseado em:
                              </span>
                              {prob.supporting_evidence_indices.map((evIdx) => (
                                <span
                                  key={evIdx}
                                  className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded font-mono"
                                >
                                  Evidência #{evIdx + 1}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Sticky Action Bar */}
      {!isAnalyzing && (
        <div className="sticky bottom-4 z-20 bg-neutral-900/95 backdrop-blur border border-neutral-800 rounded-xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-neutral-300">
            <div>
              <span className="font-semibold text-white">{acceptedEvidences.length}</span> evidência(s) aceita(s)
            </div>
            <span className="text-neutral-600">|</span>
            <div>
              <span className="font-semibold text-white">{acceptedProblems.length}</span> problema(s) aceito(s)
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onBack}
              disabled={isSaving}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-white rounded-lg transition-colors"
            >
              Voltar sem Salvar
            </button>

            <button
              type="button"
              onClick={handleSaveApproved}
              disabled={isSaving || (acceptedEvidences.length === 0 && acceptedProblems.length === 0)}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando no PostgreSQL...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Salvar Aprovados no Banco (PostgreSQL Cloud SQL)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
