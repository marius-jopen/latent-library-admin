"use client";

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const sortOptions = [
  'created_at.desc',
  'created_at.asc',
  'bytes.desc',
  'bytes.asc',
  'id.desc',
  'id.asc',
] as const;

export type SortValue = typeof sortOptions[number];

export function SortSelector({ value, onChange }: { value: SortValue; onChange: (v: SortValue) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Sort</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Sort</DropdownMenuLabel>
        {sortOptions.map((s) => (
          <DropdownMenuItem key={s} onClick={() => onChange(s)}>
            {s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default SortSelector;


