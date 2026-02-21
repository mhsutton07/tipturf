'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface TopBarProps {
  title: string;
  right?: ReactNode;
  className?: string;
}

export function TopBar({ title, right, className }: TopBarProps) {
  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-30 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800',
        'h-14 flex items-center px-4',
        className
      )}
    >
      <h1 className="flex-1 text-base font-semibold text-white">{title}</h1>
      {right && <div>{right}</div>}
    </header>
  );
}
