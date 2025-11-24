"use client";

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type ThumbSize = 'XL' | 'L' | 'M' | 'S' | 'XS' | 'XXS' | 'XXXS';

export function GridSizeSelector({ value, onChange }: { value: ThumbSize; onChange: (v: ThumbSize) => void }) {
  const labelFor: Record<ThumbSize, string> = {
    XL: 'Extra Large',
    L: 'Large',
    M: 'Medium',
    S: 'Small',
    XS: 'Very Small',
    XXS: 'Tiny',
    XXXS: 'Very Tiny',
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Size: {labelFor[value]}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Thumbnail size</DropdownMenuLabel>
        {(['XL', 'L', 'M', 'S', 'XS', 'XXS', 'XXXS'] as const).map((s) => (
          <DropdownMenuItem key={s} onClick={() => onChange(s)}>
            {labelFor[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default GridSizeSelector;


