import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import clubLogo from "../assets/logo.png";
import { toast } from "react-hot-toast";
import { supabase } from "../lib/supabaseClient";
import { getDrill, listComments, listRatings } from "../api/drills";

// mapping UI
const ID_TO_LEVEL = { 1: "A", 2: "B1", 3: "B2", 4: "C1", 5: "C2", 6: "C3" };

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

function Pill({ children }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700">
      {children}
    </span>
  );
}

function formatDate(d) {
  if (!d) return "";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toLocaleString();
  } catch {
    return String(d);
  }
}

export default function DrillDetails() {
  const { id } = useParams();
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

  const [loading, setLoading] = useState(true);
  const [drill, setDrill] = useState(null);

  const [commentsLoading, setCommentsLoading] = useState(true);
  const [comments, setComments] = useState([]);

  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        const d = await getDrill(id);
        if (!alive) return;
        setDrill(d);
      } catch (err) {
        toast.error(err?.message || "Failed to load drill");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    let alive = true;

    async function loadLists() {
      setCommentsLoading(true);
      setRatingsLoading(true);
      try {
        const [c, r] = await Promise.all([listComments(id), listRatings(id)]);
        if (!alive) return;
        setComments(Array.isArray(c) ? c : []);
        setRatings(Array.isArray(r) ? r : []);
      } catch {
        if (!alive) return;
        setComments([]);
        setRatings([]);
      } finally {
        if (!alive) return;
        setCommentsLoading(false);
        setRatingsLoading(false);
      }
    }

    loadLists();
    return () => {
      alive = false;
    };
  }, [id]);

  const ratingsCount = Number(drill?.ratings_count || ratings?.length || 0);
  const commentsCount = Number(drill?.comments_count || comments?.length || 0);

  const avgRating = useMemo(() => {
    if (drill?.avg_rating != null) return Number(drill.avg_rating);
    if (!ratings || ratings.length === 0) return null;
    const sum = ratings.reduce((acc, x) => acc + Number(x.score || 0), 0);
    return sum / ratings.length;
  }, [drill?.avg_rating, ratings]);

  const testedText = ratingsCount > 0 ? "Tested" : "Not tested";

  if (loading) {
    return (
      <PageLayout>
        <div className="text-sm text-slate-500">Loading...</div>
      </PageLayout>
    );
  }

  if (!drill) {
    return (
      <PageLayout>
        <div className="text-sm text-slate-600">Drill not found.</div>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-4 text-sm font-bold text-[#1E4ED8] hover:underline underline-offset-4 decoration-[#F7C948]"
        >
          Back to Home
        </button>
      </PageLayout>
    );
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
            <div className="text-xs font-semibold text-slate-500">Drill details</div>
          </div>
        </div>

        <nav className="flex items-center gap-5">
          <LinkButton onClick={() => navigate("/")}>Home</LinkButton>
          <LinkButton onClick={() => navigate("/coach-manual")}>Coach Manual</LinkButton>

          {session ? (
            <LinkButton onClick={() => navigate(`/drills/${id}/edit`)}>Edit drill</LinkButton>
          ) : (
            <LinkButton onClick={() => navigate("/login", { state: { redirectTo: `/drills/${id}` } })}>
              Login to edit
            </LinkButton>
          )}
        </nav>
      </header>

      <div className="mt-6 border-t border-slate-200" />

      {/* Main */}
      <section className="mt-6">
        <h1 className="text-xl font-extrabold tracking-tight">Drill</h1>

        {/* Meta */}
        <div className="mt-3 flex flex-wrap gap-2">
          {(drill.levels || []).map((lv) => (
            <Pill key={`lv-${lv}`}>{ID_TO_LEVEL[lv] || String(lv)}</Pill>
          ))}
          {(drill.fundamentals || []).map((f, idx) => (
            <Pill key={`f-${idx}`}>{prettyFundamental(f)}</Pill>
          ))}
          {(drill.drill_types || []).map((t, idx) => (
            <Pill key={`t-${idx}`}>{DRILL_VALUE_TO_UI[t] || t}</Pill>
          ))}
          {drill.coach_participates ? <Pill>Coach participates</Pill> : null}
          {drill.good_for_many_players ? <Pill>Good for many players</Pill> : null}
        </div>

        {/* Status line (no emojis) */}
        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-700">
          <span>{testedText}</span>
          {avgRating != null ? <span>Avg rating: {Number(avgRating).toFixed(1)}/10</span> : <span>No rating yet</span>}
          <span>{commentsCount} comments</span>
          <span>{ratingsCount} ratings</span>
        </div>

        {/* CTA */}
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={drill.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-[#1E4ED8] px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#193FB3]"
          >
            Open video
          </a>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-extrabold text-slate-700 hover:border-[#1E4ED8]/40 hover:text-[#1E4ED8]"
          >
            Back
          </button>
        </div>

        <div className="mt-8 border-t border-slate-200" />

        {/* Ratings */}
        <div className="mt-6">
          <h2 className="text-base font-extrabold tracking-tight">Ratings</h2>
          {ratingsLoading && <p className="mt-2 text-sm text-slate-500">Loading ratings...</p>}
          {!ratingsLoading && ratings.length === 0 && (
            <p className="mt-2 text-sm text-slate-600">No ratings yet.</p>
          )}
          {!ratingsLoading && ratings.length > 0 && (
            <div className="mt-3 space-y-2">
              {ratings.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="text-sm font-extrabold text-slate-800">
                    {r.score}/10
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">
                    {r.created_by_name} • {formatDate(r.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="mt-8">
          <h2 className="text-base font-extrabold tracking-tight">Comments</h2>
          {commentsLoading && <p className="mt-2 text-sm text-slate-500">Loading comments...</p>}
          {!commentsLoading && comments.length === 0 && (
            <p className="mt-2 text-sm text-slate-600">No comments yet.</p>
          )}
          {!commentsLoading && comments.length > 0 && (
            <div className="mt-3 space-y-2">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="text-sm font-semibold text-slate-800">{c.comment}</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">
                    {c.created_by_name} • {formatDate(c.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}