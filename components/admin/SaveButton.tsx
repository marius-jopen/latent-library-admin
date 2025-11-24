"use client";

export function SaveButton({ saved, onToggle, className, imageId }: { saved: boolean; onToggle: () => void; className?: string; imageId?: number }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (imageId) {
          if (saved) {
            fetch('/api/save', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageId }) });
            try {
              window.dispatchEvent(new CustomEvent('image-unsaved', { detail: { imageId } }));
            } catch {}
          } else {
            fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageId }) });
          }
        }
        onToggle();
      }}
      aria-label={saved ? 'Saved' : 'Save'}
      className={
        `inline-flex items-center justify-center h-9 border px-4 rounded-full text-sm font-medium transition-colors shadow-xs ` +
        (saved
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-background/80 text-foreground hover:bg-background') +
        (className ? ` ${className}` : '')
      }
    >
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}

export default SaveButton;


