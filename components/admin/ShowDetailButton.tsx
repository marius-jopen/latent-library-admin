"use client";

import { Button } from '@/components/ui/button';

export function ShowDetailButton({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <Button variant="outline" onClick={onToggle} className="whitespace-nowrap">
      {show ? 'Hide details' : 'Show details'}
    </Button>
  );
}

export default ShowDetailButton;


