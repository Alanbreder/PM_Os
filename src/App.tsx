import React, { useState, useEffect } from 'react';
import { NavItemKey } from './components/layout/Sidebar';
import { AppShell } from './components/layout/AppShell';
import { DashboardOverview } from './components/DashboardOverview';
import { EvidencesListView } from './components/EvidencesListView';
import { HypothesesListView } from './components/HypothesesListView';
import { TraceabilityView } from './components/TraceabilityView';
import { AskProductView } from './components/AskProductView';
import { SettingsView } from './components/SettingsView';
import { SecurityTestsView } from './components/SecurityTestsView';

// Original Discovery & Problem/Opportunity Views
import { ResearchForm } from './components/ResearchForm';
import { ResearchAnalysisReview } from './components/ResearchAnalysisReview';
import { ResearchDetailView } from './components/ResearchDetailView';
import { ProblemBacklogView } from './components/ProblemBacklogView';
import { ProblemDetailView } from './components/ProblemDetailView';
import { ProblemFormView } from './components/ProblemFormView';
import { OpportunityBacklogView } from './components/OpportunityBacklogView';
import { OpportunityDetailView } from './components/OpportunityDetailView';
import { OpportunityFormView } from './components/OpportunityFormView';

import {
  Research,
  Workspace,
  Problem,
  Opportunity,
  Evidence,
  Hypothesis,
  ToastMessage,
  BreadcrumbItem,
} from './types';
import { Search, Plus, FileText, ChevronRight, Sparkles } from 'lucide-react';

