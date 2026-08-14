import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, badge, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-neutral-800">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {badge}
          <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
        </div>
        {description && <p className="text-xs text-neutral-400 leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
