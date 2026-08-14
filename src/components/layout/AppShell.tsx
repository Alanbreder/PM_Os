import React from 'react';
import { Sidebar, NavItemKey } from './Sidebar';
import { Topbar } from './Topbar';
import { ToastContainer } from '../ui/Toast';
import { BreadcrumbItem, ToastMessage, Workspace } from '../../types';

interface AppShellProps {
  currentNavKey: NavItemKey;
  onNavigate: (key: NavItemKey) => void;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onWorkspaceChange: (workspaceId: string) => void;
  breadcrumbs: BreadcrumbItem[];
  toasts: ToastMessage[];
  onDismissToast: (id: string) => void;
  children: React.ReactNode;
}

export function AppShell({
  currentNavKey,
  onNavigate,
  workspaces,
  activeWorkspaceId,
  onWorkspaceChange,
  breadcrumbs,
  toasts,
  onDismissToast,
  children,
}: AppShellProps) {
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex font-sans antialiased">
      {/* Sidebar navigation */}
      <Sidebar
        currentNavKey={currentNavKey}
        onNavigate={onNavigate}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onWorkspaceChange={onWorkspaceChange}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Topbar
          breadcrumbs={breadcrumbs}
          onHomeClick={() => onNavigate('dashboard')}
          activeWorkspace={activeWorkspace}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Toast notifications container */}
      <ToastContainer toasts={toasts} onDismiss={onDismissToast} />
    </div>
  );
}
