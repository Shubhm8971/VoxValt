import { addDays, addWeeks, addMonths, format } from 'date-fns';
import { extractTimeFromText, combineDateAndTime } from './time-extractor';

export interface DateExtraction {
  date: string | null; // YYYY-MM-DDTHH:mm:00Z format (ISO with time) or YYYY-MM-DD (date only)
  time: string | null; // HH:mm format (24-hour)
  confidence: 'high' | 'medium' | 'low';
  original: string;
}

export function extractDateFromText(text: string): DateExtraction {
  const textLower = text.toLowerCase().trim();
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  // Extract time first
  const timeExtraction = extractTimeFromText(text);

  // TOMORROW
  if (/\btomorrow\b/.test(textLower)) {
    const dateStr = format(tomorrow, 'yyyy-MM-dd');
    const datetime = combineDateAndTime(dateStr, timeExtraction.time);
    return {
      date: datetime || dateStr,
      time: timeExtraction.time,
      confidence: 'high',
      original: text,
    };
  }

  // TODAY / TONIGHT
  if (/\b(today|tonight)\b/.test(textLower)) {
    const dateStr = format(today, 'yyyy-MM-dd');
    const datetime = combineDateAndTime(dateStr, timeExtraction.time);
    return {
      date: datetime || dateStr,
      time: timeExtraction.time,
      confidence: 'high',
      original: text,
    };
  }

  // NEXT [DAY OF WEEK]
  const dayPattern = /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
  const dayMatch = textLower.match(dayPattern);
  if (dayMatch) {
    const dayName = dayMatch[1].toLowerCase();
    const targetDay = dayNameToNumber(dayName);
    const nextDate = getNextDayOfWeek(today, targetDay);
    const dateStr = format(nextDate, 'yyyy-MM-dd');
    const datetime = combineDateAndTime(dateStr, timeExtraction.time);
    return {
      date: datetime || dateStr,
      time: timeExtraction.time,
      confidence: 'high',
      original: text,
    };
  }

  // NEXT WEEK
  if (/\bnext\s+week\b/.test(textLower)) {
    const dateStr = format(addWeeks(today, 1), 'yyyy-MM-dd');
    const datetime = combineDateAndTime(dateStr, timeExtraction.time);
    return {
      date: datetime || dateStr,
      time: timeExtraction.time,
      confidence: 'medium',
      original: text,
    };
  }

  // IN X DAYS/WEEKS/MONTHS
  const inPattern = /\bin\s+(\d+)\s+(day|week|month)s?\b/i;
  const inMatch = textLower.match(inPattern);
  if (inMatch) {
    const amount = parseInt(inMatch[1]);
    const unit = inMatch[2].toLowerCase();
    let targetDate = today;

    if (unit === 'day') targetDate = addDays(today, amount);
    else if (unit === 'week') targetDate = addWeeks(today, amount);
    else if (unit === 'month') targetDate = addMonths(today, amount);

    const dateStr = format(targetDate, 'yyyy-MM-dd');
    const datetime = combineDateAndTime(dateStr, timeExtraction.time);
    return {
      date: datetime || dateStr,
      time: timeExtraction.time,
      confidence: 'high',
      original: text,
    };
  }

  // BY [DAY OF WEEK]
  const byPattern = /\bby\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
  const byMatch = textLower.match(byPattern);
  if (byMatch) {
    const dayName = byMatch[1].toLowerCase();
    const targetDay = dayNameToNumber(dayName);
    const nextDate = getNextDayOfWeek(today, targetDay);
    const dateStr = format(nextDate, 'yyyy-MM-dd');
    const datetime = combineDateAndTime(dateStr, timeExtraction.time);
    return {
      date: datetime || dateStr,
      time: timeExtraction.time,
      confidence: 'medium',
      original: text,
    };
  }

  // No date found
  return {
    date: null,
    time: timeExtraction.time,
    confidence: 'low',
    original: text,
  };
}

function dayNameToNumber(dayName: string): number {
  const days: { [key: string]: number } = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  return days[dayName] || 0;
}

function getNextDayOfWeek(from: Date, dayOfWeek: number): Date {
  const date = new Date(from);
  const day = date.getDay();
  const diff = dayOfWeek - day;

  // If it's today, get next week's version
  if (diff <= 0) {
    date.setDate(date.getDate() + (diff === 0 ? 7 : diff + 7));
  } else {
    date.setDate(date.getDate() + diff);
  }

  date.setHours(0, 0, 0, 0);
  return date;
}
