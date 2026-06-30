import type { VendorOrder } from "./types";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toNumber(value: string | number): number {
  if (typeof value === "number") return Number.isNaN(value) ? 0 : value;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function money(value: string | number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "CNY",
  }).format(toNumber(value));
}

function printStatusLabel(s: string) {
  switch (s) {
    case "pending_payment":
      return "Pending Payment";
    case "paid":
      return "Paid";
    case "processing":
      return "Processing";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "disputed":
      return "Disputed";
    case "refunded":
      return "Refunded";
    case "cancelled":
      return "Cancelled";
    default:
      return s;
  }
}

export function buildInvoiceHtml(order: VendorOrder) {
  const rows = order.lines
    .map(
      (l) =>
        `<tr><td>${esc(l.sku)}</td><td>${esc(l.name)}</td><td style="text-align:right">${l.qty}</td><td style="text-align:right">${money(l.unitPrice)}</td><td style="text-align:right">${money(l.qty * toNumber(l.unitPrice))}</td></tr>`
    )
    .join("");
  return `
    <h1>Invoice</h1>
    <p><strong>${esc(order.reference)}</strong> · ${esc(order.id)}</p>
    <p>Bill to: ${esc(order.customerEmail)}</p>
    <p>Status: ${esc(printStatusLabel(order.status))}</p>
    <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;margin-top:16px">
      <thead><tr><th>SKU</th><th>Description</th><th align="right">Qty</th><th align="right">Unit</th><th align="right">Line</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:16px">Subtotal: ${money(order.subtotal)}</p>
    <p>Shipping: ${money(order.shipping)}</p>
    <p>Tax: ${money(order.tax)}</p>
    <p><strong>Total: ${money(order.total)}</strong></p>
    <p style="margin-top:24px;font-size:12px;color:#666">Barkosem vendor invoice (draft) — replace with PDF API.</p>
  `;
}

export function buildPackingSlipHtml(order: VendorOrder) {
  const rows = order.lines
    .map(
      (l) =>
        `<tr><td>${esc(l.sku)}</td><td>${esc(l.name)}</td><td style="text-align:right;font-weight:bold">${l.qty}</td></tr>`
    )
    .join("");
  return `
    <h1>Packing slip</h1>
    <p><strong>${esc(order.reference)}</strong></p>
    <p>Ship to: ${order.shippingAddress ? esc(`${order.shippingAddress.fullName}<br>${order.shippingAddress.streetLine1}${order.shippingAddress.streetLine2 ? `, ${order.shippingAddress.streetLine2}` : ""}<br>${order.shippingAddress.city}${order.shippingAddress.region ? `, ${order.shippingAddress.region}` : ""} ${order.shippingAddress.postalCode}<br>${order.shippingAddress.country}`) : "<em>Address not available</em>"}</p>
    <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;margin-top:16px">
      <thead><tr><th>SKU</th><th>Item</th><th align="right">Qty</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:24px;font-size:12px;color:#666">Check contents before sealing. Barkosem vendor (draft).</p>
  `;
}

export function openPrintableDocument(title: string, innerHtml: string) {
  const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${esc(title)}</title>
    <style>
      body{font-family:system-ui,-apple-system,sans-serif;padding:24px;max-width:720px;margin:0 auto;color:#111}
      @media print { body { padding: 12px } }
    </style></head><body>${innerHtml}</body></html>`;

  const blob = new Blob([doc], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.top = "-9999px";
  iframe.style.left = "-9999px";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.opacity = "0";
  iframe.src = url;

  iframe.onload = () => {
    requestAnimationFrame(() => {
      try {
        iframe.contentWindow?.print();
      } catch {
        // Some browsers block print on cross-origin iframes; fallback to window.open
        window.open(url, "_blank", "noopener,noreferrer");
      }
    });
  };

  document.body.appendChild(iframe);

  // Cleanup blob URL after a reasonable print delay
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    iframe.remove();
  }, 60_000);
}
