/**
 * HTML sanitization utilities
 * Prevents XSS attacks while preserving safe formatting
 */

// Allowed HTML tags for rich text formatting
const ALLOWED_TAGS = [
  'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'code',
  'ul', 'ol', 'li', 'p', 'br', 'div', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
];

// Allowed attributes (with tag-specific rules)
const ALLOWED_ATTRIBUTES: { [key: string]: string[] } = {
  'span': ['style'], // Only allow style on span for colors/fonts
  'div': [],
  'p': [],
};

const ALLOWED_STYLES = ['color', 'font-size', 'background-color'];

/**
 * Sanitize HTML content to prevent XSS while preserving formatting
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  const temp = document.createElement('div');
  temp.innerHTML = html;

  sanitizeNode(temp);

  return temp.innerHTML;
}

/**
 * Recursively sanitize a DOM node and its children
 */
function sanitizeNode(node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) {
    return;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    if (!ALLOWED_TAGS.includes(tagName)) {
      const parent = element.parentNode;
      if (parent) {
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
      }
      return;
    }

    sanitizeAttributes(element);

    const children = Array.from(element.childNodes);
    children.forEach(child => sanitizeNode(child));
  }
}

/**
 * Sanitize element attributes
 */
function sanitizeAttributes(element: HTMLElement): void {
  const tagName = element.tagName.toLowerCase();
  const allowedAttrs = ALLOWED_ATTRIBUTES[tagName] || [];

  const attrs = Array.from(element.attributes);
  attrs.forEach(attr => {
    if (!allowedAttrs.includes(attr.name)) {
      element.removeAttribute(attr.name);
    }
  });

  if (element.hasAttribute('style')) {
    sanitizeStyle(element);
  }
}

/**
 * Sanitize inline styles
 */
function sanitizeStyle(element: HTMLElement): void {
  const style = element.style;
  const allowedStyles: { [key: string]: string } = {};

  ALLOWED_STYLES.forEach(prop => {
    const value = style.getPropertyValue(prop);
    if (value) {
      if (prop === 'color' || prop === 'background-color') {
        if (isValidColor(value)) {
          allowedStyles[prop] = value;
        }
      } else {
        allowedStyles[prop] = value;
      }
    }
  });

  element.removeAttribute('style');

  Object.entries(allowedStyles).forEach(([prop, value]) => {
    element.style.setProperty(prop, value);
  });
}

/**
 * Validate color value (prevent javascript: URLs)
 */
function isValidColor(value: string): boolean {
  const cleaned = value.trim().toLowerCase();

  if (cleaned.includes('javascript:') || cleaned.includes('data:')) {
    return false;
  }

  const validPatterns = [
    /^#[0-9a-f]{3,8}$/i,           // Hex colors
    /^rgba?\([^)]+\)$/i,            // RGB/RGBA
    /^hsla?\([^)]+\)$/i,            // HSL/HSLA
    /^[a-z]+$/i,                    // Named colors (red, blue, etc.)
  ];

  return validPatterns.some(pattern => pattern.test(cleaned));
}
