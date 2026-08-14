import React from 'react';

import {
  FileText,
  Quote,
  AlertCircle,
  Lightbulb,
  Sparkles,
  GitBranch,
  Settings,
  ShieldCheck,
  ChevronDown,
  LayoutDashboard,
  Bot,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { Workspace } from '../../types';

export type NavItemKey =
  | 'dashboard'
  | 'researches'
  | 'evidences'
  | 'problems'
  | 'opportunities'
  | 'hypotheses'
  | 'traceability'
  | 'ask_product'
  | 'settings'
  | 'security_tests';

interface SidebarProps {
  currentNavKey: NavItemKey;
  onNavigate: (key: NavItemKey) => void;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onWorkspaceChange: (workspaceId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  userEmail?: string;
}

export function Sidebar({
  currentNavKey,
  onNavigate,
  workspaces,
  activeWorkspaceId,
  onWorkspaceChange,
  collapsed = false,
  userEmail = 'pm@product.os',
}: SidebarProps) {
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const navGroups = [
    {
      title: 'INÍCIO',
      items: [
        { key: 'dashboard' as NavItemKey, label: 'Visão Geral', icon: LayoutDashboard },
      ],
    },
    {
      title: 'DISCOVERY',
      items: [
        { key: 'researches' as NavItemKey, label: 'Pesquisas', icon: FileText },
        { key: 'evidences' as NavItemKey, label: 'Evidências', icon: Quote },
      ],
    },
    {
      title: 'PRODUCT',
      items: [
        { key: 'problems' as NavItemKey, label: 'Problemas', icon: AlertCircle },
        { key: 'opportunities' as NavItemKey, label: 'Oportunidades', icon: Lightbulb },
        { key: 'hypotheses' as NavItemKey, label: 'Hipóteses', icon: Sparkles },
      ],
    },
    {
      title: 'INSIGHTS',
      items: [
        { key: 'traceability' as NavItemKey, label: 'Rastreabilidade', icon: GitBranch },
      ],
    },
    {
      title: 'AI',
      items: [
        { key: 'ask_product' as NavItemKey, label: 'Ask Product', icon: Bot },
      ],
    },
    {
      title: 'SISTEMA',
      items: [
        { key: 'settings' as NavItemKey, label: 'Configurações', icon: Settings },
        { key: 'security_tests' as NavItemKey, label: 'Testes de Segurança', icon: ShieldCheck },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-neutral-950 shadow-md shadow-amber-900/20 shrink-0">
          <Layers className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold text-white tracking-tight leading-none truncate">
            Product OS
          </h1>
          <span className="text-[10px] text-neutral-400 font-mono block mt-1">Continuous Discovery</span>
        </div>
      </div>

      {/* Workspace Switcher */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-950/40">
        <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 px-1">
          Workspace Ativo
        </label>
        <div className="relative">
          <select
            value={activeWorkspaceId}
            onChange={(e) => onWorkspaceChange(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-xs text-white font-medium rounded-lg px-2.5 py-2 pr-7 appearance-none focus:outline-none focus:border-amber-500/50 cursor-pointer transition-colors truncate"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Navigation Group Items */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs scrollbar-none">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h2 className="text-[10px] font-bold text-neutral-500 tracking-wider uppercase px-2 py-0.5">
              {group.title}
            </h2>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentNavKey === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => onNavigate(item.key)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400 font-bold text-[11px] shrink-0">
            {userEmail.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-white truncate">{userEmail}</p>
            <p className="text-[10px] text-neutral-500 truncate">PM • Product Lead</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
