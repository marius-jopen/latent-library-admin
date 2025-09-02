"use client";

import ImageCard, { type ImageRow } from '@/components/ImageCard';

export function AdminGridItem({ item, onSelect }: { item: ImageRow; onSelect?: (item: ImageRow) => void }) {
  return (
    <div>
      <ImageCard item={item} onSelect={onSelect} />
    </div>
  );
}

export default AdminGridItem;


