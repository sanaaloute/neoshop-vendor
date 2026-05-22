import type { WalletTransaction } from "@/services/vendor/types";

function escCell(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadWalletTransactionsCsv(rows: WalletTransaction[]) {
  const lines: string[] = [
    "id,created_at,type,description,amount,currency,status",
  ];
  rows.forEach((t) => {
    lines.push(
      [
        escCell(t.id),
        escCell(t.createdAt),
        escCell(t.type),
        escCell(t.description ?? ""),
        String(t.amount),
        escCell(t.currency),
        escCell(t.status),
      ].join(",")
    );
  });

  const csv = lines.join("\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `neoshop-wallet-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
