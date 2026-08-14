import React, { useState, useEffect } from 'react';
import { Lightbulb, ArrowLeft, AlertCircle, Save, Check, Search, X } from 'lucide-react';
import { Opportunity, OpportunityStatus, Problem } from '../types';

interface OpportunityFormViewProps {
  workspaceId: string;
  opportunityToEdit?: Opportunity | null;
  initialProblemId?: string | null;
  onBack: () => void;
  onSaved: (opportunity: Opportunity) => void;
}

export function OpportunityFormView({
  workspaceId,
  opportunityToEdit,
  initialProblemId,
  onBack,
  onSaved,
}: OpportunityFormViewProps) {
  const isEditing = Boolean(opportunityToEdit);

  const [title, setTitle] = useState(opportunityToEdit?.title || '');
  const [description, setDescription] = useState(opportunityToEdit?.description || '');
  const [status, setStatus] = useState<OpportunityStatus>(opportunityToEdit?.status || 'draft');

  // Workspace problems for multi-select
  const [availableProblems, setAvailableProblems] = useState<Problem[]>([]);
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [problemSearchTerm, setProblemSearchTerm] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkspaceProblems();
  }, [workspaceId]);

  const fetchWorkspaceProblems = async () => {
    setLoadingProblems(true);
    try {
      const res = await fetch('/api/problems', {
        headers: { 'x-workspace-id': workspaceId },
      });
      if (res.ok) {
        const data = await res.json();
        const problemsList = data.problems || [];
        setAvailableProblems(problemsList);

        // Pre-select problems if editing or created from a problem
        if (opportunityToEdit?.problems) {
          setSelectedProblemIds(opportunityToEdit.problems.map((p) => p.id));
        } else if (initialProblemId) {
          setSelectedProblemIds([initialProblemId]);
        }
      }
    } catch (err) {
      console.error('Erro ao listar problemas:', err);
    } finally {
      setLoadingProblems(false);
    }
  };

  const toggleProblemSelection = (pId: string) => {
    setSelectedProblemIds((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 3) {
      setError('O título deve ter pelo menos 3 caracteres.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError('A descrição da oportunidade deve ter pelo menos 10 caracteres.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        status,
        problem_ids: selectedProblemIds,
      };

      const url = isEditing ? `/api/opportunities/${opportunityToEdit!.id}` : '/api/opportunities';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao salvar oportunidade');
      }

      const data = await res.json();
      onSaved(data.opportunity);
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar oportunidade.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Backlog</span>
        </button>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold px-2.5 py-0.5 rounded flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5" />
              {isEditing ? 'Edição de Oportunidade' : 'Nova Oportunidade'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isEditing ? 'Editar Oportunidade Estratégica' : 'Cadastrar Nova Oportunidade'}
          </h2>
          <p className="text-neutral-400 text-xs">
            Formule uma área de oportunidade ou resultado a ser explorado pelo time de produto, sem antecipar soluções.
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">
              Título da Oportunidade <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reduzir o esforço e atrito no processo de cadastro de produtos"
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
            />
            <span className="text-[11px] text-neutral-500 block">
              Enuncie a oportunidade focando no resultado ou valor esperado (não em uma funcionalidade/solução).
            </span>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">
              Descrição do Contexto & Objetivo <span className="text-amber-400">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva por que essa área de oportunidade vale a pena ser explorada e qual o impacto desejado..."
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 leading-relaxed"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">
              Status da Oportunidade
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OpportunityStatus)}
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value="draft">Rascunho (Em formulação)</option>
              <option value="active">Ativa / Em Exploração (Em foco pelo time)</option>
              <option value="archived">Arquivada (Descartada ou fora de foco)</option>
            </select>
          </div>

          {/* Connected Problems Selector */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
                Problemas que Sustentam esta Oportunidade ({selectedProblemIds.length})
              </label>
            </div>

            {loadingProblems ? (
              <div className="p-4 text-center text-xs text-neutral-500 bg-neutral-950 rounded-lg">
                Carregando problemas do workspace...
              </div>
            ) : availableProblems.length === 0 ? (
              <div className="p-4 text-center text-xs text-neutral-500 bg-neutral-950 rounded-lg border border-neutral-800">
                Nenhum problema cadastrado no workspace. Você poderá vincular problemas posteriormente.
              </div>
            ) : (
              <div className="space-y-2 bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={problemSearchTerm}
                    onChange={(e) => setProblemSearchTerm(e.target.value)}
                    placeholder="Filtrar problemas..."
                    className="w-full pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {availableProblems
                    .filter(
                      (p) =>
                        p.title.toLowerCase().includes(problemSearchTerm.toLowerCase()) ||
                        p.description.toLowerCase().includes(problemSearchTerm.toLowerCase())
                    )
                    .map((problem) => {
                      const isSelected = selectedProblemIds.includes(problem.id);
                      return (
                        <div
                          key={problem.id}
                          onClick={() => toggleProblemSelection(problem.id)}
                          className={`p-2.5 rounded border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                              : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center mt-0.5 shrink-0 ${
                              isSelected
                                ? 'bg-amber-500 border-amber-500 text-neutral-950'
                                : 'border-neutral-700 bg-neutral-950'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold truncate">{problem.title}</span>
                              <span className="text-[10px] text-neutral-500 uppercase font-mono ml-2 shrink-0">
                                {problem.impact_level}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 line-clamp-1">
                              {problem.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold px-5 py-2 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/10 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Oportunidade'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
