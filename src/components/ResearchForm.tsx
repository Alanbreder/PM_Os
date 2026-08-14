import React, { useState } from 'react';
import { FileText, Sparkles, ArrowLeft, Loader2, User, Tag } from 'lucide-react';
import { ResearchSourceType } from '../types';

interface ResearchFormProps {
  workspaceId: string;
  onCancel: () => void;
  onCreated: (researchId: string, autoAnalyze: boolean) => void;
}

const SAMPLE_TRANSCRIPTS = [
  {
    label: 'Entrevista: Onboarding & Configuração de API (B2B SaaS)',
    title: 'Entrevista com Head de Engenharia - Dores de Integração',
    source_type: 'interview' as ResearchSourceType,
    participant: { name: 'Mariana Silva', role: 'Head of Engineering', company: 'TechLog' },
    content: `[Entrevistador]: Olá Mariana, obrigado pelo seu tempo. Como tem sido a experiência do seu time ao integrar nossa plataforma?

[Mariana]: Olha, a documentação é bonita, mas no dia a dia o processo foi bastante doloroso. Levamos quase 3 semanas para conseguir a primeira chamada de API autenticada funcionando em produção. O formato das mensagens de erro 401 e 403 não diz exatamente qual escopo do token estava faltando.

[Entrevistador]: Entendo. E como vocês resolveram isso?

[Mariana]: Tivemos que abrir 4 tickets no suporte e esperar quase 2 dias por cada resposta. Meus engenheiros ficaram parados esperando retorno. Se houvesse um sandbox interativo com validação de payload em tempo real, teríamos economizado pelo menos 10 dias de trabalho.

[Entrevistador]: Houve algum outro ponto de atrito?

[Mariana]: A parte de webhook também nos pegou de surpresa. Não há mecanismo de retry automático quando nosso servidor oscila, então perdemos notificações de pagamento cruciais duas vezes na última semana. Isso gerou reclamação direta de clientes finais para o nosso CEO.`,
  },
  {
    label: 'Feedback de Usuário: Lentidão e Perda de Filtros',
    title: 'Feedback de Clientes - Dashboard de Vendas',
    source_type: 'feedback' as ResearchSourceType,
    participant: { name: 'Carlos Ramos', role: 'Gerente Comercial', company: 'MegaVarejo' },
    content: `Cliente: Carlos Ramos (Gerente Comercial)
Canal: Reunião trimestral de QBR

"A ferramenta entrega os relatórios que precisamos, mas o tempo de carregamento da tabela principal passa de 15 segundos quando filtramos períodos acima de 90 dias. É impossível usar isso ao vivo em reuniões de diretoria.
Outro ponto crítico é que toda vez que troco de aba ou recarrego a página, todos os 5 filtros que passei 3 minutos configurando são zerados. Eu preciso refazer a seleção do zero várias vezes ao dia. Isso consome um tempo absurdo da minha equipe."`,
  },
];

export const ResearchForm: React.FC<ResearchFormProps> = ({
  workspaceId,
  onCancel,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState<ResearchSourceType>('interview');
  const [participantName, setParticipantName] = useState('');
  const [participantRole, setParticipantRole] = useState('');
  const [participantCompany, setParticipantCompany] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApplySample = (sample: typeof SAMPLE_TRANSCRIPTS[0]) => {
    setTitle(sample.title);
    setSourceType(sample.source_type);
    setParticipantName(sample.participant.name);
    setParticipantRole(sample.participant.role);
    setParticipantCompany(sample.participant.company);
    setRawContent(sample.content);
  };

  const handleSubmit = async (autoAnalyze: boolean) => {
    if (!title.trim()) {
      setError('O título da pesquisa é obrigatório.');
      return;
    }
    if (!rawContent.trim() || rawContent.trim().length < 10) {
      setError('Cole ou digite o conteúdo bruto da pesquisa (mínimo 10 caracteres).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/researches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({
          title: title.trim(),
          source_type: sourceType,
          participant_info: {
            name: participantName.trim() || undefined,
            role: participantRole.trim() || undefined,
            company: participantCompany.trim() || undefined,
          },
          raw_content: rawContent.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar pesquisa');
      }

      onCreated(data.research.id, autoAnalyze);
    } catch (err: any) {
      console.error('Erro ao salvar pesquisa:', err);
      setError(err.message || 'Erro de comunicação com o servidor.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-white">Nova Pesquisa / Entrevista</h2>
            <p className="text-xs text-neutral-400">Cadastre a transcrição ou anotações brutas para análise</p>
          </div>
        </div>

        {/* Quick sample loader for PM convenience */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs text-neutral-500">Exemplos rápidos:</span>
          {SAMPLE_TRANSCRIPTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplySample(sample)}
              className="text-xs px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700 transition-colors"
            >
              {idx === 0 ? 'Entrevista SaaS' : 'Feedback de QBR'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Title */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-medium text-neutral-300">
            Título da Pesquisa <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Entrevista com Lead de Produto - Descoberta de Onboarding"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
          />
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-300">Tipo de Fonte</label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as ResearchSourceType)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-neutral-500"
          >
            <option value="interview">Entrevista Qualitativa</option>
            <option value="survey">Pesquisa / Survey</option>
            <option value="feedback">Feedback Direto / Ticket</option>
            <option value="usability_test">Teste de Usabilidade</option>
            <option value="document">Documento / Anotação</option>
          </select>
        </div>
      </div>

      {/* Participant info (optional) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-950/60 p-3.5 rounded-lg border border-neutral-800/60">
        <div className="space-y-1">
          <label className="text-xs text-neutral-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-neutral-500" />
            Nome do Participante (opcional)
          </label>
          <input
            type="text"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            placeholder="Ex: Mariana Silva"
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-neutral-400">Cargo / Função</label>
          <input
            type="text"
            value={participantRole}
            onChange={(e) => setParticipantRole(e.target.value)}
            placeholder="Ex: Head of Engineering"
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-neutral-400">Empresa / Segmento</label>
          <input
            type="text"
            value={participantCompany}
            onChange={(e) => setParticipantCompany(e.target.value)}
            placeholder="Ex: TechLog B2B"
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
          />
        </div>
      </div>

      {/* Raw Content Textarea */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-neutral-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-neutral-400" />
            Conteúdo Bruto / Transcrição da Entrevista <span className="text-red-400">*</span>
          </label>
          <span className="text-xs text-neutral-500">{rawContent.length} caracteres</span>
        </div>
        <textarea
          rows={12}
          value={rawContent}
          onChange={(e) => setRawContent(e.target.value)}
          placeholder="Cole aqui a transcrição completa da entrevista com o usuário, anotações de call, feedbacks de suporte ou respostas da pesquisa..."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3.5 text-sm text-neutral-200 placeholder-neutral-600 font-mono text-xs leading-relaxed focus:outline-none focus:border-neutral-500 resize-y"
        />
        <p className="text-[11px] text-neutral-500">
          Dica: Textos longos são suportados com segurança. A IA extrairá fatos e citações fiéis sem alterar suas palavras.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-neutral-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-4 py-2 text-sm text-neutral-400 hover:text-white rounded-lg transition-colors"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-lg transition-colors border border-neutral-700"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Apenas'}
        </button>

        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processando...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Salvar & ✨ Analisar com IA</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
