import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function ProtectedRoute({ children }) {
  const [ok, setOk] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setOk(Boolean(data?.user));
    });
    return () => { alive = false; };
  }, []);

  if (ok === null) return null;
  if (!ok) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}