import React from 'react';
import { Breadcrumb } from '../ui/Breadcrumb';
import { BreadcrumbItem, Workspace } from '../../types';
import { ShieldCheck, HelpCircle } from 'lucide-react';

interface TopbarProps {
  breadcrumbs: BreadcrumbItem[];
  onHomeClick: () => void;
  activeWorkspace?: Workspace;
}

export function Topbar({ breadcrumbs, onHomeClick, activeWorkspace }: TopbarProps) {
  return (
    <header className="h-14 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <Breadcrumb items={breadcrumbs} onHomeClick={onHomeClick} />
      </div>

      <div className="flex items-center gap-3 shrink-0 text-xs">
        {activeWorkspace && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-400 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Workspace:</span>
            <strong className="text-white font-medium">{activeWorkspace.name}</strong>
          </span>
        )}

        <div className="hidden md:flex items-center gap-1 text-[11px] text-neutral-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Isolamento Tenant Ativo</span>
        </div>
      </div>
    </header>
  );
}
