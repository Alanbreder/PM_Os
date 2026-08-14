import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  ArrowLeft,
  AlertCircle,
  Quote,
  Trash2,
  Edit3,
  Link,
  Unlink,
  FileText,
  Building,
  User,
  Plus,
  ExternalLink,
  ShieldCheck,
  Search,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Opportunity, Problem, OpportunityStatus } from '../types';
import { ConfirmDialog } from './ui/ConfirmDialog';

interface OpportunityDetailViewProps {
  opportunityId: string;
  workspaceId: string;
  onBack: () => void;
  onEdit: (opportunity: Opportunity) => void;
  onNavigateToProblem: (problemId: string) => void;
  onNavigateToResearch: (researchId: string) => void;
  onOpportunityDeleted: () => void;
}

const statusConfig: Record<
  OpportunityStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  draft: {
    label: 'Rascunho',
    badgeClass: 'bg-neutral-800 text-neutral-300 border-neutral-700',
    dotClass: 'bg-neutral-400',
  },
  active: {
    label: 'Ativa / Em Exploração',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dotClass: 'bg-amber-400 animate-pulse',
  },
  archived: {
    label: 'Arquivada',
    badgeClass: 'bg-neutral-900 text-neutral-500 border-neutral-800',
    dotClass: 'bg-neutral-600',
  },
};

