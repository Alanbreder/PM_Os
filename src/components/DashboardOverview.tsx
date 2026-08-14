import React from 'react';
import {
  FileText,
  Quote,
  AlertCircle,
  Lightbulb,
  Sparkles,
  Plus,
  ArrowRight,
  TrendingUp,
  Compass,
} from 'lucide-react';
import { Research, Problem, Opportunity, Evidence, Hypothesis } from '../types';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface DashboardOverviewProps {
  workspaceName: string;
  researches: Research[];
  problems: Problem[];
  opportunities: Opportunity[];
  evidences: Evidence[];
  hypotheses: Hypothesis[];
  onNavigate: (key: string) => void;
  onSelectResearch: (id: string) => void;
  onSelectProblem: (id: string) => void;
  onSelectOpportunity: (id: string) => void;
  onCreateResearch: () => void;
}

export function DashboardOverview({
  workspaceName,
  researches,
  problems,
  opportunities,
  evidences,
  hypotheses,
  onNavigate,
  onSelectResearch,
  onSelectProblem,
  onSelectOpportunity,
  onCreateResearch,
}: DashboardOverviewProps) {
  const recentResearches = researches.slice(0, 4);
  const recentProblems = problems.slice(0, 4);
  const activeOpportunities = opportunities.filter((o) => o.status === 'active').slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Primary Discovery Hero CTA */}
      <div className="relative overflow-hidden bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 border border-neutral-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>Fluxo Contínuo de Discovery</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Workspace: <span className="text-amber-400">{workspaceName}</span>
          </h1>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Consolide entrevistas, extraia evidências em fatos reais, fundamente problemas reais dos usuários e direcione decisões estratégicas de produto sem adivinhação.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <Button
              onClick={onCreateResearch}
              icon={<Plus className="w-4 h-4" />}
            >
              + Nova Pesquisa
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNavigate('researches')}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Ver Todas Pesquisas
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <Card
          hoverable
          onClick={() => onNavigate('researches')}
          className="space-y-2 border-neutral-800/80 bg-neutral-900/60 hover:border-emerald-500/30"
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Pesquisas</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{researches.length}</div>
          <p className="text-[10px] text-neutral-500 truncate">Fontes originais de dados</p>
        </Card>

        <Card
          hoverable
          onClick={() => onNavigate('evidences')}
          className="space-y-2 border-neutral-800/80 bg-neutral-900/60 hover:border-cyan-500/30"
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Evidências</span>
            <Quote className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{evidences.length}</div>
          <p className="text-[10px] text-neutral-500 truncate">Citações e fatos verificados</p>
        </Card>

        <Card
          hoverable
          onClick={() => onNavigate('problems')}
          className="space-y-2 border-neutral-800/80 bg-neutral-900/60 hover:border-orange-500/30"
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Problemas</span>
            <AlertCircle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white">{problems.length}</div>
          <p className="text-[10px] text-neutral-500 truncate">Dores e necessidades reais</p>
        </Card>

        <Card
          hoverable
          onClick={() => onNavigate('opportunities')}
          className="space-y-2 border-neutral-800/80 bg-neutral-900/60 hover:border-amber-500/30"
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Oportunidades</span>
            <Lightbulb className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{opportunities.length}</div>
          <p className="text-[10px] text-neutral-500 truncate">Foco estratégico de valor</p>
        </Card>

        <Card
          hoverable
          onClick={() => onNavigate('hypotheses')}
          className="space-y-2 border-neutral-800/80 bg-neutral-900/60 hover:border-indigo-500/30"
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Hipóteses</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{hypotheses.length}</div>
          <p className="text-[10px] text-neutral-500 truncate">Apostas e experimentos</p>
        </Card>
      </div>

      {/* Recent Items Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Researches */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Últimas Pesquisas</span>
            </h3>
            <button
              onClick={() => onNavigate('researches')}
              className="text-[11px] text-amber-400 hover:underline font-medium cursor-pointer"
            >
              Ver todas
            </button>
          </div>

          {recentResearches.length === 0 ? (
            <p className="text-xs text-neutral-500 py-4 text-center">Nenhuma pesquisa no workspace.</p>
          ) : (
            <div className="space-y-2.5">
              {recentResearches.map((r) => (
                <div
                  key={r.id}
                  onClick={() => onSelectResearch(r.id)}
                  className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-white truncate">{r.title}</span>
                    <Badge variant={r.status}>{r.status === 'processed' ? 'Analisada' : 'Rascunho'}</Badge>
                  </div>
                  <p className="text-[10px] text-neutral-400 line-clamp-1">
                    {r.participant_info?.name
                      ? `Participante: ${r.participant_info.name}`
                      : r.raw_content.substring(0, 60)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Problems */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <span>Problemas Recentes</span>
            </h3>
            <button
              onClick={() => onNavigate('problems')}
              className="text-[11px] text-amber-400 hover:underline font-medium cursor-pointer"
            >
              Ver todos
            </button>
          </div>

          {recentProblems.length === 0 ? (
            <p className="text-xs text-neutral-500 py-4 text-center">Nenhum problema cadastrado.</p>
          ) : (
            <div className="space-y-2.5">
              {recentProblems.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectProblem(p.id)}
                  className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-white truncate">{p.title}</span>
                    <Badge variant={p.impact_level}>{p.impact_level}</Badge>
                  </div>
                  <p className="text-[10px] text-neutral-400 line-clamp-1">{p.description}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Active Opportunities */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Oportunidades em Exploração</span>
            </h3>
            <button
              onClick={() => onNavigate('opportunities')}
              className="text-[11px] text-amber-400 hover:underline font-medium cursor-pointer"
            >
              Ver todas
            </button>
          </div>

          {activeOpportunities.length === 0 ? (
            <p className="text-xs text-neutral-500 py-4 text-center">Nenhuma oportunidade ativa no momento.</p>
          ) : (
            <div className="space-y-2.5">
              {activeOpportunities.map((o) => (
                <div
                  key={o.id}
                  onClick={() => onSelectOpportunity(o.id)}
                  className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-white truncate">{o.title}</span>
                    <Badge variant="active">Ativa</Badge>
                  </div>
                  <p className="text-[10px] text-neutral-400 line-clamp-1">{o.description}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
