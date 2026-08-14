import React, { useState } from 'react';
import {
  Lightbulb,
  Plus,
  Search,
  Filter,
  AlertCircle,
  FileText,
  ChevronRight,
  ShieldCheck,
  Tag,
  Clock,
  Layers,
  ArrowUpRight,
  Quote,
} from 'lucide-react';
import { Opportunity, OpportunityStatus, Problem } from '../types';

interface OpportunityBacklogViewProps {
  opportunities: Opportunity[];
  loading: boolean;
  onSelectOpportunity: (id: string) => void;
  onCreateNew: () => void;
  onNavigateToProblem: (problemId: string) => void;
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

export function OpportunityBacklogView({
  opportunities,
  loading,
  onSelectOpportunity,
  onCreateNew,
  onNavigateToProblem,
}: OpportunityBacklogViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Filter opportunities
  const filteredOpportunities = opportunities.filter((o) => {
    const matchesSearch =
      o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.problems &&
        o.problems.some(
          (p) =>
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(searchTerm.toLowerCase())
        ));

    const matchesStatus = selectedStatus === 'all' || o.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const totalCount = opportunities.length;
  const activeCount = opportunities.filter((o) => o.status === 'active').length;
  const draftCount = opportunities.filter((o) => o.status === 'draft').length;
  const totalProblemsLinked = opportunities.reduce(
    (acc, curr) => acc + (curr.problems?.length || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold px-2 py-0.5 rounded">
              Etapa 4 — Opportunity Backlog
            </span>
            <span className="text-neutral-500 text-xs font-mono">
              Problem → Opportunity → Rastreabilidade
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            Backlog de Oportunidades
          </h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Mapeie e estruture áreas de valor e resultados estratégicos derivados diretamente dos problemas validados.
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold px-4 py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Oportunidade</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4">
          <div className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Total</div>
          <div className="text-2xl font-bold text-white mt-1">{totalCount}</div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Oportunidades mapeadas</div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4">
          <div className="text-xs font-medium text-amber-400 uppercase tracking-wider">Ativas / Exploração</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{activeCount}</div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Em foco do time de produto</div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4">
          <div className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Em Rascunho</div>
          <div className="text-2xl font-bold text-neutral-300 mt-1">{draftCount}</div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Definições em elaboração</div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4">
          <div className="text-xs font-medium text-orange-400 uppercase tracking-wider">Problemas Vinculados</div>
          <div className="text-2xl font-bold text-orange-400 mt-1">{totalProblemsLinked}</div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Sustentando as oportunidades</div>
        </div>
      </div>

      {/* Filters and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/40 p-3 rounded-xl border border-neutral-800/60">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por oportunidade, descrição ou problema conectado..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-xs text-neutral-400">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativas (Em Exploração)</option>
            <option value="draft">Rascunho</option>
            <option value="archived">Arquivadas</option>
          </select>
        </div>
      </div>

      {/* Opportunities List */}
      {loading ? (
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-12 text-center text-neutral-500 text-sm">
          Carregando backlog de oportunidades...
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-12 text-center space-y-3">
          <Lightbulb className="w-8 h-8 text-neutral-600 mx-auto" />
          <div className="text-neutral-300 font-medium text-sm">Nenhuma oportunidade encontrada</div>
          <p className="text-neutral-500 text-xs max-w-md mx-auto">
            {searchTerm || selectedStatus !== 'all'
              ? 'Tente ajustar os filtros de busca para encontrar as oportunidades desejadas.'
              : 'Transforme os problemas validados do seu produto em oportunidades de valor.'}
          </p>
          {!searchTerm && selectedStatus === 'all' && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium pt-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar primeira oportunidade</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredOpportunities.map((opp) => {
            const status = statusConfig[opp.status] || statusConfig.draft;
            const linkedProblemsCount = opp.problems?.length || 0;

            // Total evidences connected across all linked problems
            const totalEvidencesCount =
              opp.problems?.reduce(
                (acc, p) => acc + (p.evidences?.length || 0),
                0
              ) || 0;

            return (
              <div
                key={opp.id}
                onClick={() => onSelectOpportunity(opp.id)}
                className="bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700 rounded-xl p-5 transition-all group cursor-pointer space-y-4"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-[11px] font-medium ${status.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                        {status.label}
                      </span>
                      <span className="text-neutral-500 text-[11px] font-mono">
                        Criada em {new Date(opp.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                      {opp.title}
                    </h3>
                  </div>

                  <div className="text-neutral-500 group-hover:text-amber-400 transition-colors p-1">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                  {opp.description}
                </p>

                {/* Linked Problems Preview & Rastreabilidade */}
                <div className="pt-2 border-t border-neutral-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  {/* Connected Problems Chips */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-neutral-500 flex items-center gap-1 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
                      Problemas ({linkedProblemsCount}):
                    </span>
                    {linkedProblemsCount === 0 ? (
                      <span className="text-neutral-600 italic text-[11px]">Nenhum problema vinculado</span>
                    ) : (
                      opp.problems?.slice(0, 3).map((p) => (
                        <button
                          key={p.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToProblem(p.id);
                          }}
                          className="bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-[11px] px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span className="truncate max-w-[150px]">{p.title}</span>
                          <ArrowUpRight className="w-3 h-3 text-neutral-500" />
                        </button>
                      ))
                    )}
                    {linkedProblemsCount > 3 && (
                      <span className="text-neutral-500 text-[11px] font-mono">
                        +{linkedProblemsCount - 3} mais
                      </span>
                    )}
                  </div>

                  {/* Evidences Backing Counter */}
                  <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] shrink-0">
                    <Quote className="w-3.5 h-3.5 text-teal-400" />
                    <span>
                      <strong className="text-neutral-200">{totalEvidencesCount}</strong> evidências comprobatórias
                    </span>
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
