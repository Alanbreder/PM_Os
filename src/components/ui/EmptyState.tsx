import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-neutral-900/60 border border-neutral-800 border-dashed rounded-xl p-10 text-center space-y-4 max-w-lg mx-auto my-8">
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700/60 flex items-center justify-center text-neutral-400 mx-auto shadow-inner">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">{description}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