export default function App() {
  // Workspaces state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('11111111-1111-1111-1111-111111111111');

  // Primary Data Collections
  const [researches, setResearches] = useState<Research[]>([]);
  const [loadingResearches, setLoadingResearches] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [problems, setProblems] = useState<Problem[]>([]);
  const [loadingProblems, setLoadingProblems] = useState(true);

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(true);

  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);

  // Navigation State
  const [currentNavKey, setCurrentNavKey] = useState<NavItemKey>('dashboard');
  const [subView, setSubView] = useState<'list' | 'create' | 'detail' | 'analyze_review'>('list');

  // Selected Entity Details State
  const [selectedResearchId, setSelectedResearchId] = useState<string | null>(null);
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);

  // Edit / Form Initial States
  const [problemToEdit, setProblemToEdit] = useState<Problem | null>(null);
  const [initialEvidenceIdForProblem, setInitialEvidenceIdForProblem] = useState<string | null>(null);

  const [opportunityToEdit, setOpportunityToEdit] = useState<Opportunity | null>(null);
  const [initialProblemIdForOpportunity, setInitialProblemIdForOpportunity] = useState<string | null>(null);

  // Global Toasts State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, message?: string, type: 'success' | 'error' | 'info' = 'info') => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial Load
  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (!activeWorkspaceId) return;

    const controller = new AbortController();
    const signal = controller.signal;

    // 1. Instantly clear stale workspace data and selections
    setResearches([]);
    setProblems([]);
    setOpportunities([]);
    setEvidences([]);
    setHypotheses([]);
    setSelectedResearchId(null);
    setSelectedProblemId(null);
    setSelectedOpportunityId(null);
    setProblemToEdit(null);
    setOpportunityToEdit(null);

    setLoadingResearches(true);
    setLoadingProblems(true);
    setLoadingOpportunities(true);

    const headers = { 'x-workspace-id': activeWorkspaceId };

    const loadWorkspaceData = async () => {
      try {
        const [resR, resP, resO, resE, resH] = await Promise.allSettled([
          fetch('/api/researches', { headers, signal }),
          fetch('/api/problems', { headers, signal }),
          fetch('/api/opportunities', { headers, signal }),
          fetch('/api/evidences', { headers, signal }),
          fetch('/api/hypotheses', { headers, signal }),
        ]);

        if (signal.aborted) return;

        if (resR.status === 'fulfilled' && resR.value.ok) {
          const data = await resR.value.json();
          setResearches(data.researches || []);
        }
        if (resP.status === 'fulfilled' && resP.value.ok) {
          const data = await resP.value.json();
          setProblems(data.problems || []);
        }
        if (resO.status === 'fulfilled' && resO.value.ok) {
          const data = await resO.value.json();
          setOpportunities(data.opportunities || []);
        }
        if (resE.status === 'fulfilled' && resE.value.ok) {
          const data = await resE.value.json();
          setEvidences(data.evidences || []);
        }
        if (resH.status === 'fulfilled' && resH.value.ok) {
          const data = await resH.value.json();
          setHypotheses(data.hypotheses || []);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Erro ao carregar dados do workspace:', err);
        }
      } finally {
        if (!signal.aborted) {
          setLoadingResearches(false);
          setLoadingProblems(false);
          setLoadingOpportunities(false);
        }
      }
    };

    loadWorkspaceData();

    return () => {
      controller.abort();
    };
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
        headers: { 'x-workspace-id': activeWorkspaceId },
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

  const fetchProblems = async () => {
    setLoadingProblems(true);
    try {
      const res = await fetch('/api/problems', {
        headers: { 'x-workspace-id': activeWorkspaceId },
      });
      if (res.ok) {
        const data = await res.json();
        setProblems(data.problems || []);
      }
    } catch (err) {
      console.error('Erro ao listar problemas:', err);
    } finally {
      setLoadingProblems(false);
    }
  };

  const fetchOpportunities = async () => {
    setLoadingOpportunities(true);
    try {
      const res = await fetch('/api/opportunities', {
        headers: { 'x-workspace-id': activeWorkspaceId },
      });
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (err) {
      console.error('Erro ao listar oportunidades:', err);
    } finally {
      setLoadingOpportunities(false);
    }
  };

  const fetchEvidences = async () => {
    try {
      const res = await fetch('/api/evidences', {
        headers: { 'x-workspace-id': activeWorkspaceId },
      });
      if (res.ok) {
        const data = await res.json();
        setEvidences(data.evidences || []);
      }
    } catch (err) {
      console.error('Erro ao listar evidências:', err);
    }
  };

  const fetchHypotheses = async () => {
    try {
      const res = await fetch('/api/hypotheses', {
        headers: { 'x-workspace-id': activeWorkspaceId },
      });
      if (res.ok) {
        const data = await res.json();
        setHypotheses(data.hypotheses || []);
      }
    } catch (err) {
      console.error('Erro ao listar hipóteses:', err);
    }
  };

  // Navigation handlers
  const handleNavigate = (key: NavItemKey) => {
    setCurrentNavKey(key);
    setSubView('list');
  };

  // Research Event Handlers
  const handleCreatedResearch = (newResearchId: string, autoAnalyze: boolean) => {
    fetchResearches();
    setSelectedResearchId(newResearchId);
    showToast('Pesquisa cadastrada', 'A pesquisa foi armazenada com sucesso.', 'success');
    if (autoAnalyze) {
      setSubView('analyze_review');
    } else {
      setSubView('detail');
    }
  };

  // Problem Event Handlers
  const handleStartCreateProblem = () => {
    setProblemToEdit(null);
    setInitialEvidenceIdForProblem(null);
    setCurrentNavKey('problems');
    setSubView('create');
  };

  const handleStartEditProblem = (problem: Problem) => {
    setProblemToEdit(problem);
    setInitialEvidenceIdForProblem(null);
    setCurrentNavKey('problems');
    setSubView('create');
  };

  const handleProblemSaved = (savedProblem: Problem) => {
    fetchProblems();
    setSelectedProblemId(savedProblem.id);
    setSubView('detail');
    showToast('Problema salvo', 'As alterações do problema foram registradas.', 'success');
  };

  const handleProblemDeleted = () => {
    fetchProblems();
    setSelectedProblemId(null);
    setSubView('list');
    showToast('Problema removido', 'O problema foi excluído do workspace.', 'info');
  };

  // Opportunity Event Handlers
  const handleStartCreateOpportunity = (initialProblemId?: string) => {
    setOpportunityToEdit(null);
    setInitialProblemIdForOpportunity(initialProblemId || null);
    setCurrentNavKey('opportunities');
    setSubView('create');
  };

  const handleStartEditOpportunity = (opportunity: Opportunity) => {
    setOpportunityToEdit(opportunity);
    setInitialProblemIdForOpportunity(null);
    setCurrentNavKey('opportunities');
    setSubView('create');
  };

  const handleOpportunitySaved = (savedOpportunity: Opportunity) => {
    fetchOpportunities();
    setSelectedOpportunityId(savedOpportunity.id);
    setSubView('detail');
    showToast('Oportunidade salva', 'A oportunidade foi registrada com sucesso.', 'success');
  };

  const handleOpportunityDeleted = () => {
    fetchOpportunities();
    setSelectedOpportunityId(null);
    setSubView('list');
    showToast('Oportunidade removida', 'A oportunidade foi excluída do backlog.', 'info');
  };

  // Active Workspace Object
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  // Dynamic Breadcrumb Items based on current location
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];

    switch (currentNavKey) {
      case 'dashboard':
        items.push({ label: 'Visão Geral' });
        break;
      case 'researches':
        items.push({ label: 'Pesquisas & Entrevistas', onClick: () => setSubView('list') });
        if (subView === 'create') items.push({ label: 'Nova Pesquisa' });
        if (subView === 'detail') items.push({ label: 'Detalhes da Pesquisa' });
        if (subView === 'analyze_review') items.push({ label: 'Análise por IA' });
        break;
      case 'evidences':
        items.push({ label: 'Repositório de Evidências' });
        break;
      case 'problems':
        items.push({ label: 'Problem Backlog', onClick: () => setSubView('list') });
        if (subView === 'create') items.push({ label: problemToEdit ? 'Editar Problema' : 'Novo Problema' });
        if (subView === 'detail') items.push({ label: 'Detalhes do Problema' });
        break;
      case 'opportunities':
        items.push({ label: 'Opportunity Backlog', onClick: () => setSubView('list') });
        if (subView === 'create') items.push({ label: opportunityToEdit ? 'Editar Oportunidade' : 'Nova Oportunidade' });
        if (subView === 'detail') items.push({ label: 'Detalhes da Oportunidade' });
        break;
      case 'hypotheses':
        items.push({ label: 'Hipóteses & Experimentos' });
        break;
      case 'traceability':
        items.push({ label: 'Matriz de Rastreabilidade' });
        break;
      case 'ask_product':
        items.push({ label: 'Ask Product AI' });
        break;
      case 'settings':
        items.push({ label: 'Configurações' });
        break;
      case 'security_tests':
        items.push({ label: 'Testes de Segurança' });
        break;
    }

    return items;
  };

  // Filtered Researches
  const filteredResearches = researches.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.raw_content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeResearch = researches.find((r) => r.id === selectedResearchId);

  return (
    <AppShell
      currentNavKey={currentNavKey}
      onNavigate={handleNavigate}
      workspaces={workspaces}
      activeWorkspaceId={activeWorkspaceId}
      onWorkspaceChange={(id) => {
        setActiveWorkspaceId(id);
        setCurrentNavKey('dashboard');
        setSubView('list');
      }}
      breadcrumbs={getBreadcrumbs()}
      toasts={toasts}
      onDismissToast={handleDismissToast}
    >
      {/* 1. Dashboard View */}
      {currentNavKey === 'dashboard' && (
        <DashboardOverview
          workspaceName={activeWorkspace?.name || 'Workspace Principal'}
          researches={researches}
          problems={problems}
          opportunities={opportunities}
          evidences={evidences}
          hypotheses={hypotheses}
          onNavigate={handleNavigate}
          onSelectResearch={(id) => {
            setSelectedResearchId(id);
            setCurrentNavKey('researches');
            setSubView('detail');
          }}
          onSelectProblem={(id) => {
            setSelectedProblemId(id);
            setCurrentNavKey('problems');
            setSubView('detail');
          }}
          onSelectOpportunity={(id) => {
            setSelectedOpportunityId(id);
            setCurrentNavKey('opportunities');
            setSubView('detail');
          }}
          onCreateResearch={() => {
            setCurrentNavKey('researches');
            setSubView('create');
          }}
        />
      )}

      {/* 2. Researches & Discovery Views */}
      {currentNavKey === 'researches' && (
        <>
          {subView === 'list' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar pesquisas, transcrições ou temas..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <button
                  onClick={() => setSubView('create')}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Pesquisa / Entrevista</span>
                </button>
              </div>

              {loadingResearches ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-xs text-neutral-400">
                  Carregando pesquisas do workspace...
                </div>
              ) : filteredResearches.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Nenhuma pesquisa cadastrada</h3>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                      Cadastre uma entrevista ou transcrição bruta para extrair evidências reais com IA.
                    </p>
                  </div>
                  <button
                    onClick={() => setSubView('create')}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg border border-neutral-700 inline-flex items-center gap-2 transition-colors cursor-pointer"
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
                            setSubView('detail');
                          }}
                          className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Ver detalhes</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedResearchId(r.id);
                            setSubView('analyze_review');
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-medium rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
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

          {subView === 'create' && (
            <ResearchForm
              workspaceId={activeWorkspaceId}
              onCancel={() => setSubView('list')}
              onCreated={handleCreatedResearch}
            />
          )}

          {subView === 'analyze_review' && selectedResearchId && (
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
              onBack={() => setSubView('detail')}
              onSavedSuccess={() => {
                fetchResearches();
                fetchProblems();
                fetchEvidences();
                setSubView('detail');
                showToast('Análise concluída', 'As evidências extraídas foram salvas com sucesso.', 'success');
              }}
            />
          )}

          {subView === 'detail' && selectedResearchId && (
            <ResearchDetailView
              researchId={selectedResearchId}
              workspaceId={activeWorkspaceId}
              onBack={() => setSubView('list')}
              onStartAIAnalysis={() => setSubView('analyze_review')}
              onCreateProblemFromEvidence={(evidenceId) => {
                setProblemToEdit(null);
                setInitialEvidenceIdForProblem(evidenceId);
                setCurrentNavKey('problems');
                setSubView('create');
              }}
              onSelectProblem={(problemId) => {
                setSelectedProblemId(problemId);
                setCurrentNavKey('problems');
                setSubView('detail');
              }}
            />
          )}
        </>
      )}

      {/* 3. Evidences List View */}
      {currentNavKey === 'evidences' && (
        <EvidencesListView
          workspaceId={activeWorkspaceId}
          onNavigateToResearch={(researchId) => {
            setSelectedResearchId(researchId);
            setCurrentNavKey('researches');
            setSubView('detail');
          }}
          onShowToast={showToast}
        />
      )}

      {/* 4. Problems Backlog Views */}
      {currentNavKey === 'problems' && (
        <>
          {subView === 'list' && (
            <ProblemBacklogView
              problems={problems}
              loading={loadingProblems}
              onSelectProblem={(id) => {
                setSelectedProblemId(id);
                setSubView('detail');
              }}
              onCreateProblem={handleStartCreateProblem}
              onSelectResearch={(researchId) => {
                setSelectedResearchId(researchId);
                setCurrentNavKey('researches');
                setSubView('detail');
              }}
            />
          )}

          {subView === 'detail' && selectedProblemId && (
            <ProblemDetailView
              problemId={selectedProblemId}
              workspaceId={activeWorkspaceId}
              onBack={() => {
                fetchProblems();
                setSubView('list');
              }}
              onEdit={handleStartEditProblem}
              onNavigateToResearch={(researchId) => {
                setSelectedResearchId(researchId);
                setCurrentNavKey('researches');
                setSubView('detail');
              }}
              onProblemDeleted={handleProblemDeleted}
              onCreateOpportunityFromProblem={(pId) => handleStartCreateOpportunity(pId)}
            />
          )}

          {subView === 'create' && (
            <ProblemFormView
              workspaceId={activeWorkspaceId}
              problemToEdit={problemToEdit}
              initialEvidenceId={initialEvidenceIdForProblem}
              onBack={() => {
                if (problemToEdit) {
                  setSubView('detail');
                } else {
                  setSubView('list');
                }
              }}
              onSaved={handleProblemSaved}
            />
          )}
        </>
      )}

      {/* 5. Opportunities Backlog Views */}
      {currentNavKey === 'opportunities' && (
        <>
          {subView === 'list' && (
            <OpportunityBacklogView
              opportunities={opportunities}
              loading={loadingOpportunities}
              onSelectOpportunity={(id) => {
                setSelectedOpportunityId(id);
                setSubView('detail');
              }}
              onCreateNew={() => handleStartCreateOpportunity()}
              onNavigateToProblem={(pId) => {
                setSelectedProblemId(pId);
                setCurrentNavKey('problems');
                setSubView('detail');
              }}
            />
          )}

          {subView === 'detail' && selectedOpportunityId && (
            <OpportunityDetailView
              opportunityId={selectedOpportunityId}
              workspaceId={activeWorkspaceId}
              onBack={() => {
                fetchOpportunities();
                setSubView('list');
              }}
              onEdit={handleStartEditOpportunity}
              onNavigateToProblem={(pId) => {
                setSelectedProblemId(pId);
                setCurrentNavKey('problems');
                setSubView('detail');
              }}
              onNavigateToResearch={(rId) => {
                setSelectedResearchId(rId);
                setCurrentNavKey('researches');
                setSubView('detail');
              }}
              onOpportunityDeleted={handleOpportunityDeleted}
            />
          )}

          {subView === 'create' && (
            <OpportunityFormView
              workspaceId={activeWorkspaceId}
              opportunityToEdit={opportunityToEdit}
              initialProblemId={initialProblemIdForOpportunity}
              onBack={() => {
                if (opportunityToEdit) {
                  setSubView('detail');
                } else {
                  setSubView('list');
                }
              }}
              onSaved={handleOpportunitySaved}
            />
          )}
        </>
      )}

      {/* 6. Hypotheses & Experiments View */}
      {currentNavKey === 'hypotheses' && (
        <HypothesesListView
          workspaceId={activeWorkspaceId}
          opportunities={opportunities}
          onNavigateToOpportunity={(oppId) => {
            setSelectedOpportunityId(oppId);
            setCurrentNavKey('opportunities');
            setSubView('detail');
          }}
          onShowToast={showToast}
        />
      )}

      {/* 7. Traceability Matrix View */}
      {currentNavKey === 'traceability' && (
        <TraceabilityView
          workspaceId={activeWorkspaceId}
          onNavigateToResearch={(rId) => {
            setSelectedResearchId(rId);
            setCurrentNavKey('researches');
            setSubView('detail');
          }}
          onNavigateToProblem={(pId) => {
            setSelectedProblemId(pId);
            setCurrentNavKey('problems');
            setSubView('detail');
          }}
          onNavigateToOpportunity={(oppId) => {
            setSelectedOpportunityId(oppId);
            setCurrentNavKey('opportunities');
            setSubView('detail');
          }}
        />
      )}

      {/* 8. Ask Product View */}
      {currentNavKey === 'ask_product' && (
        <AskProductView
          workspaceId={activeWorkspaceId}
          workspaceName={activeWorkspace?.name || 'Workspace Principal'}
        />
      )}

      {/* 9. Settings View */}
      {currentNavKey === 'settings' && (
        <SettingsView activeWorkspace={activeWorkspace} />
      )}

      {/* 10. Security Suite View */}
      {currentNavKey === 'security_tests' && <SecurityTestsView />}
    </AppShell>
  );
}
