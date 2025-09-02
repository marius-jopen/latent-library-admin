"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Collection = { id: number; name: string };

export function CollectionPicker({ imageId }: { imageId: number }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newName, setNewName] = useState('');

  async function loadCollections() {
    const res = await fetch('/api/collections');
    if (!res.ok) return;
    const data = (await res.json()) as Array<Collection & { created_at: string }>;
    setCollections(data.map(({ id, name }) => ({ id, name })));
  }

  useEffect(() => {
    if (open) loadCollections();
  }, [open]);

  async function addToCollection(collectionId: number) {
    setLoading(true);
    try {
      await fetch(`/api/collections/${collectionId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId }),
      });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  async function createAndAdd() {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) return;
      const col = (await res.json()) as { id: number };
      setNewName('');
      await addToCollection(col.id);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Add to collection</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Add to collection</DropdownMenuLabel>
        {collections.length > 0 ? (
          collections.map((c) => (
            <DropdownMenuItem key={c.id} onClick={() => addToCollection(c.id)} disabled={loading}>
              {c.name}
            </DropdownMenuItem>
          ))
        ) : (
          <div className="px-2 py-1 text-xs text-muted-foreground">No collections yet</div>
        )}
        <DropdownMenuSeparator />
        <div className="px-2 py-2 space-y-2">
          <div className="text-xs text-muted-foreground">Create new</div>
          <div className="flex gap-2">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Collection name" />
            <Button onClick={createAndAdd} disabled={loading || !newName.trim()}>Add</Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CollectionPicker;


