/**
 * HTML sanitization utilities
 * Prevents XSS attacks while preserving safe formatting
 */

// Allowed HTML tags for rich text formatting
const ALLOWED_TAGS = [
  'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'code',
  'ul', 'ol', 'li', 'p', 'br', 'div', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
];

// Allowed attributes (with tag-specific rules)
const ALLOWED_ATTRIBUTES: { [key: string]: string[] } = {
  'span': ['style'], // Only allow style on span for colors/fonts
  'div': [],
  'p': [],
};

// Allowed style properties
const ALLOWED_STYLES = ['color', 'font-size', 'background-color'];

/**
 * Sanitize HTML content to prevent XSS while preserving formatting
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Recursively sanitize all nodes
  sanitizeNode(temp);

  return temp.innerHTML;
}

/**
 * Recursively sanitize a DOM node and its children
 */
function sanitizeNode(node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) {
    // Text nodes are safe
    return;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    // Remove disallowed tags but keep their content
    if (!ALLOWED_TAGS.includes(tagName)) {
      const parent = element.parentNode;
      if (parent) {
        // Move all children up
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
      }
      return;
    }

    // Sanitize attributes
    sanitizeAttributes(element);

    // Recursively sanitize children
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

  // Remove all attributes not in allowlist
  const attrs = Array.from(element.attributes);
  attrs.forEach(attr => {
    if (!allowedAttrs.includes(attr.name)) {
      element.removeAttribute(attr.name);
    }
  });

  // Sanitize style attribute if present
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

  // Extract only allowed styles
  ALLOWED_STYLES.forEach(prop => {
    const value = style.getPropertyValue(prop);
    if (value) {
      // Additional validation for colors (prevent javascript: URLs)
      if (prop === 'color' || prop === 'background-color') {
        if (isValidColor(value)) {
          allowedStyles[prop] = value;
        }
      } else {
        allowedStyles[prop] = value;
      }
    }
  });

  // Clear all styles
  element.removeAttribute('style');

  // Re-apply only allowed styles
  Object.entries(allowedStyles).forEach(([prop, value]) => {
    element.style.setProperty(prop, value);
  });
}

/**
 * Validate color value (prevent javascript: URLs)
 */
function isValidColor(value: string): boolean {
  // Remove whitespace
  const cleaned = value.trim().toLowerCase();

  // Block javascript: and other dangerous protocols
  if (cleaned.includes('javascript:') || cleaned.includes('data:')) {
    return false;
  }

  // Allow hex colors, rgb/rgba, hsl/hsla, and named colors
  const validPatterns = [
    /^#[0-9a-f]{3,8}$/i,           // Hex colors
    /^rgba?\([^)]+\)$/i,            // RGB/RGBA
    /^hsla?\([^)]+\)$/i,            // HSL/HSLA
    /^[a-z]+$/i,                    // Named colors (red, blue, etc.)
  ];

  return validPatterns.some(pattern => pattern.test(cleaned));
}

/**
 * Strip all HTML tags (for preview/search)
 */
export function stripHtml(html: string): string {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}
