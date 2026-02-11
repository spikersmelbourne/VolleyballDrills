// src/components/PageLayout.jsx
export default function PageLayout({ children }) {
  return (
    <div className="vb-bg min-h-screen">
      {/* Ribbon topo */}
      <div className="vb-ribbon" />

      <div className="mx-auto max-w-6xl px-4 py-6">
        
        {/* Proudly inclusive acima do painel */}
        <div className="flex justify-end items-center gap-3 mb-3">
          <span className="text-xs text-slate-500 font-medium">
            Proudly inclusive
          </span>

          <div
            className="h-3 w-6 rounded-sm"
            style={{
              background:
                "linear-gradient(to bottom, #ef4444 0%, #f97316 16%, #facc15 32%, #22c55e 48%, #3b82f6 64%, #a855f7 80%)",
            }}
          />

          <div
            className="h-3 w-6 rounded-sm"
            style={{
              background:
                "linear-gradient(to bottom, #5bcffb 0%, #f5abb9 20%, #ffffff 40%, #f5abb9 60%, #5bcffb 80%)",
            }}
          />
        </div>

        {/* Painel principal */}
        <div className="vb-frame p-6 sm:p-8">
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}