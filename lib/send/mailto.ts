export function buildMailtoUrl(
  to: string,
  subject: string,
  body: string
): string {
  return (
    `mailto:${to}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`
  );
}
