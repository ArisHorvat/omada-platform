export type NewsBlockType =
  | 'paragraph'
  | 'heading'
  | 'bullet'
  | 'numbered'
  | 'blockquote'
  | 'divider'
  | 'link'
  | 'document';

export interface NewsBlock {
  id: string;
  type: NewsBlockType;
  /** Text, markdown link `[label](url)`, or document line after upload. */
  content: string;
  /** When `type === 'heading'`: `1` = `#` (H1), `2` = `##` (H2). Defaults to 2. */
  headingLevel?: 1 | 2;
}

export function createBlock(type: NewsBlockType, opts?: { headingLevel?: 1 | 2 }): NewsBlock {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  if (type === 'link') {
    return { id, type, content: '[Link](https://)' };
  }
  if (type === 'heading') {
    return { id, type, content: '', headingLevel: opts?.headingLevel ?? 2 };
  }
  return { id, type, content: '' };
}

function isBlank(s: string): boolean {
  return !s || s.trim().length === 0;
}

/** Contiguous numbered list index (1-based) for display. */
export function getNumberedDisplayIndex(blocks: NewsBlock[], index: number): number {
  let n = 1;
  for (let i = index - 1; i >= 0; i--) {
    if (blocks[i].type !== 'numbered') break;
    n++;
  }
  return n;
}

export function blocksToMarkdown(blocks: NewsBlock[]): string {
  const parts: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const c = (b.content ?? '').trimEnd();

    if (b.type === 'divider') {
      parts.push('---');
      continue;
    }

    if (b.type === 'numbered') {
      if (!isBlank(c)) {
        parts.push(`${getNumberedDisplayIndex(blocks, i)}. ${c}`.trim());
      }
      continue;
    }

    if (b.type === 'heading') {
      if (!isBlank(c)) {
        const level = b.headingLevel ?? 2;
        const prefix = level === 1 ? '# ' : '## ';
        parts.push(`${prefix}${c}`.trim());
      }
      continue;
    }
    if (b.type === 'bullet') {
      if (!isBlank(c)) parts.push(`- ${c}`.trim());
      continue;
    }
    if (b.type === 'blockquote') {
      if (!isBlank(c)) {
        const lines = c.split('\n');
        for (const line of lines) {
          if (line.trim()) parts.push(`> ${line.trim()}`);
        }
      }
      continue;
    }
    if (b.type === 'paragraph' || b.type === 'link' || b.type === 'document') {
      if (!isBlank(c)) parts.push(c);
    }
  }

  return parts.join('\n\n').trim();
}
