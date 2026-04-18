const friendlyMap: Record<string, string> = {
  'github.com': 'GitHub',
  'mail.google.com': 'Gmail',
  'docs.google.com': 'Google Docs',
  'drive.google.com': 'Google Drive',
  'chatgpt.com': 'ChatGPT',
  'claude.ai': 'Claude',
  'x.com': 'X',
  'www.youtube.com': 'YouTube',
  'localhost': 'Localhost',
  'local-files': 'Local Files'
};

export function friendlyDomain(hostname: string): string {
  if (!hostname) return '';
  if (friendlyMap[hostname]) return friendlyMap[hostname];

  return hostname
    .replace(/^www\./, '')
    .replace(/\.(com|org|net|io|ai|dev|app|co|me|so)$/, '')
    .split('.')
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : '')
    .join(' ');
}

export function stripTitleNoise(title: string): string {
  return title
    .replace(/^\(\d+\+?\)\s*/, '')
    .replace(/\s*\([\d,]+\+?\)\s*/g, ' ')
    .replace(/\s+on X:\s*/, ': ')
    .replace(/\s*\/\s*X\s*$/, '')
    .trim();
}

export function cleanTitle(title: string, hostname: string): string {
  const normalized = stripTitleNoise(title);
  const domain = hostname.replace(/^www\./, '').toLowerCase();

  for (const separator of [' - ', ' | ', ' — ', ' · ', ' – ']) {
    const index = normalized.lastIndexOf(separator);
    if (index === -1) continue;
    const suffix = normalized.slice(index + separator.length).trim().toLowerCase();
    if (suffix === domain) return normalized.slice(0, index).trim();
  }

  return normalized;
}

export function smartTitle(title: string, url: string): string {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parsed.hostname === 'github.com' && parts.length >= 2) {
      const [owner, repo, section, sectionId] = parts;
      if (section === 'pull' && sectionId) return `${owner}/${repo} PR #${sectionId}`;
      if (section === 'issues' && sectionId) return `${owner}/${repo} Issue #${sectionId}`;
    }
    if (parsed.hostname === 'x.com' && parsed.pathname.includes('/status/')) {
      const handle = parts[0];
      if (handle && (!title || title === url)) return `Post by @${handle}`;
    }
  } catch {
    return title || url;
  }

  return title || url;
}
