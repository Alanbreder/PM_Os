import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbItem } from '../../types';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onHomeClick?: () => void;
}

export function Breadcrumb({ items, onHomeClick }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-neutral-400 overflow-x-auto py-1 scrollbar-none">
      {onHomeClick && (
        <button
          onClick={onHomeClick}
          className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
          title="Início"
        >
          <Home className="w-3.5 h-3.5" />
        </button>
      )}

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            {(onHomeClick || idx > 0) && (
              <ChevronRight className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
            )}
            {item.onClick && !isLast ? (
              <button
                onClick={item.onClick}
                className="hover:text-white font-medium transition-colors cursor-pointer truncate max-w-[180px]"
              >
                {item.label}
              </button>
            ) : (
              <span
                className={`truncate max-w-[220px] ${
                  isLast ? 'text-white font-semibold' : 'text-neutral-400 font-medium'
                }`}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
