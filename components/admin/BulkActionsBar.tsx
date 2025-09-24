"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImageRow } from '@/components/ImageCard';

type Collection = { id: number; name: string };

interface BulkActionsBarProps {
  selectedImages: ImageRow[];
  onClearSelection: () => void;
  onImagesAddedToCollection?: (imageIds: number[]) => void;
  onImagesRemovedFromCollection?: (imageIds: number[]) => void;
  currentCollectionId?: number | null;
}

const BulkActionsBar = ({
  selectedImages,
  onClearSelection,
  onImagesAddedToCollection,
  onImagesRemovedFromCollection,
  currentCollectionId,
}: BulkActionsBarProps) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => {
    void loadCollections();
  }, []);

  async function loadCollections() {
    const res = await fetch('/api/collections');
    if (!res.ok) return;
    const data = (await res.json()) as Array<Collection & { created_at: string }>;
    setCollections(data.map(({ id, name }) => ({ id, name })));
  }

  async function addToCollection(collectionId: number) {
    if (selectedImages.length === 0) return;
    setLoading(true);
    try {
      const imageIds = selectedImages.map((img) => img.id);
      const response = await fetch('/api/bulk/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds, collectionId, action: 'add' }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add images to collection');
      }
      onImagesAddedToCollection?.(imageIds);
      onClearSelection();
    } catch (error) {
      console.error('Failed to add images to collection:', error);
      alert(`Failed to add images to collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  async function removeFromCollection(collectionId: number) {
    if (selectedImages.length === 0 || !currentCollectionId) return;
    setLoading(true);
    try {
      const imageIds = selectedImages.map((img) => img.id);
      const response = await fetch('/api/bulk/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds, collectionId, action: 'remove' }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove images from collection');
      }
      onImagesRemovedFromCollection?.(imageIds);
      onClearSelection();
    } catch (error) {
      console.error('Failed to remove images from collection:', error);
      alert(`Failed to remove images from collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  async function createAndAddToCollection() {
    if (!newCollectionName.trim() || selectedImages.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      });
      if (!res.ok) throw new Error('Failed to create collection');
      const collection = (await res.json()) as { id: number };
      setNewCollectionName('');
      await addToCollection(collection.id);
    } catch (error) {
      console.error('Failed to create collection and add images:', error);
    } finally {
      setLoading(false);
    }
  }

  if (selectedImages.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] transform">
      <div className="bg-white border border-gray-200 rounded-full shadow-xl px-4 py-2 min-w-[320px] max-w-[min(100vw-2rem,900px)]">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-medium">
            {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={loading}>
                  {currentCollectionId ? 'Move to Collection' : 'Add to Collection'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  {currentCollectionId ? 'Move to Collection' : 'Add to Collection'}
                </DropdownMenuLabel>
                {collections.length > 0 ? (
                  collections.map((collection) => (
                    <div
                      key={collection.id}
                      className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-accent"
                    >
                      <button
                        className="text-left flex-1"
                        disabled={loading}
                        onClick={() => addToCollection(collection.id)}
                      >
                        {collection.name}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-2 py-1 text-xs text-muted-foreground">No collections yet</div>
                )}
                <DropdownMenuSeparator />
                <div className="px-2 py-2 space-y-2">
                  <div className="text-xs text-muted-foreground">Create new collection</div>
                  <div className="flex gap-2">
                    <Input
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="Collection name"
                      className="text-sm"
                    />
                    <Button onClick={createAndAddToCollection} disabled={loading || !newCollectionName.trim()} size="sm">
                      Create
                    </Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            {currentCollectionId && (
              <Button variant="destructive" onClick={() => removeFromCollection(currentCollectionId)} disabled={loading}>
                Remove from Collection
              </Button>
            )}
            <Button variant="outline" onClick={onClearSelection} disabled={loading}>
              Clear Selection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;
