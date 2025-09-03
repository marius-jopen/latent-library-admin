"use client";

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type NsfwValue = '' | 'true' | 'false';

const options: { label: string; value: NsfwValue }[] = [
  { label: 'Any', value: '' },
  { label: 'Only NSFW', value: 'true' },
  { label: 'Only SFW', value: 'false' },
];

export function NsfwSelector({ /* value, */ onChange }: { value: NsfwValue; onChange: (v: NsfwValue) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">NSFW</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>NSFW</DropdownMenuLabel>
        {options.map((o) => (
          <DropdownMenuItem key={o.label} onClick={() => onChange(o.value)}>
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NsfwSelector;


