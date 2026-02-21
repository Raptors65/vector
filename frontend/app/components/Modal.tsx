"use client";

export function Modal({
  onClose,
  width = 480,
  children,
}: {
  onClose: () => void;
  width?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-20"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-zinc-950 border border-zinc-700 p-8"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-zinc-500 hover:text-white transition-colors text-sm"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
