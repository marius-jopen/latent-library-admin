"use client";

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type ThumbSize = 'XL' | 'L' | 'M' | 'S' | 'XS';

export function GridSizeSelector({ value, onChange }: { value: ThumbSize; onChange: (v: ThumbSize) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Size: {value}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Thumbnail size</DropdownMenuLabel>
        {(['XL', 'L', 'M', 'S', 'XS'] as const).map((s) => (
          <DropdownMenuItem key={s} onClick={() => onChange(s)}>
            {s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default GridSizeSelector;


