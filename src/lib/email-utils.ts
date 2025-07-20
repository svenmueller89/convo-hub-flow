// Email parsing utilities for handling MIME headers and content

/**
 * Decode Base64 encoded MIME header
 */
function decodeBase64Header(encoded: string): string {
  try {
    return atob(encoded);
  } catch {
    return encoded;
  }
}

/**
 * Decode quoted-printable encoded text
 */
function decodeQuotedPrintable(encoded: string): string {
  return encoded
    .replace(/=([A-F0-9]{2})/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/=\r?\n/g, '');
}

/**
 * Decode MIME encoded header value
 */
export function decodeMimeHeader(header: string): string {
  if (!header) return '';
  
  // Handle =?charset?encoding?encoded-text?= format
  return header.replace(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/gi, (match, charset, encoding, encoded) => {
    try {
      if (encoding.toUpperCase() === 'B') {
        return decodeBase64Header(encoded);
      } else if (encoding.toUpperCase() === 'Q') {
        return decodeQuotedPrintable(encoded.replace(/_/g, ' '));
      }
    } catch {
      // If decoding fails, return original
    }
    return match;
  });
}

/**
 * Parse IMAP envelope address format to extract email and name
 */
export function parseEmailAddress(rawAddress: string): { name: string; email: string } {
  if (!rawAddress) {
    return { name: 'Unknown Sender', email: '' };
  }

  // Handle IMAP envelope format: (("Name" NIL "user" "domain.com"))
  const envelopeMatch = rawAddress.match(/\(\("([^"]*?)"\s+NIL\s+"([^"]*?)"\s+"([^"]*?)"\)/);
  if (envelopeMatch) {
    const [, rawName, user, domain] = envelopeMatch;
    const name = decodeMimeHeader(rawName) || `${user}@${domain}`;
    const email = `${user}@${domain}`;
    return { name, email };
  }

  // Handle standard format: "Name" <email@domain.com>
  const standardMatch = rawAddress.match(/^"?([^"<]+)"?\s*<([^>]+)>$/);
  if (standardMatch) {
    const [, name, email] = standardMatch;
    return { 
      name: decodeMimeHeader(name.trim()), 
      email: email.trim() 
    };
  }

  // Handle just email format
  const emailMatch = rawAddress.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    return { name: emailMatch[1], email: emailMatch[1] };
  }

  // Fallback: try to decode any MIME headers in the raw string
  const decoded = decodeMimeHeader(rawAddress);
  return { name: decoded || 'Unknown Sender', email: '' };
}

/**
 * Extract readable text content from MIME multipart body
 */
export function extractEmailContent(rawBody: string): string {
  if (!rawBody) return '';

  // Handle multipart content
  if (rawBody.includes('Content-Type: text/plain')) {
    // Extract text/plain part
    const textPlainMatch = rawBody.match(/Content-Type: text\/plain[^]*?Content-Transfer-Encoding: ([^\r\n]+)[^]*?\r?\n\r?\n([^]*?)(?=--|\r?\n\r?\nContent-Type|\r?\n\r?\n$)/);
    if (textPlainMatch) {
      const [, encoding, content] = textPlainMatch;
      let decodedContent = content.trim();
      
      if (encoding.includes('quoted-printable')) {
        decodedContent = decodeQuotedPrintable(decodedContent);
      }
      
      return decodedContent;
    }
  }

  // Handle HTML content if no plain text found
  if (rawBody.includes('Content-Type: text/html')) {
    const htmlMatch = rawBody.match(/Content-Type: text\/html[^]*?Content-Transfer-Encoding: ([^\r\n]+)[^]*?\r?\n\r?\n([^]*?)(?=--|\r?\n\r?\nContent-Type|\r?\n\r?\n$)/);
    if (htmlMatch) {
      const [, encoding, content] = htmlMatch;
      let decodedContent = content.trim();
      
      if (encoding.includes('quoted-printable')) {
        decodedContent = decodeQuotedPrintable(decodedContent);
      }
      
      // Strip HTML tags for plain text display
      return decodedContent.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
    }
  }

  // Fallback: return raw body with some cleanup
  return rawBody.replace(/--[a-zA-Z0-9]+/g, '').replace(/Content-[^:]+:[^\r\n]+/g, '').trim();
}