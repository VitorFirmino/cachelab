"use client";

import { useActionState } from "react";

import { PrefetchLink } from "@/components/prefetch-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInAction } from "./actions";

interface LoginFormProps {
  next: string;
}

export function LoginForm({ next }: LoginFormProps) {
  const [state, action, isPending] = useActionState(signInAction, {});

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      <div className="space-y-2">
        <label htmlFor="login-email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Email
        </label>
        <Input
          id="login-email"
          name="email"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="login-password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Senha
        </label>
        <Input
          id="login-password"
          name="password"
          type="password"
          placeholder="********"
          autoComplete="current-password"
          required
        />
      </div>

      {state?.error && (
        <div className="rounded-lg border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.06)] px-3 py-2 text-xs text-destructive">
          {state.error}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button type="submit" disabled={isPending} className="cta-btn">
          {isPending ? "Entrando..." : "Entrar"}
        </Button>
        <PrefetchLink href="/" className="text-xs text-muted-foreground link-glow">
          Voltar ao início
        </PrefetchLink>
      </div>
    </form>
  );
}
