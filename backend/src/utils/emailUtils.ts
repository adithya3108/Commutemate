// Free/personal email domains that are not work emails
const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'rediffmail.com', 'ymail.com', 'icloud.com', 'protonmail.com',
  'live.com', 'msn.com', 'aol.com', 'mail.com',
]);

export function isWorkEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return !PERSONAL_DOMAINS.has(domain);
}

export function getCompanyFromEmail(email: string): string {
  const domain = email.split('@')[1] || '';
  // Strip common TLDs and return capitalised company name
  return domain
    .replace(/\.(com|in|io|co\.in|org|net)$/, '')
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
