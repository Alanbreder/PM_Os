import React, { useState, useEffect } from 'react';
import { Quote, Search, Filter, Trash2, ArrowUpRight, AlertCircle } from 'lucide-react';
import { Evidence, ConfidenceLevel } from '../types';
import { PageHeader } from './ui/PageHeader';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { LoadingState } from './ui/LoadingState';
import { ErrorState } from './ui/ErrorState';
import { ConfirmDialog } from './ui/ConfirmDialog';

interface EvidencesListViewProps {
  workspaceId: string;
  onNavigateToResearch: (researchId: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error') => void;
}

export function EvidencesListView({
  workspaceId,
  onNavigateToResearch,
  onShowToast,
}: EvidencesListViewProps) {
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');

  // Delete confirmation modal state
  const [evidenceToDelete, setEvidenceToDelete] = useState<Evidence | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchEvidences();
  }, [workspaceId]);

  const fetchEvidences = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/evidences', {
        headers: { 'x-workspace-id': workspaceId },
      });
      if (!res.ok) throw new Error('Falha ao carregar evidências');
      const data = await res.json();
      setEvidences(data.evidences || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar evidências do workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvidence = async () => {
    if (!evidenceToDelete) return;
    setDeleting(true);
    try {
      // Deleting evidence via API
      const res = await fetch(`/api/evidences/${evidenceToDelete.id}`, {
        method: 'DELETE',
        headers: { 'x-workspace-id': workspaceId },
      });
      if (!res.ok) {
        throw new Error('Falha ao excluir a evidência.');
      }
      setEvidences((prev) => prev.filter((e) => e.id !== evidenceToDelete.id));
      onShowToast('Evidência excluída', 'A citação foi removida com sucesso.', 'success');
      setEvidenceToDelete(null);
    } catch (err: any) {
      onShowToast('Erro ao excluir', err.message || 'Não foi possível remover a evidência.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredEvidences = evidences.filter((e) => {
    const matchesSearch =
      e.quote.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.context && e.context.toLowerCase().includes(searchTerm.toLowerCase())) ||
      e.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesConfidence =
      confidenceFilter === 'all' || e.confidence_level === confidenceFilter;

    return matchesSearch && matchesConfidence;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repositório de Evidências"
        description="Fatos, citações diretas e observações extraídas das pesquisas de usuários do workspace."
        badge={
          <Badge variant="cyan" icon={<Quote className="w-3.5 h-3.5" />}>
            Evidence Hub
          </Badge>
        }
      />

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por citação, contexto ou tags..."
            className="w-full pl-8 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-xs text-neutral-400">Confiança:</span>
          <select
            value={confidenceFilter}
            onChange={(e) => setConfidenceFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer"
          >
            <option value="all">Todas ({evidences.length})</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Carregando evidências..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchEvidences} />
      ) : filteredEvidences.length === 0 ? (
        <EmptyState
          icon={<Quote className="w-6 h-6" />}
          title="Nenhuma evidência encontrada"
          description={
            searchTerm || confidenceFilter !== 'all'
              ? 'Tente ajustar os termos de busca ou filtros aplicados.'
              : 'Comece analisando entrevistas e dados brutos de pesquisa para extrair fatos e citações dos usuários.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvidences.map((evidence) => (
            <Card
              key={evidence.id}
              className="space-y-3 border-neutral-800 hover:border-neutral-700 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={evidence.confidence_level}>
                    Confiança {evidence.confidence_level === 'high' ? 'Alta' : evidence.confidence_level === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                  <button
                    onClick={() => setEvidenceToDelete(evidence)}
                    className="text-neutral-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                    title="Excluir Evidência"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <blockquote className="text-xs text-neutral-100 font-medium italic leading-relaxed border-l-2 border-cyan-500/50 pl-3 py-0.5">
                  "{evidence.quote}"
                </blockquote>

                {evidence.context && (
                  <p className="text-[11px] text-neutral-400 leading-normal bg-neutral-950/60 p-2 rounded border border-neutral-800">
                    <strong className="text-neutral-300 font-semibold">Contexto:</strong> {evidence.context}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {evidence.tags &&
                    evidence.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-neutral-800 text-neutral-300 text-[10px] px-1.5 py-0.5 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                </div>

                <button
                  onClick={() => onNavigateToResearch(evidence.research_id)}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 cursor-pointer shrink-0 ml-auto"
                >
                  <span>Ver Pesquisa</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(evidenceToDelete)}
        title="Excluir Evidência do Workspace"
        description="Tem certeza de que deseja remover esta citação? O vínculo com o problema correspondente será desfeito."
        confirmText="Excluir Evidência"
        loading={deleting}
        onConfirm={handleDeleteEvidence}
        onClose={() => setEvidenceToDelete(null)}
      />
    </div>
  );
}
