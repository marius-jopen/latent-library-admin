"use client";

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gallery } from '@/components/Gallery';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Latent Library Admin';

export default function AdminPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('');
  const [format, setFormat] = useState<string>('');
  const [nsfw, setNsfw] = useState<'true' | 'false' | ''>('');
  const [sort, setSort] = useState<string>('created_at.desc');

  const nsfwOptions: { label: string; value: '' | 'true' | 'false' }[] = [
    { label: 'Any', value: '' },
    { label: 'Only NSFW', value: 'true' },
    { label: 'Only SFW', value: 'false' },
  ];

  const query = useMemo(
    () => ({ q, status: status || undefined, format: format || undefined, nsfw, sort }),
    [q, status, format, nsfw, sort],
  );

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between gap-2">
        <div className="text-xl font-semibold">{appName}</div>
        <div className="hidden sm:block text-sm text-muted-foreground">/admin</div>
      </header>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="Search filename or UID"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Status</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            {['', 'pending', 'ok', 'error'].map((s) => (
              <DropdownMenuItem key={s || 'any'} onClick={() => setStatus(s)}>
                {s || 'Any'}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Format</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Format</DropdownMenuLabel>
            {['', 'jpg', 'jpeg', 'png', 'webp', 'heif'].map((f) => (
              <DropdownMenuItem key={f || 'any'} onClick={() => setFormat(f)}>
                {f || 'Any'}
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
        {/* Future: is_public and tags (disabled controls) */}
        <div className="flex items-center gap-2 opacity-60">
          <div className="flex items-center gap-2">
            <Switch disabled id="is_public" />
            <label htmlFor="is_public" className="text-sm">is_public</label>
          </div>
          <Input placeholder="tags (comma)" className="w-40" disabled />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {status && <Badge variant="secondary">status: {status}</Badge>}
        {format && <Badge variant="secondary">format: {format}</Badge>}
        {nsfw && <Badge variant="secondary">nsfw: {nsfw}</Badge>}
        {sort && <Badge variant="outline">sort: {sort}</Badge>}
      </div>

      <Gallery query={query} />
    </div>
  );
}


