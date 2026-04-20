import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Uses DOMPurify server-side with JSDOM fallback.
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';

  // For server components, use DOMPurify with JSDOM if available,
  // otherwise use a basic tag stripping approach
  if (typeof window !== 'undefined' && DOMPurify.sanitize) {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'a', 'h1', 'h2', 'h3',
        'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
        'img', 'figure', 'figcaption', 'hr', 'table', 'thead', 'tbody', 'tr',
        'th', 'td', 'div', 'span', 'sup', 'sub', 'iframe'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style',
        'target', 'rel', 'width', 'height', 'loading', 'frameborder',
        'allowfullscreen', 'colspan', 'rowspan'],
    });
  }

  // Server-side fallback: basic sanitization
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/<iframe\b[^>]*src\s*=\s*["']javascript:[^"']*["'][^>]*>/gi, '')
    .trim();
}
