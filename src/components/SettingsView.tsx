import React from 'react';
import { Settings, ShieldCheck, Users, Building, Database } from 'lucide-react';
import { Workspace } from '../types';
import { PageHeader } from './ui/PageHeader';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

interface SettingsViewProps {
  activeWorkspace?: Workspace;
  userEmail?: string;
}

export function SettingsView({ activeWorkspace, userEmail = 'pm@product.os' }: SettingsViewProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Configurações do Workspace"
        description="Parâmetros de operação, credenciais do ambiente e membros do workspace ativo."
        badge={
          <Badge variant="neutral" icon={<Settings className="w-3.5 h-3.5" />}>
            Workspace Settings
          </Badge>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workspace Identity */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Building className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white">Identidade do Workspace</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-mono block">Nome do Workspace</span>
              <p className="font-medium text-white">{activeWorkspace?.name || 'Workspace Padrão'}</p>
            </div>

            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-mono block">Slug Único</span>
              <p className="font-mono text-neutral-300">{activeWorkspace?.slug || 'workspace-default'}</p>
            </div>

            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-mono block">ID do Workspace (UUID)</span>
              <p className="font-mono text-xs text-neutral-400 select-all bg-neutral-950 p-2 rounded border border-neutral-800 break-all">
                {activeWorkspace?.id || 'w1111111-1111-1111-1111-111111111111'}
              </p>
            </div>
          </div>
        </Card>

        {/* Security & Access */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white">Segurança e Isolamento Multi-tenant</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-mono block">Usuário Autenticado</span>
              <p className="font-medium text-white">{userEmail}</p>
            </div>

            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-mono block">Mecanismo de Segurança</span>
              <p className="text-neutral-300 leading-relaxed">
                Firebase Authentication + Verification Token ID no Backend + PostgreSQL Drizzle Tenant Guard.
              </p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-emerald-300 text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Proteção IDOR/BOLA e isolamento estrito entre workspaces ativos no banco.</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
