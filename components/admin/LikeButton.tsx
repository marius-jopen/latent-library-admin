"use client";

export function LikeButton({ liked, onToggle, className }: { liked: boolean; onToggle: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={liked ? 'Unlike' : 'Like'}
      className={
        `inline-flex items-center justify-center h-8 w-8 border rounded-full transition-colors shadow-sm ` +
        (liked ? 'bg-red-500/90 text-white hover:bg-red-500' : 'bg-background/80 text-muted-foreground hover:bg-background') +
        (className ? ` ${className}` : '')
      }
    >
      <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path d="M12 21s-6.716-4.35-9.428-7.062A5.143 5.143 0 1 1 10.285 6.43L12 8.143 13.715 6.43a5.143 5.143 0 1 1 7.143 7.143C18.716 16.65 12 21 12 21z" />
      </svg>
    </button>
  );
}

export default LikeButton;


