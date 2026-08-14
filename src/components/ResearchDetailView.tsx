import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Quote,
  AlertCircle,
  FileText,
  User,
  Building,
  Calendar,
  Layers,
  Database,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Research, Evidence, Problem, ConfidenceLevel, ProblemImpact } from '../types';

interface ResearchDetailViewProps {
  researchId: string;
  workspaceId: string;
  onBack: () => void;
  onStartAIAnalysis: () => void;
  onCreateProblemFromEvidence?: (evidenceId: string) => void;
  onSelectProblem?: (problemId: string) => void;
}

export const ResearchDetailView: React.FC<ResearchDetailViewProps> = ({
  researchId,
  workspaceId,
  onBack,
  onStartAIAnalysis,
  onCreateProblemFromEvidence,
  onSelectProblem,
}) => {
  const [research, setResearch] = useState<Research | null>(null);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);

  useEffect(() => {
    fetchResearchData();
  }, [researchId, workspaceId]);

  const fetchResearchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch research with its evidences
      const res = await fetch(`/api/researches/${researchId}`, {
        headers: {
          'x-workspace-id': workspaceId,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao carregar detalhes da pesquisa');
      }

      setResearch(data.research);
      setEvidences(data.research.evidences || []);

      // 2. Fetch problems in workspace
      const probRes = await fetch(`/api/problems`, {
        headers: {
          'x-workspace-id': workspaceId,
        },
      });
      if (probRes.ok) {
        const probData = await probRes.json();
        setProblems(probData.problems || []);
      }
    } catch (err: any) {
      console.error('Erro ao carregar pesquisa:', err);
      setError(err.message || 'Falha ao buscar dados no banco');
    } finally {
      setLoading(false);
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
        return 'bg-red-950 text-red-400 border-red-800';
      case 'high':
        return 'bg-orange-950 text-orange-400 border-orange-800';
      case 'medium':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'low':
        return 'bg-blue-950 text-blue-400 border-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-neutral-400 text-sm">
        Carregando dados da pesquisa no PostgreSQL Cloud SQL...
      </div>
    );
  }

  if (error || !research) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 space-y-4">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-semibold text-white">Não foi possível carregar a pesquisa</h3>
        </div>
        <p className="text-sm text-neutral-400">{error || 'Pesquisa não encontrada.'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          Voltar para Lista
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
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
              <span className="text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                {research.source_type}
              </span>
              <span className="text-xs text-neutral-500">
                {new Date(research.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{research.title}</h2>
          </div>
        </div>

        <button
          onClick={onStartAIAnalysis}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>✨ Analisar com IA</span>
        </button>
      </div>

      {/* Participant and metadata cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-neutral-400" />
            Participante
          </div>
          <p className="text-sm font-medium text-white">
            {research.participant_info?.name || 'Não informado'}
          </p>
          {research.participant_info?.role && (
            <p className="text-xs text-neutral-400">{research.participant_info.role}</p>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-neutral-400" />
            Empresa / Segmento
          </div>
          <p className="text-sm font-medium text-white">
            {research.participant_info?.company || 'Geral / Interno'}
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-1">
          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            Persistência Oficial
          </div>
          <p className="text-sm font-medium text-white">{evidences.length} evidências salvas</p>
          <p className="text-xs text-neutral-400">PostgreSQL (Cloud SQL)</p>
        </div>
      </div>

      {/* Transcrição Raw Content (collapsible) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <FileText className="w-4 h-4 text-neutral-400" />
            <span>Transcrição / Conteúdo Bruto da Entrevista</span>
            <span className="text-xs font-normal text-neutral-500">
              ({research.raw_content.length} caracteres)
            </span>
          </div>

          <button className="text-xs text-neutral-400 flex items-center gap-1">
            {isTranscriptExpanded ? (
              <>
                <span>Recolher</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Expandir texto</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div
          className={`bg-neutral-950 border border-neutral-800 rounded-lg p-4 font-mono text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed transition-all ${
            isTranscriptExpanded ? 'max-h-none' : 'max-h-40 overflow-hidden relative'
          }`}
        >
          {research.raw_content}
          {!isTranscriptExpanded && (
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none" />
          )}
        </div>
      </div>

      {/* Persisted Evidences & Problems Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saved Evidences */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Quote className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-white text-base">
                Evidências Salvas ({evidences.length})
              </h3>
            </div>
            <span className="text-xs text-neutral-500">Fatos aprovados pelo PM</span>
          </div>

          {evidences.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center space-y-3">
              <p className="text-xs text-neutral-400">
                Nenhuma evidência oficial cadastrada para esta pesquisa ainda.
              </p>
              <button
                onClick={onStartAIAnalysis}
                className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs text-white rounded-lg border border-neutral-700 inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Extrair com IA
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {evidences.map((ev, idx) => (
                <div
                  key={ev.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2 text-neutral-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-neutral-400">#{idx + 1}</span>
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${getConfidenceBadge(
                        ev.confidence_level
                      )}`}
                    >
                      Confiança: {ev.confidence_level}
                    </span>
                  </div>

                  <blockquote className="text-xs border-l-2 border-emerald-500/60 pl-2.5 italic">
                    "{ev.quote}"
                  </blockquote>

                  {ev.context && (
                    <p className="text-[11px] text-neutral-400 pl-2.5">
                      <span className="text-neutral-500">Contexto:</span> {ev.context}
                    </p>
                  )}

                  {onCreateProblemFromEvidence && (
                    <div className="pt-2 border-t border-neutral-800 flex justify-end">
                      <button
                        onClick={() => onCreateProblemFromEvidence(ev.id)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <span>+ Criar Problema a partir desta evidência</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Problems in Workspace */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <h3 className="font-semibold text-white text-base">
                Problemas Registrados no Workspace ({problems.length})
              </h3>
            </div>
            <span className="text-xs text-neutral-500">Mapeados via Discovery</span>
          </div>

          {problems.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-xs text-neutral-400">
              Nenhum problema registrado neste workspace ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {problems.map((prob) => (
                <div
                  key={prob.id}
                  onClick={() => onSelectProblem && onSelectProblem(prob.id)}
                  className={`bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2 text-neutral-200 transition-all ${
                    onSelectProblem ? 'hover:border-neutral-700 cursor-pointer group' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">
                      {prob.title}
                    </h4>
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${getImpactBadge(
                        prob.impact_level
                      )}`}
                    >
                      Impacto: {prob.impact_level}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed">{prob.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
