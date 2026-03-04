export const sanitizeQuery = (query) => {
  if (!query || typeof query !== 'object') return query;
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(query)) {
    // Remove dangerous operators
    if (key.startsWith('$') && !['$eq', '$in', '$nin'].includes(key)) {
      continue;
    }
    
    // Sanitize string values
    if (typeof value === 'string') {
      sanitized[key] = value.replace(/['"\\]/g, '');
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v => 
        typeof v === 'string' ? v.replace(/['"\\]/g, '') : v
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

export const escapeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
    switch (char) {
      case "\0": return "\\0";
      case "\x08": return "\\b";
      case "\x09": return "\\t";
      case "\x1a": return "\\z";
      case "\n": return "\\n";
      case "\r": return "\\r";
      case "\"":
      case "'":
      case "\\":
      case "%": return "\\" + char;
      default: return char;
    }
  });
};