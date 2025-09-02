"use client";

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import TopNavLinks from '@/components/admin/TopNavLinks';

type PreviewImage = { id: number; s3_bucket: string | null; s3_key: string };
type Collection = { id: number; name: string; description: string | null; created_at: string; previews?: PreviewImage[] };

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Latent Library';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(0);

  async function load() {
    const res = await fetch('/api/collections');
    if (!res.ok) return;
    const list = (await res.json()) as Collection[];
    // Put Default first, keep others order afterwards
    const sorted = [...list].sort((a, b) => {
      const aDef = a.name.toLowerCase() === 'saved' ? 0 : 1;
      const bDef = b.name.toLowerCase() === 'saved' ? 0 : 1;
      if (aDef !== bDef) return aDef - bDef;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setCollections(sorted);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!headerRef.current) return;
    const el = headerRef.current;
    const update = () => setHeaderHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  async function createCollection() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setName('');
        load();
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div ref={headerRef} className="fixed top-0 left-0 right-0 z-30 bg-white ">
        <div className="px-4">
          <header className="flex items-center justify-between gap-2 pt-2">
            <a href="/admin" className="text-xl font-semibold">{appName}</a>
            <TopNavLinks />
          </header>
        </div>
      </div>
      <div style={{ height: headerHeight }} />
      <h1 className="text-xl font-semibold">Collections</h1>
      <div className="flex gap-2">
        <Input placeholder="New collection name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={createCollection} disabled={creating}>Create</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((c) => {
          const count = c.previews?.length || 0;
          const imgs = c.previews || [];
          const isSaved = c.name.toLowerCase() === 'saved';
          return (
            <div className="rounded-md border p-0 overflow-hidden relative" key={c.id}>
              <a href={`/admin?collectionId=${c.id}`} className="block">
              {count === 1 ? (
                <div className="grid grid-cols-2 grid-rows-2 aspect-[4/3] bg-muted">
                  {(() => {
                    const p = imgs[0]!;
                    const src = `/api/images/preview?bucket=${encodeURIComponent(p.s3_bucket || '')}&key=${encodeURIComponent(p.s3_key)}`;
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt="" className="w-full h-full object-cover col-span-2 row-span-2" />
                    );
                  })()}
                </div>
              ) : count === 2 ? (
                <div className="grid grid-cols-2 grid-rows-1 aspect-[4/3] bg-muted">
                  {Array.from({ length: 2 }).map((_, i) => {
                    const p = imgs[i]!;
                    const src = `/api/images/preview?bucket=${encodeURIComponent(p.s3_bucket || '')}&key=${encodeURIComponent(p.s3_key)}`;
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={p.id} src={src} alt="" className="w-full h-full object-cover" />
                    );
                  })}
                </div>
              ) : count === 3 ? (
                <div className="grid grid-cols-2 grid-rows-2 aspect-[4/3] bg-muted">
                  {(() => {
                    const first = imgs[0]!;
                    const src1 = `/api/images/preview?bucket=${encodeURIComponent(first.s3_bucket || '')}&key=${encodeURIComponent(first.s3_key)}`;
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src1} alt="" className="w-full h-full object-cover row-span-2" />
                    );
                  })()}
                  {Array.from({ length: 2 }).map((_, i) => {
                    const p = imgs[i + 1]!;
                    const src = `/api/images/preview?bucket=${encodeURIComponent(p.s3_bucket || '')}&key=${encodeURIComponent(p.s3_key)}`;
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={p.id} src={src} alt="" className="w-full h-full object-cover" />
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 grid-rows-2 aspect-[4/3] bg-muted">
                  {Array.from({ length: 4 }).map((_, i) => {
                    const p = imgs[i];
                    if (!p) return <Skeleton key={i} className="w-full h-full" />;
                    const src = `/api/images/preview?bucket=${encodeURIComponent(p.s3_bucket || '')}&key=${encodeURIComponent(p.s3_key)}`;
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={p.id} src={src} alt="" className="w-full h-full object-cover" />
                    );
                  })}
                </div>
              )}
              <div className="p-3 pr-14">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">Created {new Date(c.created_at).toLocaleString()}</div>
              </div>
              </a>
              {isSaved ? null : (
                <form
                  className="absolute bottom-3 z-20 right-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const btn = e.currentTarget.querySelector('button');
                    if (btn) btn.setAttribute('disabled', 'true');
                    try {
                      const res = await fetch(`/api/collections/${c.id}`, { method: 'DELETE' });
                      if (!res.ok) alert('Failed to delete collection');
                      else setCollections((prev) => prev.filter((x) => x.id !== c.id));
                    } finally {
                      if (btn) btn.removeAttribute('disabled');
                    }
                  }}
                >
                  <button
                    type="submit"
                    className="font-medium h-8 px-3 rounded-full text-white text-xs bg-destructive hover:bg-destructive/90 cursor-pointer"
                  >
                    Delete
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


