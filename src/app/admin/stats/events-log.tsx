import { PrefetchLink } from "@/components/prefetch-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

type EventRow = {
  id: number;
  type: string;
  message: string;
  productId: number | null;
  productName: string | null;
  createdAtISO: string;
};

export async function EventsLog() {
  if (process.env.CACHELAB_DISABLE_DB === "1") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="inline-block h-2 w-2 rounded-full bg-accent-purple shadow-[0_0_8px_var(--accent-purple)]" />
            Log de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">DB desabilitado (CACHELAB_DISABLE_DB=1).</p>
        </CardContent>
      </Card>
    );
  }

  const rows: EventRow[] = await prisma.event
    .findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        product: { select: { id: true, name: true } },
      },
    })
    .then((events) =>
      events.map((e) => ({
        id: e.id,
        type: e.type,
        message: e.message,
        productId: e.productId ?? null,
        productName: e.product?.name ?? null,
        createdAtISO: e.createdAt.toISOString(),
      })),
    )
    .catch(() => []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="inline-block h-2 w-2 rounded-full bg-accent-purple shadow-[0_0_8px_var(--accent-purple)]" />
          Log de Eventos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum evento encontrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Produto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {new Date(e.createdAtISO).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{e.type}</TableCell>
                  <TableCell className="text-sm">{e.message}</TableCell>
                  <TableCell className="text-sm">
                    {e.productId ? (
                      <PrefetchLink
                        href={`/product/${e.productId}`}
                        className="text-primary hover:underline"
                      >
                        {e.productName ? e.productName : `#${e.productId}`}
                      </PrefetchLink>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
