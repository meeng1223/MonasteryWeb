import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { AuthProvider } from "../lib/auth.jsx";

// Everything under /admin. Loaded on demand (see App.jsx), so the public site
// never downloads the admin screens or Firebase Auth.
export default function AdminRoot() {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="py-4xl text-center text-ink-light">Loading…</div>}>
        <Outlet />
      </Suspense>
    </AuthProvider>
  );
}
