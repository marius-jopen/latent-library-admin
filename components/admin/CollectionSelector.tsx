"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Collection = { id: number; name: string };

export function CollectionSelector({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    fetch('/api/collections')
      .then((r) => r.json())
      .then((data: Array<Collection & { created_at?: string }>) => {
        const list = data.map(({ id, name }) => ({ id, name }));
        list.sort((a, b) => (a.name.toLowerCase() === 'saved' ? -1 : b.name.toLowerCase() === 'saved' ? 1 : 0));
        setCollections(list);
      });
  }, []);

  const label = value == null ? 'Collections' : (collections.find((c) => c.id === value)?.name || 'Collections');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{label}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Collections</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onChange(null)}>All</DropdownMenuItem>
        {collections.map((c) => (
          <DropdownMenuItem key={c.id} onClick={() => onChange(c.id)}>
            {c.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CollectionSelector;


