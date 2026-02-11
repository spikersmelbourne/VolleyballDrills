import { supabase } from "../lib/supabaseClient";

function applyFilters(query, params) {
  const { levels, fundamentals, drill_types, coach, many } = params || {};

  if (levels?.length) query = query.overlaps("levels", levels);
  if (fundamentals?.length) query = query.overlaps("fundamentals", fundamentals);
  if (drill_types?.length) query = query.overlaps("drill_types", drill_types);

  if (coach === true) query = query.eq("coach_participates", true);
  if (many === true) query = query.eq("good_for_many_players", true);

  return query;
}

async function requireAuth(msg = "Login required.") {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!data?.user) throw new Error(msg);
  return data.user;
}

// ---------- Drills (public read via view) ----------
export async function listDrills(params = {}) {
  let q = supabase.from("drills_public").select("*");
  q = applyFilters(q, params);

  q = q
    .order("has_rating", { ascending: false })
    .order("avg_rating", { ascending: false, nullsFirst: false })
    .order("ratings_count", { ascending: false })
    .order("has_comments", { ascending: false })
    .order("comments_count", { ascending: false })
    .order("created_at", { ascending: false });

  const { data, error } = await q.limit(2000);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getDrill(id) {
  const { data, error } = await supabase
    .from("drills_public")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ---------- Drills (write = auth) ----------
export async function createDrill(payload) {
  await requireAuth("Login required to add drills.");

  const { data, error } = await supabase
    .from("drills")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateDrill(id, payload) {
  await requireAuth("Login required to edit drills.");

  const { data, error } = await supabase
    .from("drills")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteDrill(id) {
  await requireAuth("Login required to delete drills.");

  const { error } = await supabase.from("drills").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

// ---------- Comments (public read, insert auth) ----------
export async function listComments(drillId) {
  const { data, error } = await supabase
    .from("drill_comments")
    .select("*")
    .eq("drill_id", drillId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function addComment(drillId, payload) {
  await requireAuth("Login required to add comments.");

  const insertPayload = {
    drill_id: drillId,
    comment: payload.comment,
    created_by_name: payload.created_by_name || null,
    created_by_email: payload.created_by_email || null,
  };

  const { data, error } = await supabase
    .from("drill_comments")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteComment() {
  throw new Error("Deleting comments is disabled.");
}

// ---------- Ratings (public read, insert auth) ----------
export async function listRatings(drillId) {
  const { data, error } = await supabase
    .from("drill_ratings")
    .select("*")
    .eq("drill_id", drillId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function addRating(drillId, payload) {
  await requireAuth("Login required to add ratings.");

  const insertPayload = {
    drill_id: drillId,
    score: payload.score,
    created_by_name: payload.created_by_name || null,
    created_by_email: payload.created_by_email || null,
  };

  const { data, error } = await supabase
    .from("drill_ratings")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteRating() {
  throw new Error("Deleting ratings is disabled.");
}