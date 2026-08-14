import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  FileText,
  Quote,
  AlertCircle,
  Database,
  ShieldCheck,
  Building,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  Terminal,
} from 'lucide-react';
import { Research, Workspace } from './types';
import { ResearchForm } from './components/ResearchForm';
import { ResearchAnalysisReview } from './components/ResearchAnalysisReview';
import { ResearchDetailView } from './components/ResearchDetailView';

export default function App() {
  // Current active workspace
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('11111111-1111-1111-1111-111111111111');
  
  // Researches list
  const [researches, setResearches] = useState<Research[]>([]);
  const [loadingResearches, setLoadingResearches] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Navigation views: 'list' | 'create' | 'analyze_review' | 'detail' | 'security_tests'
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'analyze_review' | 'detail' | 'security_tests'>('list');
  const [selectedResearchId, setSelectedResearchId] = useState<string | null>(null);

  // Security tests state
  const [securityReports, setSecurityReports] = useState<any[] | null>(null);
  const [runningSecurityTests, setRunningSecurityTests] = useState(false);

  // Initialize workspaces and fetch researches
  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (activeWorkspaceId) {
      fetchResearches();
    }
  }, [activeWorkspaceId]);

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('/api/workspaces', {
        headers: { 'x-workspace-id': activeWorkspaceId },
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.workspaces || []);
        if (data.workspaces?.length > 0 && !activeWorkspaceId) {
          setActiveWorkspaceId(data.workspaces[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao listar workspaces:', err);
    }
  };

  const fetchResearches = async () => {
    setLoadingResearches(true);
    try {
      const res = await fetch('/api/researches', {
        headers: {
          'x-workspace-id': activeWorkspaceId,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setResearches(data.researches || []);
      }
    } catch (err) {
      console.error('Erro ao listar pesquisas:', err);
    } finally {
      setLoadingResearches(false);
    }
  };

  const runSecurityTests = async () => {
    setRunningSecurityTests(true);
    try {
      const res = await fetch('/api/test/security-suite');
      const data = await res.json();
      setSecurityReports(data.tests || []);
    } catch (err) {
      console.error('Erro ao rodar testes de segurança:', err);
    } finally {
      setRunningSecurityTests(false);
    }
  };

  const handleCreatedResearch = (newResearchId: string, autoAnalyze: boolean) => {
    fetchResearches();
    setSelectedResearchId(newResearchId);
    if (autoAnalyze) {
      setCurrentView('analyze_review');
    } else {
      setCurrentView('detail');
    }
  };

  const filteredResearches = researches.filter((r) =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.raw_content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeResearch = researches.find((r) => r.id === selectedResearchId);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Navbar */}
        <header className="border-b border-neutral-800 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold px-2 py-0.5 rounded">
                  Etapa 2 Operacional
                </span>
                <span className="text-neutral-500 text-xs font-mono">Discovery + Gemini IA</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">
                Product OS <span className="text-neutral-500 font-normal text-sm">| Continuous Discovery</span>
              </h1>
            </div>
          </div>

          {/* Workspace Switcher & Security Suite Button */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Workspace Selector */}
            <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-300">
              <Building className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-neutral-500">Workspace:</span>
              <select
                value={activeWorkspaceId}
                onChange={(e) => {
                  setActiveWorkspaceId(e.target.value);
                  setCurrentView('list');
                }}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id} className="bg-neutral-900 text-white">
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Suite Trigger */}
            <button
              onClick={() => {
                setCurrentView('security_tests');
                if (!securityReports) runSecurityTests();
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                currentView === 'security_tests'
                  ? 'bg-neutral-800 text-white border-neutral-700'
                  : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Testes de Segurança</span>
            </button>
          </div>
        </header>

        {/* View 1: List Researches */}
        {currentView === 'list' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar pesquisas, transcrições ou temas..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                />
              </div>

              <button
                onClick={() => setCurrentView('create')}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Pesquisa / Entrevista</span>
              </button>
            </div>

            {/* Researches Grid / Table */}
            {loadingResearches ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-xs text-neutral-400">
                Carregando pesquisas do workspace no PostgreSQL...
              </div>
            ) : filteredResearches.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Nenhuma pesquisa neste workspace</h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                    Cadastre uma entrevista, anotação ou transcrição para extrair evidências e problemas com a IA do Gemini.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView('create')}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg border border-neutral-700 inline-flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Primeira Pesquisa</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredResearches.map((r) => (
                  <div
                    key={r.id}
                    className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl p-5 space-y-3.5 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                          {r.source_type}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {new Date(r.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-white leading-snug">{r.title}</h3>

                      {r.participant_info?.name && (
                        <p className="text-xs text-neutral-400 mt-1">
                          👤 {r.participant_info.name}
                          {r.participant_info?.role ? ` (${r.participant_info.role})` : ''}
                        </p>
                      )}

                      <p className="text-xs text-neutral-400 line-clamp-2 mt-2 font-mono bg-neutral-950/50 p-2.5 rounded border border-neutral-800/60">
                        {r.raw_content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                      <button
                        onClick={() => {
                          setSelectedResearchId(r.id);
                          setCurrentView('detail');
                        }}
                        className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <span>Ver detalhes</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedResearchId(r.id);
                          setCurrentView('analyze_review');
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-medium rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>✨ Analisar com IA</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* View 2: Create Research */}
        {currentView === 'create' && (
          <ResearchForm
            workspaceId={activeWorkspaceId}
            onCancel={() => setCurrentView('list')}
            onCreated={handleCreatedResearch}
          />
        )}

        {/* View 3: AI Analysis Review (Human-in-the-Loop) */}
        {currentView === 'analyze_review' && selectedResearchId && (
          <ResearchAnalysisReview
            research={
              activeResearch || {
                id: selectedResearchId,
                title: 'Pesquisa Selecionada',
                workspace_id: activeWorkspaceId,
                source_type: 'interview',
                raw_content: '',
                participant_info: {},
                status: 'processed',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            }
            workspaceId={activeWorkspaceId}
            onBack={() => setCurrentView('detail')}
            onSavedSuccess={() => {
              fetchResearches();
              setCurrentView('detail');
            }}
          />
        )}

        {/* View 4: Research Details with Saved Evidences */}
        {currentView === 'detail' && selectedResearchId && (
          <ResearchDetailView
            researchId={selectedResearchId}
            workspaceId={activeWorkspaceId}
            onBack={() => setCurrentView('list')}
            onStartAIAnalysis={() => setCurrentView('analyze_review')}
          />
        )}

        {/* View 5: Security & Verification Suite */}
        {currentView === 'security_tests' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white">
                    Suíte de Testes de Segurança & Isolamento Multi-Tenant
                  </h2>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Validação automatizada de regras RLS, integridade de tenants, proteção contra IDOR e sanitização de prompts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={runSecurityTests}
                  disabled={runningSecurityTests}
                  className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg border border-neutral-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${runningSecurityTests ? 'animate-spin' : ''}`} />
                  <span>{runningSecurityTests ? 'Executando...' : 'Reexecutar Suíte'}</span>
                </button>

                <button
                  onClick={() => setCurrentView('list')}
                  className="px-3 py-2 text-xs text-neutral-400 hover:text-white rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Test Results Table */}
            {runningSecurityTests && !securityReports ? (
              <div className="p-12 text-center text-neutral-400 text-xs">
                Executando testes de isolamento no PostgreSQL e Gemini...
              </div>
            ) : securityReports ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-400 pb-1">
                  <span>
                    Status Geral:{' '}
                    <strong className="text-emerald-400">
                      {securityReports.filter((r) => r.passed).length} de {securityReports.length} Testes Aprovados
                    </strong>
                  </span>
                  <span className="font-mono text-[11px]">Banco: Cloud SQL (PostgreSQL)</span>
                </div>

                <div className="space-y-2">
                  {securityReports.map((t, idx) => (
                    <div
                      key={idx}
                      className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-medium text-white">
                          {t.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                          )}
                          <span>{t.name}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 pl-6">
                          <span className="text-neutral-500">Esperado:</span> {t.expected}
                        </p>
                      </div>

                      <div className="pl-6 sm:pl-0 text-right sm:text-right">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            t.passed
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-red-950 text-red-300 border border-red-800'
                          }`}
                        >
                          {t.actual}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
