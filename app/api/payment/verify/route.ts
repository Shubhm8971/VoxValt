import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { createServerClient } from '@/lib/supabase';
import crypto from 'crypto';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const user = await verifyAuth(request);
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' } as ApiResponse<null>,
                { status: 401 }
            );
        }

        const body = await request.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
        }

        // Verify signature
        const shasum = crypto.createHmac('sha256', secret);
        shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const digest = shasum.digest('hex');

        if (digest !== razorpay_signature) {
            return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
        }

        // Signature is valid. Update database.
        const supabase = createServerClient();

        // Calculate current period end (e.g., 30 days from now)
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

        // Use upsert to create or update the subscription
        const { error } = await supabase
            .from('user_subscriptions')
            .upsert({
                user_id: user.id,
                plan_id: 'premium_monthly',
                status: 'active',
                current_period_end: currentPeriodEnd.toISOString(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) {
            console.error("Failed to update subscription in DB:", error);
            return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: { status: 'active' } });

    } catch (error) {
        console.error("Error verifying payment:", error);
        return NextResponse.json(
            { success: false, error: (error as Error).message } as ApiResponse<null>,
            { status: 500 }
        );
    }
}
