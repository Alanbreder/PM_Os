import React, { useState } from 'react';
import { ShieldCheck, Play, CheckCircle2, XCircle, Terminal, AlertTriangle } from 'lucide-react';
import { PageHeader } from './ui/PageHeader';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

export function SecurityTestsView() {
  const [running, setRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const runSecuritySuite = async () => {
    setRunning(true);
    setTestResults([]);
    setLogs(['Iniciando suíte rigorosa de isolamento multi-tenant...']);

    try {
      const res = await fetch('/api/test/security-isolation', { method: 'POST' });
      if (!res.ok) throw new Error('Erro ao disparar execução dos testes.');
      const data = await res.json();

      setTestResults(data.results || []);
      setLogs((prev) => [
        ...prev,
        `Suíte finalizada com sucesso! Total: ${data.passed}/${data.total} testes aprovados.`,
      ]);
    } catch (err: any) {
      setLogs((prev) => [...prev, `FALHA AO EXECUTAR: ${err.message}`]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Suíte de Testes de Isolamento e Segurança Multi-tenant"
        description="Executa automaticamente testes de invasão e validação cross-tenant para garantir que dados entre workspaces estejam estritamente isolados."
        badge={
          <Badge variant="emerald" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
            Security Validation
          </Badge>
        }
        actions={
          <Button
            onClick={runSecuritySuite}
            loading={running}
            icon={<Play className="w-3.5 h-3.5 fill-current" />}
          >
            Executar Testes de Invasão
          </Button>
        }
      />

      {/* Terminal Output */}
      <Card className="bg-neutral-950 border-neutral-800 font-mono text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2 text-neutral-400">
          <span className="flex items-center gap-1.5 text-neutral-300">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Terminal de Execução de Testes</span>
          </span>
          <span className="text-[11px] text-neutral-500">npx tsx server/tests/security.test.ts</span>
        </div>

        <div className="space-y-1.5 min-h-[120px] max-h-[220px] overflow-y-auto text-neutral-300 pr-2">
          {logs.length === 0 ? (
            <p className="text-neutral-500 italic">Clique em "Executar Testes de Invasão" para iniciar a validação de segurança.</p>
          ) : (
            logs.map((log, idx) => (
              <p key={idx} className="leading-relaxed">
                <span className="text-emerald-400">$</span> {log}
              </p>
            ))
          )}
        </div>
      </Card>

      {/* Results List */}
      {testResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Resultados Detalhados ({testResults.filter((r) => r.passed).length}/{testResults.length} Aprovados)
          </h3>

          <div className="space-y-2">
            {testResults.map((test, idx) => (
              <Card
                key={idx}
                className={`p-3.5 flex items-start justify-between gap-3 ${
                  test.passed
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-rose-500/30 bg-rose-950/10'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {test.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-white">{test.name}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 pl-6">
                    <strong className="text-neutral-300">Esperado:</strong> {test.expected} |{' '}
                    <strong className="text-neutral-300">Obtido:</strong> {test.actual}
                  </p>
                </div>

                <Badge variant={test.passed ? 'emerald' : 'rose'}>
                  {test.passed ? 'Aprovado' : 'Falha'}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
