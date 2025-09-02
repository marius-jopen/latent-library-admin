"use client";

import SearchInput from './SearchInput';
import GridSizeSelector, { type ThumbSize } from './GridSizeSelector';
import NsfwSelector, { type NsfwValue } from './NsfwSelector';
import SortSelector, { type SortValue } from './SortSelector';
import ShowDetailButton from './ShowDetailButton';

export function SearchFilterBar({
  q,
  onChangeQ,
  size,
  onChangeSize,
  nsfw,
  onChangeNsfw,
  sort,
  onChangeSort,
  showDetail,
  onToggleDetail,
}: {
  q: string;
  onChangeQ: (v: string) => void;
  size: ThumbSize;
  onChangeSize: (v: ThumbSize) => void;
  nsfw: NsfwValue;
  onChangeNsfw: (v: NsfwValue) => void;
  sort: SortValue;
  onChangeSort: (v: SortValue) => void;
  showDetail: boolean;
  onToggleDetail: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center py-2">
      <div className="flex-1">
        <SearchInput value={q} onChange={onChangeQ} />
      </div>
      <GridSizeSelector value={size} onChange={onChangeSize} />
      <NsfwSelector value={nsfw} onChange={onChangeNsfw} />
      <SortSelector value={sort} onChange={onChangeSort} />
      <ShowDetailButton show={showDetail} onToggle={onToggleDetail} />
    </div>
  );
}

export default SearchFilterBar;


