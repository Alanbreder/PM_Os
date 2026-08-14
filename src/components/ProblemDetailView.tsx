import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Quote,
  Trash2,
  Edit3,
  Link,
  Unlink,
  CheckCircle2,
  FileText,
  Building,
  User,
  Plus,
  ExternalLink,
  ShieldCheck,
  Tag,
  Search,
  X,
} from 'lucide-react';
import { Problem, Evidence, ProblemImpact, ProblemStatus } from '../types';
import { ConfirmDialog } from './ui/ConfirmDialog';

interface ProblemDetailViewProps {
  problemId: string;
  workspaceId: string;
  onBack: () => void;
  onEdit: (problem: Problem) => void;
  onNavigateToResearch: (researchId: string) => void;
  onProblemDeleted: () => void;
  onCreateOpportunityFromProblem?: (problemId: string) => void;
}

export function ProblemDetailView({
  problemId,
  workspaceId,
  onBack,
  onEdit,
  onNavigateToResearch,
  onProblemDeleted,
  onCreateOpportunityFromProblem,
}: ProblemDetailViewProps) {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick status/impact updating state
  const [updatingField, setUpdatingField] = useState(false);

  // Link existing evidence modal/inline picker state
  const [isLinkingEvidence, setIsLinkingEvidence] = useState(false);
  const [workspaceEvidences, setWorkspaceEvidences] = useState<Evidence[]>([]);
  const [loadingWorkspaceEvidences, setLoadingWorkspaceEvidences] = useState(false);
  const [selectedEvidenceIdsToLink, setSelectedEvidenceIdsToLink] = useState<string[]>([]);
  const [evidenceSearchTerm, setEvidenceSearchTerm] = useState('');
  const [linkingSubmitting, setLinkingSubmitting] = useState(false);

  // Delete modal state
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Unlink evidence state
  const [evidenceToUnlink, setEvidenceToUnlink] = useState<string | null>(null);

  useEffect(() => {
    fetchProblem();
  }, [problemId, workspaceId]);

  const fetchProblem = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/problems/${problemId}`, {
        headers: { 'x-workspace-id': workspaceId },
      });
      if (!res.ok) {
        throw new Error('Falha ao carregar problema');
      }
      const data = await res.json();
      setProblem(data.problem);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar problema');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: ProblemStatus) => {
    if (!problem) return;
    setUpdatingField(true);
    try {
      const res = await fetch(`/api/problems/${problem.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setProblem(data.problem);
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    } finally {
      setUpdatingField(false);
    }
  };

  const handleUpdateImpact = async (newImpact: ProblemImpact) => {
    if (!problem) return;
    setUpdatingField(true);
    try {
      const res = await fetch(`/api/problems/${problem.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({ impact_level: newImpact }),
      });
      if (res.ok) {
        const data = await res.json();
        setProblem(data.problem);
      }
    } catch (err) {
      console.error('Erro ao atualizar impacto:', err);
    } finally {
      setUpdatingField(false);
    }
  };

  const handleDeleteProblem = async () => {
    if (!problem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/problems/${problem.id}`, {
        method: 'DELETE',
        headers: { 'x-workspace-id': workspaceId },
      });
      if (res.ok) {
        setIsConfirmingDelete(false);
        onProblemDeleted();
      } else {
        alert('Erro ao excluir problema.');
      }
    } catch (err) {
      console.error('Erro ao excluir problema:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUnlinkEvidence = async () => {
    if (!problem || !evidenceToUnlink) return;
    try {
      const res = await fetch(`/api/problems/${problem.id}/evidences/${evidenceToUnlink}`, {
        method: 'DELETE',
        headers: { 'x-workspace-id': workspaceId },
      });
      if (res.ok) {
        setEvidenceToUnlink(null);
        fetchProblem();
      }
    } catch (err) {
      console.error('Erro ao desvincular evidência:', err);
    }
  };

  const openEvidenceLinkPicker = async () => {
    setIsLinkingEvidence(true);
    setLoadingWorkspaceEvidences(true);
    setSelectedEvidenceIdsToLink([]);
    try {
      const res = await fetch('/api/evidences', {
        headers: { 'x-workspace-id': workspaceId },
      });
      if (res.ok) {
        const data = await res.json();
        // Exclude evidences already linked
        const currentLinkedIds = new Set(problem?.evidences?.map((e) => e.id) || []);
        const unlinked = (data.evidences || []).filter((e: Evidence) => !currentLinkedIds.has(e.id));
        setWorkspaceEvidences(unlinked);
      }
    } catch (err) {
      console.error('Erro ao buscar evidências:', err);
    } finally {
      setLoadingWorkspaceEvidences(false);
    }
  };

  const handleConfirmLinkEvidences = async () => {
    if (!problem || selectedEvidenceIdsToLink.length === 0) return;
    setLinkingSubmitting(true);
    try {
      const res = await fetch(`/api/problems/${problem.id}/link-evidences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({ evidence_ids: selectedEvidenceIdsToLink }),
      });
      if (res.ok) {
        setIsLinkingEvidence(false);
        setSelectedEvidenceIdsToLink([]);
        fetchProblem();
      }
    } catch (err) {
      console.error('Erro ao vincular evidências:', err);
    } finally {
      setLinkingSubmitting(false);
    }
  };

  const getImpactBadge = (impact: ProblemImpact) => {
    switch (impact) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'medium':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'low':
        return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-xs text-neutral-400">
        Carregando detalhes do problema no PostgreSQL...
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
        <h3 className="text-base font-semibold text-white">Problema não encontrado</h3>
        <p className="text-xs text-neutral-400">{error || 'Não foi possível carregar este registro.'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-neutral-800 text-xs text-white rounded-lg border border-neutral-700 inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Backlog</span>
        </button>
      </div>
    );
  }

  const linkedEvidences = problem.evidences || [];

  return (
    <div className="space-y-6">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
            title="Voltar ao Backlog"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-neutral-500">Problema ID: {problem.id.slice(0, 8)}...</span>
              <span className="text-neutral-600">•</span>
              <span className="text-xs text-neutral-400">
                Criado em {new Date(problem.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight mt-0.5">{problem.title}</h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {onCreateOpportunityFromProblem && (
            <button
              onClick={() => onCreateOpportunityFromProblem(problem.id)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gerar Oportunidade</span>
            </button>
          )}

          <button
            onClick={() => onEdit(problem)}
            className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg border border-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar</span>
          </button>

          <button
            onClick={() => setIsConfirmingDelete(true)}
            disabled={isDeleting}
            className="px-3.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir</span>
          </button>
        </div>
      </div>

      {/* Control Strip: Quick Status & Impact Switchers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Status Box */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="text-xs text-neutral-500">Status de Validação</div>
          <select
            value={problem.status}
            disabled={updatingField}
            onChange={(e) => handleUpdateStatus(e.target.value as ProblemStatus)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-neutral-600 cursor-pointer"
          >
            <option value="identified">Identificado (Descoberta)</option>
            <option value="exploring">Em Investigação</option>
            <option value="validated">Validado pelo Time</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>

        {/* Impact Box */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="text-xs text-neutral-500">Nível de Impacto</div>
          <select
            value={problem.impact_level}
            disabled={updatingField}
            onChange={(e) => handleUpdateImpact(e.target.value as ProblemImpact)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-neutral-600 cursor-pointer"
          >
            <option value="critical">Crítico (Bloqueio total)</option>
            <option value="high">Alto (Grande fricção)</option>
            <option value="medium">Médio (Incômodo)</option>
            <option value="low">Baixo (Cosmético/Raro)</option>
          </select>
        </div>

        {/* Evidences Counter */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-neutral-500">Evidências Vinculadas</div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <Quote className="w-4 h-4 text-emerald-400" />
            <span>{linkedEvidences.length}</span>
          </div>
          <div className="text-[11px] text-neutral-400">
            {linkedEvidences.length > 0 ? 'Fatos reais de pesquisas' : 'Nenhuma evidência vinculada'}
          </div>
        </div>

        {/* Multi-tenant Isolation Badge */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-neutral-500">Isolamento de Tenant</div>
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mt-1">
            <ShieldCheck className="w-4 h-4" />
            <span>PostgreSQL RLS Ativo</span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono truncate">
            ws: {workspaceId.slice(0, 8)}...
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Descrição da Dor & Fricção Observada
        </h3>
        <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">
          {problem.description}
        </p>
      </div>

      {/* RASTREABILIDADE: Evidências que comprovam o problema */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Quote className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Rastreabilidade: Evidências Comprobatórias ({linkedEvidences.length})
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Citações reais de usuários e contexto das entrevistas que comprovam este problema.
            </p>
          </div>

          <button
            onClick={openEvidenceLinkPicker}
            className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 hover:text-emerald-300 border border-neutral-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Vincular Evidência Existente</span>
          </button>
        </div>

        {/* Inline Evidence Picker Modal / Drawer */}
        {isLinkingEvidence && (
          <div className="bg-neutral-900 border-2 border-emerald-500/40 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Vincular Evidências Existentes ao Problema
                </h3>
              </div>
              <button
                onClick={() => setIsLinkingEvidence(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={evidenceSearchTerm}
                onChange={(e) => setEvidenceSearchTerm(e.target.value)}
                placeholder="Buscar evidência por citação ou pesquisa..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
              />
            </div>

            {loadingWorkspaceEvidences ? (
              <div className="text-center py-6 text-xs text-neutral-400">
                Carregando evidências do workspace...
              </div>
            ) : workspaceEvidences.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-400">
                Não há outras evidências disponíveis neste workspace para vincular.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {workspaceEvidences
                  .filter((ev) =>
                    ev.quote.toLowerCase().includes(evidenceSearchTerm.toLowerCase()) ||
                    ev.research_title?.toLowerCase().includes(evidenceSearchTerm.toLowerCase())
                  )
                  .map((ev) => {
                    const isSelected = selectedEvidenceIdsToLink.includes(ev.id);
                    return (
                      <div
                        key={ev.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedEvidenceIdsToLink(
                              selectedEvidenceIdsToLink.filter((id) => id !== ev.id)
                            );
                          } else {
                            setSelectedEvidenceIdsToLink([...selectedEvidenceIdsToLink, ev.id]);
                          }
                        }}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-950/30 border-emerald-500/60 text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-0.5 rounded border-neutral-700 text-emerald-500 focus:ring-0 cursor-pointer"
                          />
                          <div className="flex-1 space-y-1">
                            <p className="font-medium italic text-neutral-100">"{ev.quote}"</p>
                            {ev.research_title && (
                              <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                                <FileText className="w-3 h-3 text-neutral-500" />
                                <span>Origem: {ev.research_title}</span>
                                {ev.research_participant_name && (
                                  <span>({ev.research_participant_name})</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setIsLinkingEvidence(false)}
                className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmLinkEvidences}
                disabled={selectedEvidenceIdsToLink.length === 0 || linkingSubmitting}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all"
              >
                {linkingSubmitting
                  ? 'Vinculando...'
                  : `Vincular ${selectedEvidenceIdsToLink.length} Evidência(s)`}
              </button>
            </div>
          </div>
        )}

        {/* Linked Evidences List */}
        {linkedEvidences.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center space-y-3">
            <Quote className="w-8 h-8 text-neutral-600 mx-auto" />
            <div>
              <h4 className="text-sm font-semibold text-white">Nenhuma evidência vinculada ainda</h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                Este problema atualmente é uma hipótese não respaldada por fatos. Vincule citações de entrevistas ou pesquisas para fundamentá-lo.
              </p>
            </div>
            <button
              onClick={openEvidenceLinkPicker}
              className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs text-emerald-400 rounded-lg border border-neutral-700 inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Vincular Evidência</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {linkedEvidences.map((ev, idx) => (
              <div
                key={ev.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3 transition-all hover:border-neutral-700"
              >
                {/* Evidence Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-neutral-400">#{idx + 1}</span>
                    <span
                      className={`text-[10px] uppercase font-medium px-2 py-0.5 rounded border ${getConfidenceBadge(
                        ev.confidence_level
                      )}`}
                    >
                      Confiança: {ev.confidence_level}
                    </span>
                  </div>

                  <button
                    onClick={() => setEvidenceToUnlink(ev.id)}
                    className="text-neutral-500 hover:text-red-400 text-xs flex items-center gap-1 transition-colors p-1 cursor-pointer"
                    title="Desvincular do problema"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Desvincular</span>
                  </button>
                </div>

                {/* Direct Quote (User voice) */}
                <blockquote className="text-sm border-l-2 border-emerald-500 pl-3.5 italic text-neutral-100 leading-relaxed font-medium bg-neutral-950/40 p-3 rounded-r-lg">
                  "{ev.quote}"
                </blockquote>

                {/* Context if available */}
                {ev.context && (
                  <p className="text-xs text-neutral-400 pl-3.5">
                    <span className="text-neutral-500 font-medium">Contexto:</span> {ev.context}
                  </p>
                )}

                {/* Tags */}
                {ev.tags && ev.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pl-3.5">
                    <Tag className="w-3 h-3 text-neutral-500" />
                    {ev.tags.map((tag, tagIdx) => (
                      <span
                        key={tagIdx}
                        className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded border border-neutral-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Traceability: Origin Research Link */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-neutral-800 text-xs text-neutral-400 bg-neutral-950/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="text-neutral-500">Pesquisa de Origem: </span>
                      <span className="font-semibold text-white">
                        {ev.research_title || 'Entrevista do Workspace'}
                      </span>
                      {ev.research_participant_name && (
                        <span className="text-neutral-400"> (👤 {ev.research_participant_name})</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateToResearch(ev.research_id)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors self-start sm:self-auto"
                  >
                    <span>Ver Transcrição Completa</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Problem Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmingDelete}
        title="Excluir Problema do Workspace"
        description={`Tem certeza que deseja excluir o problema "${problem.title}"? Esta ação removerá o registro e os seus vínculos de rastreabilidade.`}
        confirmText="Excluir Problema"
        loading={isDeleting}
        onConfirm={handleDeleteProblem}
        onClose={() => setIsConfirmingDelete(false)}
      />

      {/* Unlink Evidence Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(evidenceToUnlink)}
        title="Desvincular Evidência Comprobatória"
        description="Deseja desvincular esta citação do problema? A evidência continuará salva no repositório de pesquisas."
        confirmText="Desvincular"
        onConfirm={handleUnlinkEvidence}
        onClose={() => setEvidenceToUnlink(null)}
      />
    </div>
  );
}
