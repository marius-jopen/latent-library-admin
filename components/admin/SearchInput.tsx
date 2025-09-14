"use client";

import { Input } from '@/components/ui/input';

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <Input
      placeholder={placeholder || 'Search captions, tags, filename, or UID'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default SearchInput;


