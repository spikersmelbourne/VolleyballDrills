import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import PageLayout from "../components/PageLayout";
import clubLogo from "../assets/logo.png";
import { createDrill } from "../api/drills";
import { supabase } from "../lib/supabaseClient";

// BACKEND: A=1, B1=2, B2=3, C1=4, C2=5, C3=6
const LEVEL_LABELS = ["A", "B1", "B2", "C1", "C2", "C3"];
const LEVEL_TO_ID = { A: 1, B1: 2, B2: 3, C1: 4, C2: 5, C3: 6 };

const FUNDAMENTALS_UI = ["Defense", "Setting", "Attack", "Block", "Serve", "Receive", "Ball Control"];
const normalizeFundamental = (label) => {
  const s = String(label || "").trim().toLowerCase();
  if (s === "reception") return "receive";
  if (s === "receive") return "receive";
  if (s === "ballcontrol") return "ball control";
  if (s === "ball control") return "ball control";
  return s;
};

const DRILL_TYPES_UI = ["Warm-up", "Technical", "Game-like", "Educational"];
const DRILL_TYPE_TO_VALUE = {
  "Warm-up": "warmup",
  Technical: "technical",
  "Game-like": "game_like",
  Educational: "educational",
};

function LinkButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm font-semibold text-slate-700 hover:text-[#1E4ED8] hover:underline underline-offset-4 decoration-[#F7C948]"
    >
      {children}
    </button>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
        active
          ? "border-[#1E4ED8] bg-[#1E4ED8] text-[#F7C948]"
          : "border-slate-200 bg-white text-slate-700 hover:border-[#1E4ED8]/40 hover:text-[#1E4ED8]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function AddDrill() {
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data?.session ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const [url, setUrl] = useState("");
  const [levels, setLevels] = useState([]); // UI labels
  const [fundamentals, setFundamentals] = useState([]); // UI labels
  const [drillTypes, setDrillTypes] = useState([]); // UI labels
  const [coachParticipates, setCoachParticipates] = useState(false);
  const [goodForManyPlayers, setGoodForManyPlayers] = useState(false);

  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    return url.trim().startsWith("http");
  }, [url]);

  function toggleValue(value, list, setList) {
    setList((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!session) {
      toast.error("Login required to add drills.");
      navigate("/login", { state: { redirectTo: "/add-drill" } });
      return;
    }

    if (!canSave) {
      toast.error("Please paste a full URL (https://...)");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        url: url.trim(),
        platform: "other",
        levels: levels.map((lv) => LEVEL_TO_ID[lv]).filter(Boolean),
        fundamentals: fundamentals.map(normalizeFundamental),
        drill_types: drillTypes.map((t) => DRILL_TYPE_TO_VALUE[t]).filter(Boolean),
        coach_participates: coachParticipates,
        good_for_many_players: goodForManyPlayers,

        // opcional (pode manter ou remover)
        created_by_name: "Roberto",
        created_by_email: "roberto@test.com",
      };

      await createDrill(payload);

      toast.success("Drill saved");
      setUrl("");
      setLevels([]);
      setFundamentals([]);
      setDrillTypes([]);
      setCoachParticipates(false);
      setGoodForManyPlayers(false);
      navigate("/", { state: { refresh: true } });
    } catch (err) {
      toast.error(err?.message || "Error saving drill");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageLayout>
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <img src={clubLogo} alt="Club logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight">
              Volleyball<span className="text-[#1E4ED8]">Drills</span>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Add a drill (login required)
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-5">
          <LinkButton onClick={() => navigate("/")}>Back</LinkButton>
          <LinkButton onClick={() => navigate("/coach-manual")}>Coach Manual</LinkButton>
        </nav>
      </header>

      <div className="mt-6 border-t border-slate-200" />

      {/* Form */}
      <section className="mt-6">
        <h1 className="text-xl font-extrabold tracking-tight">Add Drill</h1>
        <p className="mt-1 text-sm text-slate-600">
          Minimal form. Use filters to describe the drill. Keep it clean.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-7">
          {/* URL */}
          <div>
            <label className="text-sm font-bold text-slate-800">Link</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1E4ED8] focus:ring-4 focus:ring-[#F7C948]/25"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="mt-2 text-xs text-slate-500">
              Full URL required. Tip: paste, then you’re done.
            </p>
          </div>

          {/* Fundamentals */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800">Fundamentals</p>
              <span className="text-xs text-slate-500">
                {fundamentals.length ? `${fundamentals.length} selected` : "All"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {FUNDAMENTALS_UI.map((f) => (
                <Chip
                  key={f}
                  active={fundamentals.includes(f)}
                  onClick={() => toggleValue(f, fundamentals, setFundamentals)}
                >
                  {f}
                </Chip>
              ))}
            </div>
          </div>

          {/* Levels */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800">Levels</p>
              <span className="text-xs text-slate-500">
                {levels.length ? `${levels.length} selected` : "All"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {LEVEL_LABELS.map((l) => (
                <Chip key={l} active={levels.includes(l)} onClick={() => toggleValue(l, levels, setLevels)}>
                  {l}
                </Chip>
              ))}
            </div>
          </div>

          {/* Drill Types */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800">Drill Type</p>
              <span className="text-xs text-slate-500">
                {drillTypes.length ? `${drillTypes.length} selected` : "All"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {DRILL_TYPES_UI.map((d) => (
                <Chip
                  key={d}
                  active={drillTypes.includes(d)}
                  onClick={() => toggleValue(d, drillTypes, setDrillTypes)}
                >
                  {d}
                </Chip>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <p className="text-sm font-bold text-slate-800">Options</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Chip active={coachParticipates} onClick={() => setCoachParticipates((v) => !v)}>
                Coach participates
              </Chip>
              <Chip active={goodForManyPlayers} onClick={() => setGoodForManyPlayers((v) => !v)}>
                Good for many players
              </Chip>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving || !canSave}
              className="rounded-xl bg-[#1E4ED8] px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#193FB3] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Drill"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-extrabold text-slate-700 hover:border-[#1E4ED8]/40 hover:text-[#1E4ED8]"
            >
              Cancel
            </button>

            {!session && (
              <button
                type="button"
                onClick={() => navigate("/login", { state: { redirectTo: "/add-drill" } })}
                className="ml-auto text-sm font-bold text-slate-600 hover:text-[#1E4ED8] hover:underline underline-offset-4 decoration-[#F7C948]"
              >
                Login required (click to login)
              </button>
            )}
          </div>
        </form>
      </section>
    </PageLayout>
  );
}