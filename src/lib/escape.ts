export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const URL_RE = /(https?:\/\/[^\s<"']+)/g;

/** Escapa e transforma http/https em links seguros (rel noopener). Outros protocolos ficam texto. */
export function linkify(s: unknown): string {
  const safe = esc(s);
  return safe.replace(URL_RE, (url) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>`);
}