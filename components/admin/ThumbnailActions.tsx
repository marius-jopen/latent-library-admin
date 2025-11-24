"use client";

import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SaveButton from './SaveButton';

type Collection = { id: number; name: string };

export default function ThumbnailActions({
  imageId,
  saved,
  onToggleSaved,
}: {
  imageId: number;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch('/api/collections');
        if (!res.ok) return;
        const data = (await res.json()) as Array<Collection & { created_at: string }>;
        setCollections(data.map(({ id, name }) => ({ id, name })));
      } catch {}
    })();
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

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
      >
        <button
          className="h-8 w-8 rounded-full bg-background/80 border shadow-sm flex items-center justify-center"
          aria-label="More actions"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-lg leading-none">⋯</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <div className="px-2 py-1.5">
          <SaveButton saved={saved} onToggle={onToggleSaved} imageId={imageId} className="w-full justify-center" onAfterToggle={() => setOpen(false)} />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Add to collection</DropdownMenuLabel>
        {collections.length === 0 ? (
          <div className="px-2 py-1 text-xs text-muted-foreground">No collections</div>
        ) : (
          collections.map((c) => (
            <DropdownMenuItem
              key={c.id}
              disabled={loading}
              onClick={(e) => {
                e.stopPropagation();
                addToCollection(c.id);
              }}
            >
              {c.name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}




