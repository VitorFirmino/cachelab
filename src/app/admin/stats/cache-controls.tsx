"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { purgeAllCache, purgeCacheByTags, updateCacheTTL } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const CACHE_TAGS = [
  { value: "products", label: "Produtos" },
  { value: "featured", label: "Destaques" },
  { value: "events", label: "Eventos" },
  { value: "categories", label: "Categorias" },
  { value: "pulse", label: "Pulse" },
];

export interface CacheConfigRow {
  id: string;
  label: string;
  stale: number;
  revalidate: number;
  expire: number;
  updatedAt: string;
}

interface CacheControlsProps {
  initialConfigs: CacheConfigRow[];
}

export function CacheControls({ initialConfigs }: CacheControlsProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [configs, setConfigs] = useState<CacheConfigRow[]>(initialConfigs);
  const [original, setOriginal] = useState<CacheConfigRow[]>(initialConfigs);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const isDirty = (id: string) => {
    const curr = configs.find((c) => c.id === id);
    const orig = original.find((c) => c.id === id);
    if (!curr || !orig) return false;
    return curr.stale !== orig.stale || curr.revalidate !== orig.revalidate || curr.expire !== orig.expire;
  };

  const updateField = (id: string, field: "stale" | "revalidate" | "expire", value: number) => {
    setRowErrors((prev) => {
      if (!prev[id]) return prev;
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
    setConfigs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const saveTTL = async (cfg: CacheConfigRow) => {
    const result = await updateCacheTTL(cfg.id, cfg.stale, cfg.revalidate, cfg.expire);
    if (result.ok) {
      toast.success(result.message);
      setRowErrors((prev) => {
        if (!prev[cfg.id]) return prev;
        const { [cfg.id]: _removed, ...rest } = prev;
        return rest;
      });
      // Mark this row as clean locally so the action button disappears without a full refresh.
      setOriginal((prev) =>
        prev.map((o) =>
          o.id === cfg.id
            ? { ...o, stale: cfg.stale, revalidate: cfg.revalidate, expire: cfg.expire, updatedAt: new Date().toISOString() }
            : o,
        ),
      );
      return true;
    }

    setRowErrors((prev) => ({ ...prev, [cfg.id]: result.message }));
    // Put focus back on the edited row to make the error obvious.
    inputRefs.current[`${cfg.id}:stale`]?.focus();
    toast.error(result.message);
    return false;
  };

  const confirmingCfg = confirmingId ? configs.find((c) => c.id === confirmingId) : undefined;
  const confirmingOrig = confirmingId ? original.find((c) => c.id === confirmingId) : undefined;
  const confirmingError = confirmingId ? rowErrors[confirmingId] : undefined;

  const handlePurgeAll = () => {
    startTransition(async () => {
      const result = await purgeAllCache();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  };

  const handlePurgeByTags = () => {
    if (selectedTags.length === 0) return;
    startTransition(async () => {
      const result = await purgeCacheByTags(selectedTags);
      if (result.ok) {
        toast.success(result.message);
        setSelectedTags([]);
      } else {
        toast.error(result.message);
      }
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="inline-block h-2 w-2 rounded-full bg-accent-cyan shadow-[0_0_8px_var(--accent-cyan)]" />
          Controle de Cache
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
            TTLs Configurados
          </p>
          <p className="text-[10px] text-muted-foreground mb-3">stale / revalidate / expire (segundos)</p>
          <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {configs.map((cfg) => (
              <div
                key={cfg.id}
                className={[
                  "rounded-lg border bg-[rgba(17,27,46,0.2)] px-3 py-3 space-y-2",
                  rowErrors[cfg.id] ? "border-[rgba(239,68,68,0.5)]" : "border-border",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{cfg.label}</span>
                  <span className="text-[10px] font-mono text-muted-foreground/60">{cfg.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-0.5">
                    <label className="text-[10px] text-muted-foreground">stale</label>
                    <Input
                      type="number"
                      min={0}
                      value={cfg.stale}
                      onChange={(e) => updateField(cfg.id, "stale", Number(e.target.value))}
                      aria-label={`${cfg.id} stale`}
                      aria-invalid={rowErrors[cfg.id] ? true : undefined}
                      ref={(el) => {
                        inputRefs.current[`${cfg.id}:stale`] = el;
                      }}
                      className={[
                        "h-8 text-xs font-mono",
                        rowErrors[cfg.id] ? "border-[rgba(239,68,68,0.6)] focus-visible:border-[rgba(239,68,68,0.7)] focus-visible:shadow-[0_0_0_2px_rgba(239,68,68,0.15),0_0_15px_rgba(239,68,68,0.08)]" : "",
                      ].join(" ")}
                    />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <label className="text-[10px] text-muted-foreground">reval</label>
                    <Input
                      type="number"
                      min={0}
                      value={cfg.revalidate}
                      onChange={(e) => updateField(cfg.id, "revalidate", Number(e.target.value))}
                      aria-label={`${cfg.id} revalidate`}
                      aria-invalid={rowErrors[cfg.id] ? true : undefined}
                      ref={(el) => {
                        inputRefs.current[`${cfg.id}:revalidate`] = el;
                      }}
                      className={[
                        "h-8 text-xs font-mono",
                        rowErrors[cfg.id] ? "border-[rgba(239,68,68,0.6)] focus-visible:border-[rgba(239,68,68,0.7)] focus-visible:shadow-[0_0_0_2px_rgba(239,68,68,0.15),0_0_15px_rgba(239,68,68,0.08)]" : "",
                      ].join(" ")}
                    />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <label className="text-[10px] text-muted-foreground">expire</label>
                    <Input
                      type="number"
                      min={0}
                      value={cfg.expire}
                      onChange={(e) => updateField(cfg.id, "expire", Number(e.target.value))}
                      aria-label={`${cfg.id} expire`}
                      aria-invalid={rowErrors[cfg.id] ? true : undefined}
                      ref={(el) => {
                        inputRefs.current[`${cfg.id}:expire`] = el;
                      }}
                      className={[
                        "h-8 text-xs font-mono",
                        rowErrors[cfg.id] ? "border-[rgba(239,68,68,0.6)] focus-visible:border-[rgba(239,68,68,0.7)] focus-visible:shadow-[0_0_0_2px_rgba(239,68,68,0.15),0_0_15px_rgba(239,68,68,0.08)]" : "",
                      ].join(" ")}
                    />
                  </div>
                </div>
                {rowErrors[cfg.id] && (
                  <p className="text-xs text-[rgba(239,68,68,0.95)]">
                    {rowErrors[cfg.id]}
                  </p>
                )}
                {isDirty(cfg.id) && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full h-7 text-xs"
                    onClick={() => setConfirmingId(cfg.id)}
                    disabled={isPending}
                    aria-label={`Revisar TTL ${cfg.id}`}
                  >
                    Revisar Alteração
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Limpar todo o cache ISR do Next.js
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={handlePurgeAll}
            disabled={isPending}
          >
            {isPending ? "Limpando..." : "Purgar Todo Cache"}
          </Button>
        </div>

        <div className="space-y-3 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Ou limpe cache seletivamente por tag:
          </p>
          <div className="flex flex-wrap gap-2">
            {CACHE_TAGS.map((tag) => (
              <button
                key={tag.value}
                type="button"
                onClick={() => toggleTag(tag.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
                  selectedTags.includes(tag.value)
                    ? "border-[rgba(79,125,255,0.4)] bg-[rgba(79,125,255,0.12)] text-primary"
                    : "border-border text-muted-foreground hover:border-[rgba(79,125,255,0.2)]"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePurgeByTags}
            disabled={isPending || selectedTags.length === 0}
          >
            {isPending
              ? "Limpando..."
              : `Purgar ${selectedTags.length} tag${selectedTags.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </CardContent>

      <Dialog open={confirmingId !== null} onOpenChange={(open) => setConfirmingId(open ? confirmingId : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Alteração de TTL</DialogTitle>
            <DialogDescription>
              Esta é uma alteração sensível e afeta diretamente o comportamento de cache.
            </DialogDescription>
          </DialogHeader>

          {confirmingError && (
            <div className="rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.06)] px-3 py-2 text-xs text-[rgba(239,68,68,0.95)]">
              {confirmingError}
            </div>
          )}

          {confirmingCfg && confirmingOrig ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Perfil</span>
                <span className="font-mono">{confirmingCfg.id}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border bg-[rgba(17,27,46,0.2)] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">stale</div>
                  <div className="font-mono text-xs">
                    {confirmingOrig.stale} → {confirmingCfg.stale}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-[rgba(17,27,46,0.2)] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">revalidate</div>
                  <div className="font-mono text-xs">
                    {confirmingOrig.revalidate} → {confirmingCfg.revalidate}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-[rgba(17,27,46,0.2)] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">expire</div>
                  <div className="font-mono text-xs">
                    {confirmingOrig.expire} → {confirmingCfg.expire}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Nenhuma alteração selecionada.</div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmingId(null)}
              disabled={isPending}
              aria-label="Cancelar confirmacao TTL"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!confirmingCfg) return;
                startTransition(async () => {
                  const ok = await saveTTL(confirmingCfg);
                  if (ok) setConfirmingId(null);
                });
              }}
              disabled={isPending || !confirmingCfg || !confirmingOrig}
              aria-label="Confirmar alteracao TTL"
            >
              {isPending ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
