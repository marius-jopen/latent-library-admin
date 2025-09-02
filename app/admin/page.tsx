"use client";

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Gallery } from '@/components/Gallery';
import ImageDetailPanel from '@/components/ImageDetailPanel';
import Lightbox from './Lightbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Latent Library';

export default function AdminPage() {
  const [q, setQ] = useState('');
  const [nsfw, setNsfw] = useState<'true' | 'false' | ''>('');
  const [sort, setSort] = useState<string>('created_at.desc');
  const [thumbSize, setThumbSize] = useState<'XL' | 'L' | 'M' | 'S' | 'XS'>('L');
  const [selected, setSelected] = useState<import('@/components/ImageCard').ImageRow | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [items, setItems] = useState<import('@/components/ImageCard').ImageRow[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const nsfwOptions: { label: string; value: '' | 'true' | 'false' }[] = [
    { label: 'Any', value: '' },
    { label: 'Only NSFW', value: 'true' },
    { label: 'Only SFW', value: 'false' },
  ];

  const query = useMemo(
    () => ({ q, nsfw, sort }),
    [q, nsfw, sort],
  );

  const gridClassName = useMemo(() => {
    switch (thumbSize) {
      case 'XL':
        return 'grid grid-cols-2 gap-2';
      case 'L':
        return 'grid grid-cols-4 gap-2';
      case 'M':
        return 'grid grid-cols-6 gap-2';
      case 'S':
        return 'grid grid-cols-8 gap-1';
      case 'XS':
        return 'grid grid-cols-10 gap-1';
      default:
        return 'grid grid-cols-4 gap-2';
    }
  }, [thumbSize]);

  return (
    <div className="p-4 space-y-4">
      <div className="sticky top-0 z-30 bg-white pb-1">
        <header className="flex items-center justify-between gap-2 pt-2">
          <div className="text-xl font-semibold">{appName}</div>
          <div className="hidden sm:block text-sm text-muted-foreground">/admin</div>
        </header>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center py-2">
          <div className="flex-1">
            <Input
              placeholder="Search filename or UID"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Size: {thumbSize}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Thumbnail size</DropdownMenuLabel>
              {(['XL', 'L', 'M', 'S', 'XS'] as const).map((s) => (
                <DropdownMenuItem key={s} onClick={() => setThumbSize(s)}>
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">NSFW</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>NSFW</DropdownMenuLabel>
              {nsfwOptions.map((o) => (
                <DropdownMenuItem key={o.label} onClick={() => setNsfw(o.value)}>
                  {o.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Sort</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Sort</DropdownMenuLabel>
              {[
                'created_at.desc',
                'created_at.asc',
                'bytes.desc',
                'bytes.asc',
                'id.desc',
                'id.asc',
              ].map((s) => (
                <DropdownMenuItem key={s} onClick={() => setSort(s)}>
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => setShowDetail((v) => !v)} className="whitespace-nowrap">
            {showDetail ? 'Hide details' : 'Show details'}
          </Button>
        </div>
      </div>



      <div className={`lg:grid gap-0 transition-[grid-template-columns] duration-300 ${showDetail ? 'lg:grid-cols-[1fr_min(50vw,760px)]' : 'lg:grid-cols-[1fr_0]'}`}>
        <div>
          <Gallery
            query={query}
            onSelect={(it, idx, list) => { setItems(list); setSelected(it); setSelectedIndex(idx); setShowDetail(true); }}
            gridClassName={gridClassName}
          />
        </div>
        <aside className={`hidden lg:block transition-opacity duration-200 ${showDetail ? 'opacity-100' : 'opacity-0'}`}>
          <div className="h-[calc(100dvh-10rem)] sticky top-[7.5rem] overflow-auto">
            {selected ? (
              <div className="relative">
                <button className="flex  w-full justify-end text-sm text-muted-foreground hover:underline" onClick={() => setShowDetail(false)}>
                  Hide
                
                </button>
                <ImageDetailPanel
                  item={selected}
                  onOpenModal={() => setIsLightboxOpen(true)}
                />
                {showDetail ? (
                  <div className="opacity-50 absolute left-2 top-0 flex items-center gap-0">
                    <button
                      className="h-7 w-7 rounded-full bg-background/80 backdrop-blur  text-sm"
                      onClick={() => {
                        if (selectedIndex == null) return;
                        const prev = selectedIndex > 0 ? selectedIndex - 1 : 0;
                        setSelectedIndex(prev);
                        setSelected(items[prev] ?? selected);
                      }}
                      aria-label="Previous"
                    >
                      ←
                    </button>
                    <button
                      className="h-7 w-7 rounded-full bg-background/80 backdrop-blur  text-sm"
                      onClick={() => {
                        if (selectedIndex == null) return;
                        const next = Math.min((items.length - 1), selectedIndex + 1);
                        setSelectedIndex(next);
                        setSelected(items[next] ?? selected);
                      }}
                      aria-label="Next"
                    >
                      →
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Select an image
              </div>
            )}
          </div>
        </aside>
      </div>
      {isLightboxOpen && selected?.signedUrl ? (
        <Lightbox
          src={selected.signedUrl}
          alt={selected.s3_key}
          onClose={() => setIsLightboxOpen(false)}
          onPrev={selectedIndex != null && selectedIndex > 0 ? () => {
            const prev = selectedIndex - 1;
            setSelectedIndex(prev);
            setSelected(items[prev] ?? selected);
          } : undefined}
          onNext={selectedIndex != null && selectedIndex < items.length - 1 ? () => {
            const next = selectedIndex + 1;
            setSelectedIndex(next);
            setSelected(items[next] ?? selected);
          } : undefined}
        />
      ) : null}
    </div>
  );
}


