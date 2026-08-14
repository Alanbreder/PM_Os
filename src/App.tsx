import React, { useState, useEffect } from 'react';
import { ShieldCheck, Database, CheckCircle2, AlertTriangle, Lock, Server, Terminal, ArrowRight, Layers, Users } from 'lucide-react';

interface HealthData {
  status: string;
  service: string;
  stage: string;
  database: {
    provider: string;
    configured: boolean;
    rlsEnabled: boolean;
    isolationMode: string;
  };
}

export default function App() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'isolation_test' | 'schema'>('overview');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => console.error('Erro ao conectar com API:', err));
  }, []);

  const runTenantIsolationTest = async (testCase: 'legit_ws1' | 'legit_ws2' | 'illegal_cross_tenant') => {
    setLoading(true);
    setTestResult(null);

    try {
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      let url = '/api/researches';
      let method = 'GET';
      let body: any = null;

      if (testCase === 'legit_ws1') {
        // User Alpha requesting Workspace 1 (Authorized)
        headers['x-test-user-id'] = 'user-pm-alpha';
        headers['x-workspace-id'] = '11111111-1111-1111-1111-111111111111';
      } else if (testCase === 'legit_ws2') {
        // User Beta requesting Workspace 2 (Authorized)
        headers['x-test-user-id'] = 'user-pm-beta';
        headers['x-workspace-id'] = '22222222-2222-2222-2222-222222222222';
      } else if (testCase === 'illegal_cross_tenant') {
        // User Beta attempting to access Workspace 1 (Cross-tenant attack / IDOR)
        headers['x-test-user-id'] = 'user-pm-beta';
        headers['x-workspace-id'] = '11111111-1111-1111-1111-111111111111'; // User Beta does NOT belong here!
      }

      const res = await fetch(url, { method, headers, body });
      const data = await res.json();

      setTestResult({
        status: res.status,
        ok: res.ok,
        testCase,
        response: data,
      });
    } catch (err: any) {
      setTestResult({
        status: 500,
        ok: false,
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="border-b border-neutral-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Etapa 1 Concluída
              </span>
              <span className="text-neutral-400 text-xs font-mono">Backend Foundation & Security</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-2">
              Product OS <span className="text-neutral-500 font-normal">| Core Backend & RLS</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-neutral-300 font-medium">Backend Operacional na porta 3000</span>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="flex space-x-2 border-b border-neutral-800 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'overview' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Visão Geral & Segurança
          </button>
          <button
            onClick={() => setActiveTab('isolation_test')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'isolation_test' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Teste de Isolamento Multi-Tenant
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'schema' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database className="w-4 h-4 text-blue-400" />
            Schema PostgreSQL (7 Tabelas)
          </button>
        </nav>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-semibold text-white">Zero-Trust no Frontend</h3>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Toda requisição valida o JWT no backend e consulta estritamente a tabela <code className="text-xs bg-neutral-800 px-1 py-0.5 rounded text-neutral-300">workspace_members</code> antes de permitir qualquer operação.
              </p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3 text-blue-400">
                <Lock className="w-5 h-5" />
                <h3 className="font-semibold text-white">Row Level Security (RLS)</h3>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed">
                100% das tabelas possuem RLS ativado no PostgreSQL. Mesmo com falha de lógica na API, o banco impede vazamento de dados entre workspaces.
              </p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3 text-purple-400">
                <Layers className="w-5 h-5" />
                <h3 className="font-semibold text-white">Modelagem Relacional Simples</h3>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed">
                7 tabelas com Foreign Keys explícitas, tabelas de junção N:N e índices B-tree/GIN para performance e integridade referencial.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Interactive Multi-Tenant Isolation Test */}
        {activeTab === 'isolation_test' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Validação de Isolamento entre Workspaces
              </h2>
              <p className="text-sm text-neutral-400 mt-1">
                Execute os testes abaixo para verificar como o backend e as políticas de autorização bloqueiam tentativas de acesso não autorizado (IDOR/BOLA).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => runTenantIsolationTest('legit_ws1')}
                disabled={loading}
                className="bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-left p-4 rounded-lg transition-all hover:border-emerald-500/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400">Teste 1: Acesso Válido</span>
                  <ArrowRight className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="text-sm font-medium text-white mt-1">PM Alpha ➔ Workspace 1</div>
                <div className="text-xs text-neutral-400 mt-2">Usuário pertence ao Workspace 1 (Acme E-Commerce). Deve retornar HTTP 200.</div>
              </button>

              <button
                onClick={() => runTenantIsolationTest('legit_ws2')}
                disabled={loading}
                className="bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-left p-4 rounded-lg transition-all hover:border-emerald-500/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400">Teste 2: Acesso Válido</span>
                  <ArrowRight className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="text-sm font-medium text-white mt-1">PM Beta ➔ Workspace 2</div>
                <div className="text-xs text-neutral-400 mt-2">Usuário pertence ao Workspace 2 (Fintech Pay). Deve retornar HTTP 200.</div>
              </button>

              <button
                onClick={() => runTenantIsolationTest('illegal_cross_tenant')}
                disabled={loading}
                className="bg-red-950/20 hover:bg-red-950/40 border border-red-800/40 text-left p-4 rounded-lg transition-all hover:border-red-500"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-400">Teste 3: Tentativa de Invasão (IDOR)</span>
                  <Lock className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-sm font-medium text-white mt-1">PM Beta ➔ Workspace 1 (Proibido)</div>
                <div className="text-xs text-neutral-400 mt-2">Usuário Beta NÃO pertence ao Workspace 1. Deve ser bloqueado com HTTP 403.</div>
              </button>
            </div>

            {/* Test Result Console */}
            {testResult && (
              <div className="mt-6 bg-neutral-950 border border-neutral-800 rounded-lg p-4 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-300">Resultado da Resposta HTTP:</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      testResult.status === 200
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : testResult.status === 403
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    HTTP {testResult.status} {testResult.status === 403 ? 'FORBIDDEN (Bloqueio Correto)' : testResult.status === 200 ? 'OK' : ''}
                  </span>
                </div>
                <pre className="text-neutral-300 overflow-x-auto p-2 bg-neutral-900/50 rounded">
                  {JSON.stringify(testResult.response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Schema Details */}
        {activeTab === 'schema' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              Estrutura de Tabelas Criadas na Migration 20260814000001
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-neutral-950 border border-neutral-800 p-3 rounded">
                <span className="text-emerald-400 font-bold">1. workspaces</span>
                <p className="text-neutral-400 font-sans mt-1">Tenants isolados (id, name, slug, timestamps).</p>
              </div>
              <div className="bg-neutral-950 border border-neutral-800 p-3 rounded">
                <span className="text-emerald-400 font-bold">2. workspace_members</span>
                <p className="text-neutral-400 font-sans mt-1">Relação usuário-workspace com role (owner, admin, member, viewer).</p>
              </div>
              <div className="bg-neutral-950 border border-neutral-800 p-3 rounded">
                <span className="text-blue-400 font-bold">3. researches</span>
                <p className="text-neutral-400 font-sans mt-1">Entrevistas, pesquisas e transcrições brutas.</p>
              </div>
              <div className="bg-neutral-950 border border-neutral-800 p-3 rounded">
                <span className="text-blue-400 font-bold">4. evidences</span>
                <p className="text-neutral-400 font-sans mt-1">Citações e fatos atômicos extraídos da pesquisa.</p>
              </div>
              <div className="bg-neutral-950 border border-neutral-800 p-3 rounded">
                <span className="text-purple-400 font-bold">5. problems</span>
                <p className="text-neutral-400 font-sans mt-1">Dores identificadas (com junção problem_evidences).</p>
              </div>
              <div className="bg-neutral-950 border border-neutral-800 p-3 rounded">
                <span className="text-amber-400 font-bold">6. opportunities</span>
                <p className="text-neutral-400 font-sans mt-1">Oportunidades de negócio (com junção opportunity_problems).</p>
              </div>
              <div className="bg-neutral-950 border border-neutral-800 p-3 rounded col-span-1 md:col-span-2">
                <span className="text-rose-400 font-bold">7. hypotheses</span>
                <p className="text-neutral-400 font-sans mt-1">Hipóteses com métricas de validação apontando diretamente para a oportunidade correspondente.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
