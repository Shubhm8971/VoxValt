import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

/**
 * Initialize OAuth2 client for Google Calendar
 */
export function getOAuth2Client() {
  const redirectUrl = process.env.NEXT_PUBLIC_GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/calendar/callback';
  
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID || '',
    process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUrl
  );
}

/**
 * Generate Google OAuth consent screen URL
 */
export function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent screen every time
  });

  return authUrl;
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw new Error('Failed to get tokens from authorization code');
  }
}

/**
 * Create a calendar event from task data
 */
export async function createCalendarEvent(
  accessToken: string,
  taskData: {
    title: string;
    description?: string;
    due_date?: string;
    task_type?: string;
  }
) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Parse due date to create event
  let eventData: any = {
    summary: taskData.title,
    description: taskData.description || `Task type: ${taskData.task_type || 'task'}`,
  };

  // If we have a due date, set it
  if (taskData.due_date) {
    const dueDate = new Date(taskData.due_date);
    
    // If due_date includes time (ISO format with T), use dateTime
    if (taskData.due_date.includes('T')) {
      eventData.start = {
        dateTime: taskData.due_date,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      eventData.end = {
        dateTime: new Date(dueDate.getTime() + 3600000).toISOString(), // 1 hour duration
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    } else {
      // All-day event
      eventData.start = {
        date: taskData.due_date.split('T')[0],
      };
      eventData.end = {
        date: taskData.due_date.split('T')[0],
      };
    }
  }

  try {
    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventData,
    });

    return {
      eventId: event.data.id,
      eventLink: event.data.htmlLink,
      success: true,
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error('Failed to create calendar event');
  }
}

/**
 * Get list of calendars for the user
 */
export async function getUserCalendars(accessToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const calendars = await calendar.calendarList.list();
    return calendars.data.items || [];
  } catch (error) {
    console.error('Error getting calendars:', error);
    throw new Error('Failed to get calendars');
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(accessToken: string, eventId: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw new Error('Failed to delete calendar event');
  }
}

/**
 * Verify and refresh access token if needed
 */
export async function verifyAndRefreshToken(accessToken: string, refreshToken?: string) {
  const oauth2Client = getOAuth2Client();
  
  if (refreshToken) {
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  return { access_token: accessToken };
}
