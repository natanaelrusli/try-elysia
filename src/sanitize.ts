import DOMPurify from "isomorphic-dompurify";

// Configuration constants
export const CONTENT_MAX_LENGTH = 10 * 1024 * 1024; // 10MB max content size
export const KEY_MAX_LENGTH = 255;
export const TITLE_MAX_LENGTH = 500;
export const EXCERPT_MAX_LENGTH = 1000;
export const SLUG_MAX_LENGTH = 255;

// DOMPurify configuration for WYSIWYG content
// Allows common formatting tags but removes dangerous scripts
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "a",
    "img",
    "code",
    "pre",
    "span",
    "div",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "hr",
  ],
  ALLOWED_ATTR: [
    "href",
    "title",
    "alt",
    "src",
    "width",
    "height",
    "class",
    "id",
    "target",
    "rel",
  ],
  // Explicitly forbid dangerous tags
  FORBID_TAGS: [
    "script",
    "iframe",
    "object",
    "embed",
    "form",
    "input",
    "button",
    "style",
  ],
  // Explicitly forbid dangerous attributes (event handlers, style, etc.)
  FORBID_ATTR: [
    "onerror",
    "onload",
    "onclick",
    "onmouseover",
    "onfocus",
    "onblur",
    "onchange",
    "onsubmit",
    "style",
  ],
  ALLOW_DATA_ATTR: false,
  // Additional security options
  SAFE_FOR_TEMPLATES: false,
  // Sanitize URLs to prevent javascript: and data: protocols
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  // Use DOMPurify to sanitize the HTML
  let sanitized = DOMPurify.sanitize(html, SANITIZE_CONFIG);

  // Additional post-processing to remove any remaining dangerous content
  // Remove javascript: and data: URLs from href and src attributes
  sanitized = sanitized.replace(
    /\s+(href|src)\s*=\s*["']?(javascript|data|vbscript):[^"'\s>]*/gi,
    ""
  );

  // Remove any remaining event handlers that might have slipped through
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");

  // Remove style attributes that might contain javascript: URLs
  sanitized = sanitized.replace(/\s+style\s*=\s*["'][^"']*["']/gi, "");

  // Remove empty anchor tags (those without valid href)
  sanitized = sanitized.replace(
    /<a\s*[^>]*>\s*([^<]*)<\/a>/gi,
    (match, content) => {
      // If the anchor has no href or href was removed, just return the content
      if (!/<a[^>]*href\s*=/i.test(match)) {
        return content;
      }
      return match;
    }
  );

  // Post-process to add security attributes to links
  // Add rel="noopener noreferrer" to external links for security
  sanitized = sanitized.replace(
    /<a\s+([^>]*href\s*=\s*["'][^"']*["'][^>]*)>/gi,
    (match, attrs) => {
      // Skip if href contains javascript: or data: (should already be removed, but double-check)
      if (/href\s*=\s*["']?(javascript|data|vbscript):/i.test(attrs)) {
        return ""; // Remove the entire link if it has dangerous protocol
      }
      // Check if rel attribute already exists
      if (!/rel\s*=/i.test(attrs)) {
        return `<a ${attrs} rel="noopener noreferrer">`;
      }
      // If rel exists but doesn't have noopener, add it
      if (!/rel\s*=\s*["'][^"']*noopener/i.test(attrs)) {
        return match.replace(
          /rel\s*=\s*["']([^"']*)["']/i,
          'rel="$1 noopener noreferrer"'
        );
      }
      return match;
    }
  );

  // Clean up any remaining empty anchor tags
  sanitized = sanitized.replace(/<a\s*>\s*([^<]*)<\/a>/gi, "$1");
  sanitized = sanitized.replace(/<a\s+[^>]*>\s*<\/a>/gi, "");

  return sanitized;
}

/**
 * Validates content length
 * @param content - The content to validate
 * @param maxLength - Maximum allowed length
 * @returns Object with isValid flag and optional error message
 */
export function validateContentLength(
  content: string,
  maxLength: number = CONTENT_MAX_LENGTH
): { isValid: boolean; error?: string } {
  if (typeof content !== "string") {
    return {
      isValid: false,
      error: "Content must be a string",
    };
  }

  if (content.length > maxLength) {
    return {
      isValid: false,
      error: `Content exceeds maximum length of ${maxLength} characters (received ${content.length})`,
    };
  }

  return { isValid: true };
}

/**
 * Validates and sanitizes content for text content endpoints
 * @param content - The content to validate and sanitize
 * @returns Object with sanitized content and validation result
 */
export function validateAndSanitizeContent(content: string): {
  sanitized: string;
  isValid: boolean;
  error?: string;
} {
  // Validate length
  const lengthValidation = validateContentLength(content);
  if (!lengthValidation.isValid) {
    return {
      sanitized: "",
      isValid: false,
      error: lengthValidation.error,
    };
  }

  // Sanitize HTML
  const sanitized = sanitizeHTML(content);

  return {
    sanitized,
    isValid: true,
  };
}

/**
 * Validates string length
 * @param value - The string to validate
 * @param maxLength - Maximum allowed length
 * @param fieldName - Name of the field for error messages
 * @returns Object with isValid flag and optional error message
 */
export function validateStringLength(
  value: string,
  maxLength: number,
  fieldName: string
): { isValid: boolean; error?: string } {
  if (typeof value !== "string") {
    return {
      isValid: false,
      error: `${fieldName} must be a string`,
    };
  }

  if (value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} exceeds maximum length of ${maxLength} characters (received ${value.length})`,
    };
  }

  if (value.length === 0) {
    return {
      isValid: false,
      error: `${fieldName} cannot be empty`,
    };
  }

  return { isValid: true };
}

/**
 * Sanitizes a plain text string (removes HTML tags)
 * @param text - The text to sanitize
 * @returns Sanitized plain text
 */
export function sanitizePlainText(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  // Remove all HTML tags and decode entities
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}
