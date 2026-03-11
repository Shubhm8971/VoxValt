/**
 * Time Extraction Module
 * Extracts times from natural language text
 * Returns time in HH:mm format (24-hour)
 */

export interface TimeExtraction {
  time: string | null; // HH:mm format (24-hour)
  confidence: 'high' | 'medium' | 'low';
  original: string;
}

export function extractTimeFromText(text: string): TimeExtraction {
  const lowerText = text.toLowerCase();
  let matchedTime: string | null = null;
  let confidence: 'high' | 'medium' | 'low' = 'low';

  // High confidence patterns - specific times
  
  // Pattern: "at X:XX am/pm" or "at Xpm" or "at X am"
  const timePattern = /at\s+(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)|at\s+(\d{1,2})\s*(am|pm|AM|PM)/gi;
  const timeMatch = timePattern.exec(text);
  
  if (timeMatch) {
    let hours = parseInt(timeMatch[1] || timeMatch[4]);
    const minutes = parseInt(timeMatch[2] || '0');
    const period = (timeMatch[3] || timeMatch[5] || '').toLowerCase();

    // Convert to 24-hour format
    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }

    matchedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    confidence = 'high';
    return { time: matchedTime, confidence, original: text };
  }

  // Medium confidence patterns - time of day
  const timeOfDayPatterns = [
    { pattern: /morning/i, time: '09:00' },
    { pattern: /afternoon/i, time: '14:00' },
    { pattern: /evening/i, time: '18:00' },
    { pattern: /night|tonight/i, time: '20:00' },
    { pattern: /noon|midday/i, time: '12:00' },
    { pattern: /midnight/i, time: '00:00' },
    { pattern: /dawn|sunrise/i, time: '06:00' },
    { pattern: /dusk|sunset/i, time: '18:00' },
  ];

  for (const { pattern, time } of timeOfDayPatterns) {
    if (pattern.test(lowerText)) {
      matchedTime = time;
      confidence = 'medium';
      return { time: matchedTime, confidence, original: text };
    }
  }

  // Common abbreviations
  const abbreviations: Record<string, string> = {
    'eod': '17:00',
    'end of day': '17:00',
    'asap': '09:00',
    'immediately': '09:00',
    'urgent': '09:00',
  };

  for (const [key, time] of Object.entries(abbreviations)) {
    if (lowerText.includes(key)) {
      matchedTime = time;
      confidence = 'medium';
      return { time: matchedTime, confidence, original: text };
    }
  }

  // No time found
  return { time: null, confidence: 'low', original: text };
}

/**
 * Combine date and time into a single timestamp
 * Returns ISO format: YYYY-MM-DDTHH:mm:00Z
 */
export function combineDateAndTime(date: string | null, time: string | null): string | null {
  if (!date) return null;

  // If no time specified, use noon as default
  const timeToUse = time || '12:00';

  // date format: YYYY-MM-DD
  // time format: HH:mm
  // result: YYYY-MM-DDTHH:mm:00Z
  try {
    const dateTime = `${date}T${timeToUse}:00Z`;
    const parsed = new Date(dateTime);
    
    // Validate the date is valid
    if (isNaN(parsed.getTime())) {
      return null;
    }
    
    return dateTime;
  } catch {
    return null;
  }
}

/**
 * Example usage:
 * 
 * const time = extractTimeFromText("meeting at 2:30pm tomorrow");
 * // { time: "14:30", confidence: "high", original: "..." }
 * 
 * const datetime = combineDateAndTime("2026-02-13", time.time);
 * // "2026-02-13T14:30:00Z"
 */
