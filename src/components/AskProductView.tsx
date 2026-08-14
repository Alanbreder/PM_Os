import React, { useState } from 'react';
import { Bot, Send, Sparkles, MessageSquare, Lightbulb, AlertCircle } from 'lucide-react';
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
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `Olá! Sou o assistente de Product Management do workspace ${workspaceName}. Posso ajudar a analisar seus problemas, sugerir hipóteses de produto ou estruturar seu backlog com base em evidências.`,
    },
  ]);

  const samplePrompts = [
    'Quais são os principais problemas de alto impacto neste workspace?',
    'Ajude a formular uma hipótese de solução para os problemas sem oportunidade.',
    'Como posso melhorar o alinhamento das evidências de pesquisa com as oportunidades?',
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userText = prompt.trim();
    setPrompt('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);

    // Simulated Product AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Analisando os dados do workspace "${workspaceName}" para responder: "${userText}". Recomendamos verificar o mapa de Rastreabilidade para confirmar quais evidências apoiam esta decisão antes de atuar.`,
        },
      ]);
    }, 600);
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
            onClick={() => setPrompt(sPrompt)}
            className="p-3 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl text-left text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-start gap-2"
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
              <p>{msg.text}</p>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSend} className="flex items-center gap-2 pt-3 border-t border-neutral-800">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Pergunte algo sobre os dados do workspace ${workspaceName}...`}
            className="flex-1 px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50"
          />
          <Button type="submit" icon={<Send className="w-3.5 h-3.5" />}>
            Enviar
          </Button>
        </form>
      </Card>
    </div>
  );
}