export function OpportunityDetailView({
  opportunityId,
  workspaceId,
  onBack,
  onEdit,
  onNavigateToProblem,
  onNavigateToResearch,
  onOpportunityDeleted,
}: OpportunityDetailViewProps) {
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status updating state
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Link existing problems modal/inline state
  const [isLinkingProblem, setIsLinkingProblem] = useState(false);
  const [workspaceProblems, setWorkspaceProblems] = useState<Problem[]>([]);
  const [loadingWorkspaceProblems, setLoadingWorkspaceProblems] = useState(false);
  const [selectedProblemIdsToLink, setSelectedProblemIdsToLink] = useState<string[]>([]);
  const [problemSearchTerm, setProblemSearchTerm] = useState('');
  const [linkingSubmitting, setLinkingSubmitting] = useState(false);

  // Unlink problem state
  const [problemToUnlink, setProblemToUnlink] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  // Delete opportunity state
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Expand problem evidences map
  const [expandedProblems, setExpandedProblems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchOpportunity();
  }, [opportunityId, workspaceId]);

  const fetchOpportunity = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`, {
        headers: { 'x-workspace-id': workspaceId },
      });

      if (!res.ok) {
        throw new Error('Falha ao carregar oportunidade.');
      }

      const data = await res.json();
      setOpportunity(data.opportunity);

      // Expand all problems by default
      if (data.opportunity?.problems) {
        const initialMap: Record<string, boolean> = {};
        data.opportunity.problems.forEach((p: Problem) => {
          initialMap[p.id] = true;
        });
        setExpandedProblems(initialMap);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhe da oportunidade');
    } fontually: {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: OpportunityStatus) => {
    if (!opportunity || opportunity.status === newStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Erro ao atualizar status');
      const data = await res.json();
      setOpportunity(data.opportunity);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleOpenLinkProblemModal = async () => {
    setIsLinkingProblem(true);
    setLoadingWorkspaceProblems(true);
    setSelectedProblemIdsToLink([]);
    try {
      const res = await fetch('/api/problems', {
        headers: { 'x-workspace-id': workspaceId },
      });
      if (res.ok) {
        const data = await res.json();
        // Filter out problems already linked
        const existingIds = new Set((opportunity?.problems || []).map((p) => p.id));
        const available = (data.problems || []).filter(
          (p: Problem) => !existingIds.has(p.id)
        );
        setWorkspaceProblems(available);
      }
    } catch (err) {
      console.error('Erro ao buscar problemas do workspace:', err);
    } finally {
      setLoadingWorkspaceProblems(false);
    }
  };

  const handleConfirmLinkProblems = async () => {
    if (selectedProblemIdsToLink.length === 0) return;
    setLinkingSubmitting(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/link-problems`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({ problem_ids: selectedProblemIdsToLink }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao vincular problemas');
      }

      await fetchOpportunity();
      setIsLinkingProblem(false);
    } catch (err: any) {
      alert(err.message || 'Falha ao vincular problemas');
    } finally {
      setLinkingSubmitting(false);
    }
  };

  const handleUnlinkProblem = async () => {
    if (!problemToUnlink) return;
    setUnlinking(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/problems/${problemToUnlink}`, {
        method: 'DELETE',
        headers: { 'x-workspace-id': workspaceId },
      });

      if (!res.ok) throw new Error('Erro ao desvincular problema');
      setProblemToUnlink(null);
      await fetchOpportunity();
    } catch (err: any) {
      alert(err.message || 'Falha ao desvincular problema');
    } finally {
      setUnlinking(false);
    }
  };

  const handleDeleteOpportunity = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'DELETE',
        headers: { 'x-workspace-id': workspaceId },
      });

      if (!res.ok) throw new Error('Erro ao excluir oportunidade');
      setIsConfirmingDelete(false);
      onOpportunityDeleted();
    } catch (err: any) {
      alert(err.message || 'Falha ao excluir oportunidade');
      setIsDeleting(false);
    }
  };

  const toggleProblemExpanded = (pId: string) => {
    setExpandedProblems((prev) => ({ ...prev, [pId]: !prev[pId] }));
  };

  if (loading) {
    return (
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-12 text-center text-neutral-400 text-sm">
        Carregando detalhe e rastreabilidade da oportunidade...
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-8 text-center space-y-4">
        <div className="text-rose-400 font-medium text-sm">{error || 'Oportunidade não encontrada'}</div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs text-neutral-300 hover:text-white bg-neutral-800 px-3 py-1.5 rounded-lg cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Backlog</span>
        </button>
      </div>
    );
  }

  const status = statusConfig[opportunity.status] || statusConfig.draft;
  const linkedProblems = opportunity.problems || [];
  const totalEvidences = linkedProblems.reduce((acc, p) => acc + (p.evidences?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Backlog de Oportunidades</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(opportunity)}
            className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar</span>
          </button>

          <button
            onClick={() => setIsConfirmingDelete(true)}
            disabled={isDeleting}
            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir</span>
          </button>
        </div>
      </div>

      {/* Opportunity Main Card Header */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold px-2.5 py-0.5 rounded flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5" />
                Área de Oportunidade
              </span>

              {/* Status Badge & Inline Selector */}
              <div className="relative inline-block">
                <select
                  value={opportunity.status}
                  onChange={(e) => handleUpdateStatus(e.target.value as OpportunityStatus)}
                  disabled={updatingStatus}
                  className={`appearance-none font-medium text-[11px] px-2.5 py-0.5 pr-6 rounded border cursor-pointer focus:outline-none ${status.badgeClass}`}
                >
                  <option value="draft">Rascunho</option>
                  <option value="active">Ativa / Em Exploração</option>
                  <option value="archived">Arquivada</option>
                </select>
                <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight">
              {opportunity.title}
            </h1>
          </div>
        </div>

        {/* Description */}
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-lg p-4 text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
          {opportunity.description}
        </div>

        {/* Metrics Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
            <span className="text-[11px] text-neutral-500 uppercase font-medium block">Problemas Sustentando</span>
            <span className="text-lg font-bold text-orange-400 mt-0.5 block">{linkedProblems.length}</span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
            <span className="text-[11px] text-neutral-500 uppercase font-medium block">Evidências Reais</span>
            <span className="text-lg font-bold text-teal-400 mt-0.5 block">{totalEvidences}</span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center col-span-2 sm:col-span-1">
            <span className="text-[11px] text-neutral-500 uppercase font-medium block">Rastreabilidade</span>
            <span className="text-xs font-semibold text-emerald-400 mt-1 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Fundamentada
            </span>
          </div>
        </div>
      </div>

      {/* Cascading Traceability View: Opportunity -> Problems -> Evidences -> Research */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              Rastreabilidade de Problemas e Evidências
            </h2>
            <p className="text-neutral-400 text-xs mt-0.5">
              Visualização em cascata: Opportunity → Problems → Evidences → Research
            </p>
          </div>

          <button
            onClick={handleOpenLinkProblemModal}
            className="bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-neutral-800 hover:border-amber-500/30 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Link className="w-3.5 h-3.5" />
            <span>Vincular Problema Existente</span>
          </button>
        </div>

        {linkedProblems.length === 0 ? (
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-neutral-600 mx-auto" />
            <div className="text-neutral-300 font-medium text-sm">Nenhum problema vinculado ainda</div>
            <p className="text-neutral-500 text-xs max-w-md mx-auto">
              Vincule problemas mapeados do seu backlog para dar sustentação e fundamentação a esta oportunidade.
            </p>
            <button
              onClick={handleOpenLinkProblemModal}
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium pt-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Vincular primeiro problema</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {linkedProblems.map((problem) => {
              const isExpanded = expandedProblems[problem.id] ?? true;
              const problemEvidences = problem.evidences || [];

              return (
                <div
                  key={problem.id}
                  className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-4"
                >
                  {/* Problem Card Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Problema Subjacente
                        </span>
                        <span className="bg-neutral-800 text-neutral-300 text-[10px] px-2 py-0.5 rounded uppercase font-mono">
                          Impacto: {problem.impact_level}
                        </span>
                        <span className="bg-neutral-800 text-neutral-400 text-[10px] px-2 py-0.5 rounded capitalize">
                          Status: {problem.status}
                        </span>
                      </div>

                      <h3
                        onClick={() => onNavigateToProblem(problem.id)}
                        className="text-base font-semibold text-white hover:text-orange-400 cursor-pointer transition-colors flex items-center gap-2"
                      >
                        {problem.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleProblemExpanded(problem.id)}
                        className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => setProblemToUnlink(problem.id)}
                        disabled={unlinking}
                        title="Desvincular problema desta oportunidade"
                        className="text-neutral-500 hover:text-rose-400 p-1.5 rounded hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Unlink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {problem.description}
                  </p>

                  {/* Evidences Cascade List */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-neutral-800/80 space-y-3">
                      <div className="flex items-center justify-between text-xs text-neutral-400">
                        <span className="font-medium flex items-center gap-1.5 text-teal-400">
                          <Quote className="w-3.5 h-3.5" />
                          Evidências de Usuários ({problemEvidences.length})
                        </span>
                      </div>

                      {problemEvidences.length === 0 ? (
                        <div className="bg-neutral-950/60 rounded-lg p-4 text-center text-xs text-neutral-500 italic">
                          Este problema ainda não possui evidências diretas anexadas.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2.5">
                          {problemEvidences.map((ev) => (
                            <div
                              key={ev.id}
                              className="bg-neutral-950/80 border border-neutral-800/80 rounded-lg p-3.5 space-y-2.5"
                            >
                              <p className="text-xs text-neutral-200 italic leading-relaxed border-l-2 border-teal-500/60 pl-3">
                                "{ev.quote}"
                              </p>

                              {ev.context && (
                                <p className="text-[11px] text-neutral-400 pl-3">
                                  <strong>Contexto:</strong> {ev.context}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500 pt-1 border-t border-neutral-800/40">
                                <div className="flex items-center gap-3">
                                  {ev.research_participant_name && (
                                    <span className="flex items-center gap-1 text-neutral-400">
                                      <User className="w-3 h-3 text-neutral-500" />
                                      {ev.research_participant_name}
                                    </span>
                                  )}

                                  <span className="bg-neutral-900 border border-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-mono text-[10px]">
                                    Confiança: {ev.confidence_level}
                                  </span>
                                </div>

                                {ev.research_id && (
                                  <button
                                    onClick={() => onNavigateToResearch(ev.research_id)}
                                    className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>{ev.research_title || 'Ver Entrevista Original'}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
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

      {/* Link Problem Modal */}
      {isLinkingProblem && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Link className="w-4 h-4 text-amber-400" />
                Vincular Problemas à Oportunidade
              </h3>
              <button
                onClick={() => setIsLinkingProblem(false)}
                className="text-neutral-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingWorkspaceProblems ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                Carregando problemas do workspace...
              </div>
            ) : workspaceProblems.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400 space-y-2">
                <div>Todos os problemas existentes já estão vinculados ou nenhum problema foi cadastrado.</div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={problemSearchTerm}
                    onChange={(e) => setProblemSearchTerm(e.target.value)}
                    placeholder="Filtrar problemas..."
                    className="w-full pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {workspaceProblems
                    .filter(
                      (p) =>
                        p.title.toLowerCase().includes(problemSearchTerm.toLowerCase()) ||
                        p.description.toLowerCase().includes(problemSearchTerm.toLowerCase())
                    )
                    .map((problem) => {
                      const isSelected = selectedProblemIdsToLink.includes(problem.id);
                      return (
                        <div
                          key={problem.id}
                          onClick={() => {
                            setSelectedProblemIdsToLink((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== problem.id)
                                : [...prev, problem.id]
                            );
                          }}
                          className={`p-3 rounded-lg border text-xs cursor-pointer transition-all space-y-1 ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                              : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span>{problem.title}</span>
                            <span className="text-[10px] text-neutral-500 uppercase">
                              {problem.impact_level}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 line-clamp-2">
                            {problem.description}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-neutral-800 pt-3">
              <button
                onClick={() => setIsLinkingProblem(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmLinkProblems}
                disabled={selectedProblemIdsToLink.length === 0 || linkingSubmitting}
                className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold px-4 py-1.5 rounded-lg text-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {linkingSubmitting ? 'Viculando...' : `Vincular (${selectedProblemIdsToLink.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Opportunity Dialog */}
      <ConfirmDialog
        isOpen={isConfirmingDelete}
        title="Excluir Oportunidade do Workspace"
        description="Tem certeza que deseja excluir esta oportunidade? Os problemas e evidências associadas continuarão preservados no repositório."
        confirmText="Excluir Oportunidade"
        loading={isDeleting}
        onConfirm={handleDeleteOpportunity}
        onClose={() => setIsConfirmingDelete(false)}
      />

      {/* Confirm Unlink Problem Dialog */}
      <ConfirmDialog
        isOpen={Boolean(problemToUnlink)}
        title="Desvincular Problema da Oportunidade"
        description="Deseja remover este problema da área de oportunidade? O problema continuará disponível no Backlog de Problemas."
        confirmText="Desvincular"
        loading={unlinking}
        onConfirm={handleUnlinkProblem}
        onClose={() => setProblemToUnlink(null)}
      />
    </div>
  );
}
