import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Carregando dados...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3 text-center">
      <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      <p className="text-xs text-neutral-400 font-medium">{message}</p>
    </div>
  );
}
