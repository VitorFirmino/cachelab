import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/auth";

import { LoginForm } from "./login-form";
import { CacheLabMark } from "@/components/cachelab-mark";

interface LoginPageProps {
  searchParams?: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedParams = await searchParams;
  const next = resolvedParams?.next || "/admin";
  const error = resolvedParams?.error;

  if (!error) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (data.user && isAdminUser(data.user)) {
      redirect(next);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
      <div className="w-full max-w-sm space-y-8 animate-in">
        <div className="flex flex-col items-center gap-4">
          <CacheLabMark className="h-16 w-16 drop-shadow-[0_0_40px_rgba(79,125,255,0.5)] animate-in-scale" />
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight gradient-text">
              Acesso Administrativo
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Faça login para acessar o painel.
            </p>
          </div>
        </div>

        {error === "not_admin" && (
          <div className="rounded-xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.06)] px-4 py-3 text-center text-xs text-destructive animate-in delay-1">
            Sua conta não tem permissão de administrador.
          </div>
        )}

        <div className="relative rounded-2xl border border-border bg-card p-6 backdrop-blur-xl animate-in delay-1">
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary to-transparent opacity-40" />
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
