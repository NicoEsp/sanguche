export function maskEmail(email: string | null | undefined): string {
  if (!email) return 'N/A';
  const [local, domain] = email.split('@');
  if (!domain || !local) return '***';
  const head = local.length <= 2 ? local[0] ?? '' : local.slice(0, 2);
  return `${head}***@${domain}`;
}

export function maskName(name: string | null | undefined): string {
  if (!name) return 'N/A';
  const trimmed = name.trim();
  if (trimmed.length <= 1) return '***';
  return `${trimmed[0]}***`;
}
