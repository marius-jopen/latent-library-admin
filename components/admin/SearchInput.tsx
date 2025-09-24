"use client";

import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

export function SearchInput({ value, onChange, placeholder, totalCount }: { value: string; onChange: (v: string) => void; placeholder?: string; totalCount?: number | null }) {
  return (
    <div className="relative">
      <Input
        placeholder={placeholder || 'Search captions, tags, filename, or UID'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={(totalCount != null || value) ? 'pr-24' : 'pr-8'}
      />
      {totalCount != null && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">
          {totalCount}
        </span>
      )}
      {value && (
        <button
          onClick={() => onChange('')}
          className={`absolute top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-sm transition-colors ${totalCount != null ? 'right-12' : 'right-2'}`}
          type="button"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

export default SearchInput;


