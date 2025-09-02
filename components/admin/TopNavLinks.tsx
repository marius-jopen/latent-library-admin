"use client";

import Link from 'next/link';

export function TopNavLinks() {
  return (
    <nav className="flex items-center gap-4 text-sm">
      <Link href="/admin" className="font-medium">Home</Link>
      <Link href="/admin/collections" className="font-medium">Collections</Link>
    </nav>
  );
}

export default TopNavLinks;


