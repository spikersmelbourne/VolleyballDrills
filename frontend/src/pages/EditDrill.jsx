import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import PageLayout from "../components/PageLayout";
import clubLogo from "../assets/logo.png";
import { supabase } from "../lib/supabaseClient";

import {
  getDrill,
  updateDrill,
  deleteDrill,
  listComments,
  listRatings,
  addComment,
  addRating,
} from "../api/drills";

// UI labels
const LEVEL_LABELS = ["A", "B1", "B2", "C1", "C2", "C3"];
const LEVEL_TO_ID = { A: 1, B1: 2, B2: 3, C1: 4, C2: 5, C3: 6 };
const ID_TO_LEVEL = { 1: "A", 2: "B1", 3: "B2", 4: "C1", 5: "C2", 6: "C3" };

const FUNDAMENTALS_UI = [
  "Defense",
  "Setting",
  "Attack",
  "Block",
  "Serve",
  "Receive",
  "Ball Control",
];

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
const DRILL_VALUE_TO_UI = {
  warmup: "Warm-up",
  technical: "Technical",
  game_like: "Game-like",
  educational: "Educational",
};

function toUiFundamental(f) {
  const s = String(f || "").trim().toLowerCase();
  if (s === "ball control") return "Ball Control";
  if (s === "receive") return "Receive";
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
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

export default function EditDrill() {
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
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // drill fields (NO TITLE)
  const [url, setUrl] = useState("");

  const [levels, setLevels] = useState([]); // UI labels
  const [fundamentals, setFundamentals] = useState([]); // UI labels
  const [drillTypes, setDrillTypes] = useState([]); // UI labels

  const [coachParticipates, setCoachParticipates] = useState(false);
  const [goodForManyPlayers, setGoodForManyPlayers] = useState(false);

  // lists
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [ratings, setRatings] = useState([]);

  const [commentsLoading, setCommentsLoading] = useState(true);
  const [comments, setComments] = useState([]);

  // unified panel inputs
  const [name, setName] = useState("");
  const [tested, setTested] = useState(false);
  const [rating, setRating] = useState(""); // 1..10
  const [comment, setComment] = useState("");

  function toggleValue(value, list, setList) {
    setList((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  const payloadForBackend = useMemo(() => {
    return {
      url,
      levels: levels.map((lv) => LEVEL_TO_ID[lv]).filter(Boolean),
      fundamentals: fundamentals.map(normalizeFundamental),
      drill_types: drillTypes.map((t) => DRILL_TYPE_TO_VALUE[t]).filter(Boolean),
      coach_participates: coachParticipates,
      good_for_many_players: goodForManyPlayers,
    };
  }, [url, levels, fundamentals, drillTypes, coachParticipates, goodForManyPlayers]);

  // -------------------------
  // Load drill
  // -------------------------
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        const d = await getDrill(id);
        if (!alive) return;

        setUrl(d.url || "");
        setLevels((d.levels || []).map((n) => ID_TO_LEVEL[n]).filter(Boolean));
        setFundamentals((d.fundamentals || []).map(toUiFundamental).filter(Boolean));
        setDrillTypes((d.drill_types || []).map((v) => DRILL_VALUE_TO_UI[v] || v));

        setCoachParticipates(Boolean(d.coach_participates));
        setGoodForManyPlayers(Boolean(d.good_for_many_players));
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

  async function reloadComments() {
    setCommentsLoading(true);
    try {
      const data = await listComments(id);
      setComments(data || []);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }

  async function reloadRatings() {
    setRatingsLoading(true);
    try {
      const data = await listRatings(id);
      setRatings(data || []);
    } catch {
      setRatings([]);
    } finally {
      setRatingsLoading(false);
    }
  }

  useEffect(() => {
    reloadComments();
    reloadRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // -------------------------
  // Save + Delete
  // -------------------------
  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    try {
      await updateDrill(id, payloadForBackend);
      toast.success("Drill updated");
      navigate(`/drills/${id}`);
    } catch (err) {
      toast.error(err?.message || "Error updating drill");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const ok = window.confirm("Delete this drill?");
    if (!ok) return;

    try {
      await deleteDrill(id);
      toast.success("Drill deleted");
      navigate("/", { state: { refresh: true } });
    } catch (err) {
      toast.error(err?.message || "Error deleting drill");
    }
  }

  // -------------------------
  // Unified submit rules
  // -------------------------
  const nameOk = name.trim().length >= 2;
  const commentText = comment.trim();

  const ratingNumber = rating === "" ? null : Number(rating);
  const ratingOk =
    ratingNumber != null &&
    Number.isFinite(ratingNumber) &&
    ratingNumber >= 1 &&
    ratingNumber <= 10;

  const wantsComment = commentText.length > 0;

  // Tested + Rating must be together:
  const testedPackageOk = tested && ratingOk;
  const testedPackageInvalid = (tested && !ratingOk) || (!tested && rating !== "");

  const canSubmit = nameOk && (wantsComment || testedPackageOk) && !testedPackageInvalid;

  async function handleSubmitPanel() {
    if (!nameOk) {
      toast.error("Name is required");
      return;
    }

    if (testedPackageInvalid) {
      if (tested && !ratingOk) toast.error("If Tested is checked, Rating is required (1–10)");
      else toast.error("Rating is only allowed if Tested is checked");
      return;
    }

    if (!wantsComment && !testedPackageOk) {
      toast.error("Nothing to submit");
      return;
    }

    setSubmitting(true);
    try {
      const tasks = [];

      if (wantsComment) {
        tasks.push(addComment(id, { comment: commentText, created_by_name: name.trim() }));
      }

      if (testedPackageOk) {
        tasks.push(addRating(id, { score: Number(ratingNumber), created_by_name: name.trim() }));
      }

      await Promise.all(tasks);

      toast.success("Submitted");
      setComment("");
      setTested(false);
      setRating("");

      await Promise.all([reloadComments(), reloadRatings()]);
    } catch (err) {
      toast.error(err?.message || "Error submitting");
    } finally {
      setSubmitting(false);
    }
  }

  const avgRating =
    ratings.length > 0
      ? ratings.reduce((acc, r) => acc + Number(r.score || 0), 0) / ratings.length
      : null;

  const testedStatusText = (ratings?.length || 0) > 0 ? "Tested" : "Not tested";

  if (loading) {
    return (
      <PageLayout>
        <div className="text-sm text-slate-500">Loading...</div>
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
            <div className="text-xs font-semibold text-slate-500">
              Edit drill (login required)
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-5">
          <LinkButton onClick={() => navigate("/")}>Home</LinkButton>
          <LinkButton onClick={() => navigate(`/drills/${id}`)}>Back to Drill</LinkButton>
          <LinkButton onClick={() => navigate("/coach-manual")}>Coach Manual</LinkButton>
          {!session && (
            <LinkButton
              onClick={() =>
                navigate("/login", { state: { redirectTo: `/drills/${id}/edit` } })
              }
            >
              Login
            </LinkButton>
          )}
        </nav>
      </header>

      <div className="mt-6 border-t border-slate-200" />

      {/* Content */}
      <section className="mt-6">
        {/* Title row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Edit Drill</h1>
            <p className="mt-1 text-sm text-slate-600">
              Save changes + submit tested/rating/comments.
            </p>
          </div>

          <div className="text-sm font-semibold text-slate-700">
            <span>{testedStatusText}</span>
            {avgRating != null ? (
              <span className="ml-3">Avg rating: {avgRating.toFixed(1)}/10</span>
            ) : (
              <span className="ml-3">No rating yet</span>
            )}
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="mt-6 space-y-7">
          {/* URL */}
          <div>
            <label className="text-sm font-bold text-slate-800">Link</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1E4ED8] focus:ring-4 focus:ring-[#F7C948]/25"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://..."
            />
            <p className="mt-2 text-xs text-slate-500">Must be a full URL (with https://).</p>
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
                <Chip
                  key={l}
                  active={levels.includes(l)}
                  onClick={() => toggleValue(l, levels, setLevels)}
                >
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
              <Chip
                active={goodForManyPlayers}
                onClick={() => setGoodForManyPlayers((v) => !v)}
              >
                Good for many players
              </Chip>
            </div>
          </div>

          {/* Save + Delete */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#1E4ED8] px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#193FB3] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="rounded-xl border border-rose-200 bg-white px-6 py-3 text-sm font-extrabold text-rose-600 hover:bg-rose-50"
            >
              Delete drill
            </button>

            {!session && (
              <span className="ml-auto text-xs font-semibold text-slate-500">
                You can browse, but edit actions require login.
              </span>
            )}
          </div>
        </form>

        {/* Divider */}
        <div className="mt-10 border-t border-slate-200" />

        {/* Interaction panel */}
        <div className="mt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-base font-extrabold tracking-tight">Interaction panel</h2>
            <div className="text-sm font-semibold text-slate-700">
              <span>{testedStatusText}</span>
              {avgRating != null ? (
                <span className="ml-3">Avg rating: {avgRating.toFixed(1)}/10</span>
              ) : (
                <span className="ml-3">No rating yet</span>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-4">
            {/* Name */}
            <div>
              <label className="text-sm font-bold text-slate-800">Name (required)</label>
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1E4ED8] focus:ring-4 focus:ring-[#F7C948]/25"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            {/* Tested + Rating */}
            <div className="rounded-2xl border border-slate-200 bg-[#F7C948]/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
                  <input
                    type="checkbox"
                    checked={tested}
                    onChange={() => setTested((v) => !v)}
                    className="h-4 w-4 accent-[#1E4ED8]"
                  />
                  Tested
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">Rating (1–10)</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#1E4ED8] focus:ring-4 focus:ring-[#F7C948]/25"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    placeholder="1–10"
                  />
                </div>
              </div>

              {testedPackageInvalid && (
                <p className="mt-3 text-sm font-semibold text-rose-600">
                  Tested and Rating must be submitted together.
                </p>
              )}
              {!testedPackageInvalid && tested && !ratingOk && rating !== "" && (
                <p className="mt-3 text-sm font-semibold text-rose-600">
                  Rating must be between 1 and 10.
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="text-sm font-bold text-slate-800">Comment (optional)</label>
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1E4ED8] focus:ring-4 focus:ring-[#F7C948]/25"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
              />
            </div>

            <button
              type="button"
              onClick={handleSubmitPanel}
              disabled={!canSubmit || submitting}
              className="rounded-xl bg-[#1E4ED8] px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#193FB3] disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>

            {!nameOk && (
              <p className="text-sm font-semibold text-slate-600">
                Tip: fill in your name to enable Submit.
              </p>
            )}
          </div>

          {/* Ratings + Comments lists */}
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {/* Ratings */}
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                Ratings {avgRating != null ? `(avg ${avgRating.toFixed(1)}/10)` : ""}
              </h3>

              {ratingsLoading && <p className="mt-2 text-sm text-slate-500">Loading...</p>}
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
                      <p className="text-sm font-extrabold text-slate-800">
                        {r.score}/10
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {r.created_by_name} • {formatDate(r.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Comments</h3>

              {commentsLoading && <p className="mt-2 text-sm text-slate-500">Loading...</p>}
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
                      <p className="text-sm font-semibold text-slate-800">{c.comment}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {c.created_by_name} • {formatDate(c.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}