import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import clubLogo from "../assets/logo.png";
import PageLayout from "../components/PageLayout";
import { listDrills } from "../api/drills";

// UI labels
const LEVEL_LABELS = ["A", "B1", "B2", "C1", "C2", "C3"];
const LEVEL_TO_ID = { A: 1, B1: 2, B2: 3, C1: 4, C2: 5, C3: 6 };
const ID_TO_LEVEL = { 1: "A", 2: "B1", 3: "B2", 4: "C1", 5: "C2", 6: "C3" };

const FUNDAMENTALS = ["serve", "receive", "setting", "attack", "block", "defense", "ball control"];

const DRILL_TYPES_UI = ["Warm-up", "Technical", "Game-like", "Educational"];
const DRILL_TYPE_TO_VALUE = {
  "Warm-up": "warmup",
  Technical: "technical",
  "Game-like": "game_like",
  Educational: "educational",
};
const DRILL_VALUE_TO_UI = {
  warmup: "Warm-up",
  technical: "Technical",
  game_like: "Game-like",
  educational: "Educational",
};

const normalizeFundamental = (f) => {
  if (!f) return "";
  const s = String(f).trim().toLowerCase();
  if (s === "reception") return "receive";
  if (s === "ballcontrol") return "ball control";
  return s;
};

const prettyFundamental = (f) => {
  const s = normalizeFundamental(f);
  if (s === "ball control") return "Ball Control";
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
};

// Skeleton (claro)
function DrillSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse"
        >
          <div className="h-4 w-1/3 rounded bg-slate-100" />
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="h-6 w-14 rounded-full bg-slate-100" />
            <div className="h-6 w-16 rounded-full bg-slate-100" />
            <div className="h-6 w-20 rounded-full bg-slate-100" />
          </div>
          <div className="mt-3 h-10 w-full rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

// Pills
function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1.5 text-sm border transition font-semibold",
        active
          ? "bg-blue-700 text-yellow-300 border-blue-700"
          : "bg-white text-slate-900 border-slate-200 hover:border-blue-300 hover:underline hover:decoration-yellow-400 hover:decoration-2",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

