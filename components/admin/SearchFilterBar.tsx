"use client";

import SearchInput from './SearchInput';
import GridSizeSelector, { type ThumbSize } from './GridSizeSelector';
import SortSelector, { type SortValue } from './SortSelector';
import CollectionSelector from './CollectionSelector';

export function SearchFilterBar({
  q,
  onChangeQ,
  size,
  onChangeSize,
  sort,
  onChangeSort,
  collectionId,
  onChangeCollectionId,
}: {
  q: string;
  onChangeQ: (v: string) => void;
  size: ThumbSize;
  onChangeSize: (v: ThumbSize) => void;
  sort: SortValue;
  onChangeSort: (v: SortValue) => void;
  collectionId: number | null;
  onChangeCollectionId: (v: number | null) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center py-2">
      <div className="flex-1">
        <SearchInput value={q} onChange={onChangeQ} />
      </div>
      <CollectionSelector value={collectionId} onChange={onChangeCollectionId} />
      <GridSizeSelector value={size} onChange={onChangeSize} />
      <SortSelector value={sort} onChange={onChangeSort} />
    </div>
  );
}

export default SearchFilterBar;


