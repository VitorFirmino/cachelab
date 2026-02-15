import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type DebugHeader = {
  key: string;
  value: string | null | undefined;
};

export function DebugHeaderTable({ headers }: { headers: DebugHeader[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Header</TableHead>
          <TableHead>Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {headers.map((header) => (
          <TableRow key={header.key}>
            <TableCell className="font-mono text-xs text-[color:var(--success)]">{header.key}</TableCell>
            <TableCell className="font-mono text-xs text-accent-cyan">
              {header.value ?? <span className="text-muted-foreground">—</span>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
