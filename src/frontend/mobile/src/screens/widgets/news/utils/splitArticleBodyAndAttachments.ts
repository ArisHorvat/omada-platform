const ATTACHMENT_BLOCK_SEP = '\n\n---\n\n';
const LINK_LINE = /^\s*\[([^\]]+)\]\(([^)]+)\)\s*$/;

export type ParsedArticleAttachment = { name: string; url: string };

/**
 * Composer appends `\n\n---\n\n` then one `[name](url)` per line for file attachments.
 * Uses the last such block only when every non-empty tail line is a single markdown link
 * (so internal `---` dividers in the body are not mistaken for the attachment section).
 */
export function splitArticleBodyAndAttachments(content: string): {
  body: string;
  attachments: ParsedArticleAttachment[];
} {
  const idx = content.lastIndexOf(ATTACHMENT_BLOCK_SEP);
  if (idx < 0) {
    return { body: content, attachments: [] };
  }

  const tail = content.slice(idx + ATTACHMENT_BLOCK_SEP.length).trim();
  if (!tail) {
    return { body: content, attachments: [] };
  }

  const lines = tail.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) {
    return { body: content, attachments: [] };
  }

  const attachments: ParsedArticleAttachment[] = [];
  for (const line of lines) {
    const m = line.match(LINK_LINE);
    if (!m) {
      return { body: content, attachments: [] };
    }
    attachments.push({ name: m[1].trim(), url: m[2].trim() });
  }

  const body = content.slice(0, idx).trimEnd();
  return { body, attachments };
}
