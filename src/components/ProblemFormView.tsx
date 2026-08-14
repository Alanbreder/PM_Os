import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  Save,
  Quote,
  Search,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { Problem, Evidence, ProblemImpact, ProblemStatus } from '../types';

interface ProblemFormViewProps {
  workspaceId: string;
  problemToEdit?: Problem | null;
  initialEvidenceId?: string | null;
  onBack: () => void;
  onSaved: (problem: Problem) => void;
}

export function ProblemFormView({
  workspaceId,
  problemToEdit,
  initialEvidenceId,
  onBack,
  onSaved,
}: ProblemFormViewProps) {
  const isEditing = Boolean(problemToEdit);

  const [title, setTitle] = useState(problemToEdit?.title || '');
  const [description, setDescription] = useState(problemToEdit?.description || '');
  const [impactLevel, setImpactLevel] = useState<ProblemImpact>(
    problemToEdit?.impact_level || 'medium'
  );
  const [status, setStatus] = useState<ProblemStatus>(problemToEdit?.status || 'identified');

  // Evidences selection
  const [availableEvidences, setAvailableEvidences] = useState<Evidence[]>([]);
  const [loadingEvidences, setLoadingEvidences] = useState(false);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>(() => {
    if (problemToEdit?.evidences) {
      return problemToEdit.evidences.map((e) => e.id);
    }
    if (initialEvidenceId) {
      return [initialEvidenceId];
    }
    return [];
  });
  const [evidenceSearchTerm, setEvidenceSearchTerm] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkspaceEvidences();
  }, [workspaceId]);

  const fetchWorkspaceEvidences = async () => {
    setLoadingEvidences(true);
    try {
      const res = await fetch('/api/evidences', {
        headers: { 'x-workspace-id': workspaceId },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableEvidences(data.evidences || []);
      }
    } catch (err) {
      console.error('Erro ao buscar evidências:', err);
    } finally {
      setLoadingEvidences(false);
    }
  };

  const toggleEvidence = (evidenceId: string) => {
    if (selectedEvidenceIds.includes(evidenceId)) {
      setSelectedEvidenceIds(selectedEvidenceIds.filter((id) => id !== evidenceId));
    } else {
      setSelectedEvidenceIds([...selectedEvidenceIds, evidenceId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (title.trim().length < 3) {
      setErrorMessage('O título deve ter pelo menos 3 caracteres.');
      return;
    }
    if (description.trim().length < 10) {
      setErrorMessage('A descrição deve ter pelo menos 10 caracteres para contextualizar a dor.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        impact_level: impactLevel,
        status: status,
        evidence_ids: selectedEvidenceIds,
      };

      let res: Response;
      if (isEditing && problemToEdit) {
        res = await fetch(`/api/problems/${problemToEdit.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-workspace-id': workspaceId,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/problems', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-workspace-id': workspaceId,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao salvar problema.');
      }

      onSaved(data.problem);
    } catch (err: any) {
      console.error('Erro ao submeter problema:', err);
      setErrorMessage(err.message || 'Ocorreu um erro ao salvar o problema no banco de dados.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEvidences = availableEvidences.filter(
    (e) =>
      e.quote.toLowerCase().includes(evidenceSearchTerm.toLowerCase()) ||
      e.research_title?.toLowerCase().includes(evidenceSearchTerm.toLowerCase()) ||
      e.tags.some((t) => t.toLowerCase().includes(evidenceSearchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {isEditing ? 'Editar Problema' : 'Cadastrar Novo Problema'}
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              {isEditing
                ? 'Atualize a definição da dor e suas evidências comprobatórias.'
                : 'Defina a dor observada e vincule as falas dos usuários que a fundamentam.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Multi-tenant Seguro</span>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-xs text-red-400 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">1. Informações do Problema</h2>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300">
              Título do Problema <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Dificuldade no fluxo de aprovação de despesas financeiras"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
            />
            <p className="text-[11px] text-neutral-500">
              Um resumo direto e claro da dor enfrentada pelo usuário.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300">
              Descrição Detalhada & Causa Raiz <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva detalhadamente o atrito, o contexto em que ocorre e como isso impacta o fluxo de trabalho do usuário..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 leading-relaxed resize-y"
            />
            <p className="text-[11px] text-neutral-500">
              Mínimo de 10 caracteres. Foco no comportamento e na fricção.
            </p>
          </div>

          {/* Impact & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">Nível de Impacto</label>
              <select
                value={impactLevel}
                onChange={(e) => setImpactLevel(e.target.value as ProblemImpact)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-500"
              >
                <option value="critical">Crítico (Impede o uso / Grande perda financeira)</option>
                <option value="high">Alto (Causa grande frustração e retrabalho)</option>
                <option value="medium">Médio (Incômodo perceptível no fluxo)</option>
                <option value="low">Baixo (Cosmético ou atrito pontual leve)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">Status de Validação</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProblemStatus)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-500"
              >
                <option value="identified">Identificado (Recém descoberto)</option>
                <option value="exploring">Em Investigação (Aprofundando discovery)</option>
                <option value="validated">Validado (Comprovado com relevância clara)</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Linked Evidences (Traceability) */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Quote className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">
                  2. Evidências Comprobatórias (Rastreabilidade)
                </h2>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Selecione as falas e constatações de pesquisas que comprovam este problema.
              </p>
            </div>

            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 self-start sm:self-auto">
              {selectedEvidenceIds.length} selecionada(s)
            </span>
          </div>

          {/* Search bar for evidences */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={evidenceSearchTerm}
              onChange={(e) => setEvidenceSearchTerm(e.target.value)}
              placeholder="Filtrar evidências do workspace..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
            />
          </div>

          {loadingEvidences ? (
            <div className="text-center py-6 text-xs text-neutral-400">
              Carregando evidências salvas no workspace...
            </div>
          ) : availableEvidences.length === 0 ? (
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 text-center text-xs text-neutral-400">
              Nenhuma evidência cadastrada no workspace ainda. Você pode salvar este problema agora e vincular evidências mais tarde.
            </div>
          ) : filteredEvidences.length === 0 ? (
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-center text-xs text-neutral-400">
              Nenhuma evidência encontrada para o filtro "{evidenceSearchTerm}".
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredEvidences.map((ev) => {
                const isSelected = selectedEvidenceIds.includes(ev.id);
                return (
                  <div
                    key={ev.id}
                    onClick={() => toggleEvidence(ev.id)}
                    className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500/60 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-1 rounded border-neutral-700 text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                      <div className="flex-1 space-y-1.5">
                        <blockquote className="italic font-medium text-neutral-100 leading-relaxed">
                          "{ev.quote}"
                        </blockquote>

                        <div className="flex items-center gap-3 text-[11px] text-neutral-400 flex-wrap">
                          {ev.research_title && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3 text-neutral-500" />
                              Origem: {ev.research_title}
                              {ev.research_participant_name && ` (${ev.research_participant_name})`}
                            </span>
                          )}

                          <span className="text-neutral-500">•</span>

                          <span className="uppercase text-[10px] text-neutral-400">
                            Confiança: {ev.confidence_level}
                          </span>

                          {ev.tags && ev.tags.length > 0 && (
                            <>
                              <span className="text-neutral-500">•</span>
                              <span className="flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5 text-neutral-500" />
                                {ev.tags.join(', ')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium rounded-lg transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Salvando...' : isEditing ? 'Atualizar Problema' : 'Salvar Problema'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
