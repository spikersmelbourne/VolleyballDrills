import { useNavigate } from "react-router-dom";

export default function CoachManual() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Coach Manual</h1>
            <p className="text-sm text-zinc-400">
              Coming soon — levels, promotion rules, and coach conduct.
            </p>
          </div>

          <button
            onClick={() => navigate("/")}
            className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-white"
          >
            ← Back to Home
          </button>
        </div>

        <div className="rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 p-6">
          <p className="text-sm text-zinc-400">
            This page will contain the full coaching guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}