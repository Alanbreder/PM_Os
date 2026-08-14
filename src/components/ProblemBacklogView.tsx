import React, { useState } from 'react';
import {
  AlertCircle,
  Plus,
  Search,
  Quote,
  Layers,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  Archive,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { Problem, ProblemImpact, ProblemStatus } from '../types';

interface ProblemBacklogViewProps {
  problems: Problem[];
  loading: boolean;
  onSelectProblem: (problemId: string) => void;
  onCreateProblem: () => void;
  onSelectResearch?: (researchId: string) => void;
}

export function ProblemBacklogView({
  problems,
  loading,
  onSelectProblem,
  onCreateProblem,
  onSelectResearch,
}: ProblemBacklogViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedImpact, setSelectedImpact] = useState<string>('all');

  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.evidences?.some((e) => e.quote.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
    const matchesImpact = selectedImpact === 'all' || p.impact_level === selectedImpact;

    return matchesSearch && matchesStatus && matchesImpact;
  });

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

  const getImpactLabel = (impact: ProblemImpact) => {
    switch (impact) {
      case 'critical':
        return 'Crítico';
      case 'high':
        return 'Alto';
      case 'medium':
        return 'Médio';
      case 'low':
        return 'Baixo';
      default:
        return impact;
    }
  };

  const getStatusBadge = (status: ProblemStatus) => {
    switch (status) {
      case 'validated':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'exploring':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'identified':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'archived':
        return 'bg-neutral-800 text-neutral-500 border-neutral-700';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  const getStatusLabel = (status: ProblemStatus) => {
    switch (status) {
      case 'validated':
        return 'Validado';
      case 'exploring':
        return 'Em Investigação';
      case 'identified':
        return 'Identificado';
      case 'archived':
        return 'Arquivado';
      default:
        return status;
    }
  };

  // Metrics
  const criticalCount = problems.filter((p) => p.impact_level === 'critical' || p.impact_level === 'high').length;
  const validatedCount = problems.filter((p) => p.status === 'validated').length;
  const backedByEvidencesCount = problems.filter((p) => (p.evidences?.length || 0) > 0).length;

  return (
    <div className="space-y-6">
      {/* Header & Metrics Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Problem Backlog</h2>
            <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded border border-neutral-700 font-mono">
              Etapa 3
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Central de dores e necessidades descobertas. Rastreabilidade direta: Problema → Evidências → Entrevistas.
          </p>
        </div>

        <button
          onClick={onCreateProblem}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Problema</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] text-neutral-400 font-medium">Total de Problemas</div>
          <div className="text-xl font-bold text-white">{problems.length}</div>
          <div className="text-[10px] text-neutral-500">Mapeados no workspace</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            Alto / Crítico
          </div>
          <div className="text-xl font-bold text-white">{criticalCount}</div>
          <div className="text-[10px] text-neutral-500">Maior fricção no usuário</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Validados
          </div>
          <div className="text-xl font-bold text-white">{validatedCount}</div>
          <div className="text-[10px] text-neutral-500">Confirmados pelo time</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] text-blue-400 font-medium flex items-center gap-1">
            <Quote className="w-3.5 h-3.5" />
            Com Evidências
          </div>
          <div className="text-xl font-bold text-white">{backedByEvidencesCount}</div>
          <div className="text-[10px] text-neutral-500">Comprovados por fatos</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, descrição ou citação..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300">
            <Filter className="w-3 h-3 text-neutral-500" />
            <span className="text-neutral-500 text-[11px]">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-neutral-900 text-white">Todos</option>
              <option value="identified" className="bg-neutral-900 text-white">Identificado</option>
              <option value="exploring" className="bg-neutral-900 text-white">Em Investigação</option>
              <option value="validated" className="bg-neutral-900 text-white">Validado</option>
              <option value="archived" className="bg-neutral-900 text-white">Arquivado</option>
            </select>
          </div>

          {/* Impact Filter */}
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300">
            <span className="text-neutral-500 text-[11px]">Impacto:</span>
            <select
              value={selectedImpact}
              onChange={(e) => setSelectedImpact(e.target.value)}
              className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-neutral-900 text-white">Todos</option>
              <option value="critical" className="bg-neutral-900 text-white">Crítico</option>
              <option value="high" className="bg-neutral-900 text-white">Alto</option>
              <option value="medium" className="bg-neutral-900 text-white">Médio</option>
              <option value="low" className="bg-neutral-900 text-white">Baixo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Problems List */}
      {loading ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-xs text-neutral-400">
          Carregando backlog de problemas do PostgreSQL...
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Nenhum problema encontrado</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              {problems.length === 0
                ? 'Cadastre um problema manualmente ou analise uma pesquisa/entrevista para extrair dores com IA.'
                : 'Nenhum problema corresponde aos filtros aplicados.'}
            </p>
          </div>
          {problems.length === 0 && (
            <button
              onClick={onCreateProblem}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg border border-neutral-700 inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Problema</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProblems.map((problem) => {
            const evidenceCount = problem.evidences?.length || 0;
            return (
              <div
                key={problem.id}
                onClick={() => onSelectProblem(problem.id)}
                className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/80 rounded-xl p-5 transition-all cursor-pointer space-y-3.5 group"
              >
                {/* Header Row: Status, Impact, Date */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded border ${getStatusBadge(
                        problem.status
                      )}`}
                    >
                      {getStatusLabel(problem.status)}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded border ${getImpactBadge(
                        problem.impact_level
                      )}`}
                    >
                      Impacto: {getImpactLabel(problem.impact_level)}
                    </span>
                  </div>

                  <span className="text-xs text-neutral-500 font-mono">
                    {new Date(problem.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors leading-snug">
                    {problem.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {problem.description}
                  </p>
                </div>

                {/* Traceability Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    {evidenceCount > 0 ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 text-[11px] font-medium">
                        <Quote className="w-3.5 h-3.5" />
                        <span>
                          {evidenceCount} {evidenceCount === 1 ? 'evidência comprobatória' : 'evidências comprobatórias'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-neutral-500 bg-neutral-800/60 px-2.5 py-1 rounded-md text-[11px]">
                        <Quote className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Sem evidências vinculadas (hipótese)</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-neutral-400 group-hover:text-white transition-colors text-xs font-medium">
                    <span>Ver Detalhes & Rastreabilidade</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
