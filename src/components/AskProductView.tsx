import React, { useState } from 'react';
import { Bot, Send, Sparkles, Loader2 } from 'lucide-react';
import { PageHeader } from './ui/PageHeader';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface AskProductViewProps {
  workspaceId: string;
  workspaceName: string;
}

export function AskProductView({ workspaceId, workspaceName }: AskProductViewProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `Olá! Sou o assistente de Product Management do workspace ${workspaceName}. Posso ajudar a analisar seus problemas, sugerir hipóteses de produto ou estruturar seu backlog com base em evidências.`,
    },
  ]);

  const samplePrompts = [
    'Quais são os principais problemas de alto impacto neste workspace?',
    'Ajude a formular uma hipótese de solução para as oportunidades ativas.',
    'Como posso relacionar evidências de pesquisa com as oportunidades mapeadas?',
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userText = prompt.trim();
    setPrompt('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ask-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({ prompt: userText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Erro ao consultar o assistente de produto.');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer || 'Sem resposta do assistente.',
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ Erro: ${err.message || 'Não foi possível se conectar ao serviço de IA.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Ask Product — Assistente do Workspace"
        description="Consulte insights, sínteses e orientações sobre suas pesquisas, problemas e oportunidades."
        badge={
          <Badge variant="cyan" icon={<Bot className="w-3.5 h-3.5" />}>
            AI PM Co-pilot
          </Badge>
        }
      />

      {/* Suggested prompts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {samplePrompts.map((sPrompt, idx) => (
          <button
            key={idx}
            disabled={loading}
            onClick={() => setPrompt(sPrompt)}
            className="p-3 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl text-left text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-start gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{sPrompt}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <Card className="min-h-[380px] flex flex-col justify-between space-y-4 border-neutral-800 bg-neutral-900/80">
        <div className="space-y-3 overflow-y-auto max-h-[420px] pr-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl text-xs leading-relaxed max-w-2xl ${
                msg.role === 'user'
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-100 ml-auto'
                  : 'bg-neutral-950 border border-neutral-800 text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1 text-[11px] opacity-80">
                {msg.role === 'user' ? (
                  <span>Você (PM)</span>
                ) : (
                  <span className="text-cyan-400 flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5" /> Ask Product AI
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          ))}

          {loading && (
            <div className="p-3.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 text-neutral-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Analisando os dados do workspace e formulando resposta...</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSend} className="flex items-center gap-2 pt-3 border-t border-neutral-800">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            placeholder={`Pergunte algo sobre os dados do workspace ${workspaceName}...`}
            className="flex-1 px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
          />
          <Button type="submit" disabled={loading} icon={loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}>
            Enviar
          </Button>
        </form>
      </Card>
    </div>
  );
}
