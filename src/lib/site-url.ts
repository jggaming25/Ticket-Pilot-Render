function looksLocal(host: string): boolean {
  return (
    /^localhost(:|$)/i.test(host) ||
    /^127\.0\.0\.1(:|$)/.test(host) ||
    /^0\.0\.0\.0(:|$)/.test(host) ||
    /^\[::1\](:|$)/.test(host) ||
    /:\d{4,5}$/.test(host)
  );
}

export function getPublicBaseUrl(reqHost?: string | null): string {
  const candidates = [
    process.env.PUBLIC_SITE_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ];

  for (const cand of candidates) {
    if (cand && /^https?:\/\//.test(cand)) {
      try {
        new URL("/", cand);
        return cand.replace(/\/+$/, "");
      } catch {
        // weiter
      }
    }
  }

  if (reqHost && !looksLocal(reqHost)) {
    const clean = reqHost.replace(/^https?:\/\//, "");
    return `https://${clean}`;
  }

  return "http://localhost:3000";
}