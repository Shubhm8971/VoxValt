import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        access_type: 'offline', // Request refresh token
        response_type: 'code',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ].join(' '),
    };

    const qs = new URLSearchParams(options);
    return NextResponse.redirect(`${rootUrl}?${qs.toString()}`);
}
