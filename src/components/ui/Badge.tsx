import React from 'react';

type BadgeVariant =
  | 'draft'
  | 'processing'
  | 'processed'
  | 'active'
  | 'archived'
  | 'identified'
  | 'exploring'
  | 'validated'
  | 'testing'
  | 'invalidated'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'neutral'
  | 'amber'
  | 'emerald'
  | 'rose'
  | 'cyan'
  | 'indigo';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  icon,
  className = '',
}: BadgeProps) {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 rounded font-medium',
    md: 'text-xs px-2.5 py-1 rounded-md font-semibold',
  };

  const variantStyles: Record<BadgeVariant, string> = {
    draft: 'bg-neutral-800 text-neutral-300 border border-neutral-700',
    processing: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    processed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    active: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    archived: 'bg-neutral-800/80 text-neutral-400 border border-neutral-700/60',
    identified: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    exploring: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    validated: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    testing: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    invalidated: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    critical: 'bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider',
    high: 'bg-orange-500/15 text-orange-400 border border-orange-500/30 uppercase tracking-wider',
    medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider',
    low: 'bg-neutral-800 text-neutral-300 border border-neutral-700 uppercase tracking-wider',
    neutral: 'bg-neutral-800 text-neutral-300 border border-neutral-700',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 shrink-0 ${sizeStyles[size]} ${
        variantStyles[variant] || variantStyles.neutral
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
}
