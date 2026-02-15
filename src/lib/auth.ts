import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function getAdminEmailAllowlist() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user: User | null) {
  if (!user) return false;
  const role =
    (user.app_metadata as { role?: string } | undefined)?.role ??
    (user.user_metadata as { role?: string } | undefined)?.role;
  if (role === "admin") return true;

  const email = user.email?.toLowerCase();
  if (!email) return false;
  return getAdminEmailAllowlist().includes(email);
}

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect("/login");
  }
  return data.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdminUser(user)) {
    redirect("/login?error=not_admin");
  }
  return user;
}