const LS_KEY = "selected_drills_v1";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedFundamentals, setSelectedFundamentals] = useState([]);
  const [selectedDrillTypes, setSelectedDrillTypes] = useState([]);

  const [coachOnly, setCoachOnly] = useState(false);
  const [manyPlayersOnly, setManyPlayersOnly] = useState(false);

  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Selection persisted
  const [selectedDrills, setSelectedDrills] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(Array.from(selectedDrills)));
    } catch {
      // ignore
    }
  }, [selectedDrills]);

  const shareSupported =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const toggle = (value, setFn) => {
    setFn((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const anyFilterActive =
    selectedLevels.length > 0 ||
    selectedFundamentals.length > 0 ||
    selectedDrillTypes.length > 0 ||
    coachOnly ||
    manyPlayersOnly;

  const params = useMemo(() => {
    return {
      levels: selectedLevels.map((lv) => LEVEL_TO_ID[lv]).filter(Boolean),
      fundamentals: selectedFundamentals.map(normalizeFundamental),
      drill_types: selectedDrillTypes.map((t) => DRILL_TYPE_TO_VALUE[t]).filter(Boolean),
      coach: coachOnly ? true : undefined,
      many: manyPlayersOnly ? true : undefined,
    };
  }, [selectedLevels, selectedFundamentals, selectedDrillTypes, coachOnly, manyPlayersOnly]);

  // Only fetch when filters are active
  useEffect(() => {
    let alive = true;

    async function load() {
      if (!anyFilterActive) {
        setDrills([]);
        setLoading(false);
        setError("");
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await listDrills(params);
        if (!alive) return;
        setDrills(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!alive) return;
        setError(err?.message || "Failed to load drills");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [params, anyFilterActive]);

  // refresh flag
  useEffect(() => {
    if (location?.state?.refresh) {
      navigate(".", { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Sorting to guarantee your priority:
  const sortedDrills = useMemo(() => {
    const arr = Array.isArray(drills) ? [...drills] : [];
    const getAvg = (d) => (d.avg_rating == null ? null : Number(d.avg_rating));
    const getRC = (d) => Number(d.ratings_count || 0);
    const getCC = (d) => Number(d.comments_count || 0);
    const getTime = (d) => {
      const t = d.created_at ? new Date(d.created_at).getTime() : 0;
      return Number.isFinite(t) ? t : 0;
    };

    const bucket = (d) => {
      const rc = getRC(d);
      const cc = getCC(d);
      if (rc > 0) return 1; // rating first
      if (cc > 0) return 2; // comments only
      return 3; // rest
    };

    arr.sort((a, b) => {
      const ba = bucket(a);
      const bb = bucket(b);
      if (ba !== bb) return ba - bb;

      if (ba === 1) {
        const avA = getAvg(a) ?? -1;
        const avB = getAvg(b) ?? -1;
        if (avA !== avB) return avB - avA;
        const rcA = getRC(a);
        const rcB = getRC(b);
        if (rcA !== rcB) return rcB - rcA;
        return getTime(b) - getTime(a);
      }

      if (ba === 2) {
        const ccA = getCC(a);
        const ccB = getCC(b);
        if (ccA !== ccB) return ccB - ccA;
        return getTime(b) - getTime(a);
      }

      return getTime(b) - getTime(a);
    });

    return arr;
  }, [drills]);

  const selectedList = useMemo(() => {
    const set = selectedDrills;
    return sortedDrills.filter((d) => set.has(d.id));
  }, [sortedDrills, selectedDrills]);

  const shareText = useMemo(() => {
    if (selectedList.length === 0) return "";
    const lines = [];
    lines.push("Drills for today:");
    selectedList.forEach((d, idx) => {
      const levels = (d.levels || []).map((lv) => ID_TO_LEVEL[lv] || lv).join(", ");
      const fundamentals = (d.fundamentals || []).map((f) => prettyFundamental(f)).join(", ");
      const types = (d.drill_types || []).map((t) => DRILL_VALUE_TO_UI[t] || t).join(", ");

      const metaParts = [];
      if (levels) metaParts.push(`Levels: ${levels}`);
      if (fundamentals) metaParts.push(`Fundamentals: ${fundamentals}`);
      if (types) metaParts.push(`Type: ${types}`);

      lines.push(`${idx + 1}) ${d.url}`);
      if (metaParts.length) lines.push(`   ${metaParts.join(" | ")}`);
    });
    return lines.join("\n");
  }, [selectedList]);

  async function handleCopy() {
    if (!shareText) return;
    try {
      await navigator.clipboard.writeText(shareText);
      alert("Copied!");
    } catch {
      try {
        window.prompt("Copy the text below:", shareText);
      } catch {
        // ignore
      }
    }
  }

  async function handleShare() {
    if (!shareSupported || !shareText) return;
    try {
      await navigator.share({ text: shareText });
    } catch {
      // ignore
    }
  }

  function clearSelection() {
    setSelectedDrills(new Set());
  }

  function toggleSelect(id) {
    setSelectedDrills((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearFilters() {
    setSelectedLevels([]);
    setSelectedFundamentals([]);
    setSelectedDrillTypes([]);
    setCoachOnly(false);
    setManyPlayersOnly(false);
  }

  const selectedCount = selectedDrills.size;

  return (
    <PageLayout>
      {/* ✅ HOME HEADER (só aqui) */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="h-12 w-12 rounded-xl overflow-hidden border border-slate-200 bg-white">
            <img src={clubLogo} alt="Club logo" className="h-full w-full object-cover" />
          </div>

          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight text-slate-900">
              VolleyballDrills
            </div>
            <div className="text-xs text-slate-500">Coaches toolkit</div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-semibold">
          <button
            onClick={() => navigate("/coach-manual")}
            className="text-slate-700 hover:text-blue-700 hover:underline hover:decoration-yellow-400 hover:decoration-2"
          >
            Coach Manual
          </button>

          <button
            onClick={() => navigate("/add-drill")}
            className="text-slate-700 hover:text-blue-700 hover:underline hover:decoration-yellow-400 hover:decoration-2"
          >
            + Add Drill
          </button>
        </div>
      </header>

      {/* Filters */}
      <section className="mt-8 space-y-8">
        {/* Levels */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Levels</h2>
            <span className="text-xs text-slate-500">
              {selectedLevels.length ? `${selectedLevels.length} selected` : "All"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {LEVEL_LABELS.map((lvl) => (
              <Pill
                key={lvl}
                active={selectedLevels.includes(lvl)}
                onClick={() => toggle(lvl, setSelectedLevels)}
              >
                {lvl}
              </Pill>
            ))}
          </div>
        </div>

        {/* Fundamentals */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Fundamentals</h2>
            <span className="text-xs text-slate-500">
              {selectedFundamentals.length ? `${selectedFundamentals.length} selected` : "All"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {FUNDAMENTALS.map((f) => (
              <Pill
                key={f}
                active={selectedFundamentals.includes(f)}
                onClick={() => toggle(f, setSelectedFundamentals)}
              >
                {prettyFundamental(f)}
              </Pill>
            ))}
          </div>
        </div>

        {/* Drill Type */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Drill Type</h2>
            <span className="text-xs text-slate-500">
              {selectedDrillTypes.length ? `${selectedDrillTypes.length} selected` : "All"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {DRILL_TYPES_UI.map((t) => (
              <Pill
                key={t}
                active={selectedDrillTypes.includes(t)}
                onClick={() => toggle(t, setSelectedDrillTypes)}
              >
                {t}
              </Pill>
            ))}
          </div>
        </div>

        {/* Options */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Options</h2>
            <span className="text-xs text-slate-500">AND filters</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill active={coachOnly} onClick={() => setCoachOnly((v) => !v)}>
              Coach participates
            </Pill>
            <Pill active={manyPlayersOnly} onClick={() => setManyPlayersOnly((v) => !v)}>
              Good for many players
            </Pill>

            <button
              onClick={clearFilters}
              className="rounded-full px-3 py-1.5 text-sm border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:underline hover:decoration-yellow-400 hover:decoration-2 font-semibold"
            >
              Clear filters
            </button>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="mt-10">
        {!anyFilterActive && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-slate-700 font-semibold">Select a filter to show drills.</p>
            <p className="mt-2 text-sm text-slate-500">
              Tip: click a level (B1/C1…) or a fundamental (Attack/Defense…) to start.
            </p>
          </div>
        )}

        {anyFilterActive && (
          <>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Drills</h2>
              <p className="text-sm text-slate-500">{sortedDrills.length} results</p>
            </div>

            {loading && <DrillSkeleton />}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && sortedDrills.length === 0 && (
              <p className="text-sm text-slate-600">No drills found with these filters.</p>
            )}

            {!loading && !error && sortedDrills.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortedDrills.map((d) => {
                  const ratingsCount = Number(d.ratings_count || 0);
                  const commentsCount = Number(d.comments_count || 0);
                  const avg = d.avg_rating == null ? null : Number(d.avg_rating);
                  const tested = ratingsCount > 0;

                  const isSelected = selectedDrills.has(d.id);

                  const tagClass = isSelected
                    ? "rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-xs text-white"
                    : "rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700";

                  return (
                    <div
                      key={d.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/drills/${d.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/drills/${d.id}`);
                        }
                      }}
                      className={[
                        "rounded-2xl border p-4 flex flex-col transition cursor-pointer",
                        isSelected
                          ? "border-blue-700 bg-blue-700 text-white"
                          : "border-slate-200 bg-yellow-50 hover:border-blue-300 hover:shadow-sm hover:-translate-y-[1px]",
                      ].join(" ")}
                    >
                      {/* Select */}
                      <div className="mb-3 flex items-center justify-between">
                        <label
                          className={[
                            "inline-flex items-center gap-2 text-xs",
                            isSelected ? "text-white/90" : "text-slate-600",
                          ].join(" ")}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(d.id)}
                          />
                          Select
                        </label>

                        {isSelected && (
                          <span className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-xs text-white">
                            Selected
                          </span>
                        )}
                      </div>

                      {/* Levels + Fundamentals */}
                      <div className="flex flex-wrap gap-2">
                        {(d.levels || []).map((lv) => (
                          <span key={lv} className={tagClass}>
                            {ID_TO_LEVEL[lv] || lv}
                          </span>
                        ))}
                        {(d.fundamentals || []).map((f, idx) => (
                          <span key={`${f}-${idx}`} className={tagClass}>
                            {prettyFundamental(f)}
                          </span>
                        ))}
                      </div>

                      {/* Drill Types */}
                      {(d.drill_types || []).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {d.drill_types.map((type, idx) => (
                            <span key={`${type}-${idx}`} className={tagClass}>
                              {DRILL_VALUE_TO_UI[type] || type}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Flags */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {d.coach_participates && <span className={tagClass}>Coach participates</span>}
                        {d.good_for_many_players && <span className={tagClass}>Good for many players</span>}
                      </div>

                      {/* Tested + rating + counts (SEM emojis) */}
                      <div
                        className={[
                          "mt-3 space-y-1 text-sm",
                          isSelected ? "text-white/90" : "text-slate-700",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2">
                          <span>{tested ? "Tested" : "Not tested"}</span>
                          {avg != null && (
                            <span className={isSelected ? "text-yellow-200" : "text-slate-900"}>
                              • {avg.toFixed(1)}/10
                            </span>
                          )}
                        </div>

                        <div
                          className={[
                            "flex items-center gap-4 text-xs",
                            isSelected ? "text-white/70" : "text-slate-500",
                          ].join(" ")}
                        >
                          <span>{commentsCount} comments</span>
                          <span>{ratingsCount} ratings</span>
                        </div>
                      </div>

                      {/* Open video */}
                      <div className="mt-auto pt-4">
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={[
                            "inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition",
                            isSelected
                              ? "bg-white text-blue-700 hover:bg-yellow-100"
                              : "bg-blue-700 text-yellow-200 hover:bg-blue-800",
                          ].join(" ")}
                        >
                          Open video
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* Selection Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-50 px-4">
          <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white/90 backdrop-blur p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-700">
              Selected: <span className="font-semibold text-blue-700">{selectedCount}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {shareSupported && (
                <button
                  onClick={handleShare}
                  className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-yellow-200 hover:bg-blue-800"
                >
                  Share
                </button>
              )}

              <button
                onClick={handleCopy}
                className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-yellow-200 hover:bg-blue-800"
              >
                Copy links
              </button>

              <button
                onClick={clearSelection}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:underline hover:decoration-yellow-400 hover:decoration-2"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}