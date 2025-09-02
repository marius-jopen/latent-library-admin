"use client";

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SortOption = { label: string; value: string };

const sortOptions: SortOption[] = [
  { label: 'Newest first', value: 'created_at.desc' },
  { label: 'Oldest first', value: 'created_at.asc' },
  { label: 'Largest file', value: 'bytes.desc' },
  { label: 'Smallest file', value: 'bytes.asc' },
  { label: 'ID high → low', value: 'id.desc' },
  { label: 'ID low → high', value: 'id.asc' },
];

export type SortValue = SortOption['value'];

export function SortSelector({ value, onChange }: { value: SortValue; onChange: (v: SortValue) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Sort</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Sort</DropdownMenuLabel>
        {sortOptions.map((s) => (
          <DropdownMenuItem key={s.value} onClick={() => onChange(s.value)}>
            {s.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default SortSelector;


