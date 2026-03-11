import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-razorpay-signature');
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!signature || !secret) {
            console.error('Razorpay webhook signature or secret missing');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== signature) {
            console.error('Invalid Razorpay webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const event = JSON.parse(body);
        console.log('Razorpay Webhook Event:', event.event);

        const supabase = createServerClient();

        // 2. Handle specific events
        switch (event.event) {
            case 'order.paid':
            case 'payment.captured': {
                const payload = event.payload.payment?.entity || event.payload.order?.entity;
                const receipt = payload.receipt; // Format: receipt_USERID_TIMESTAMP

                if (receipt && receipt.startsWith('receipt_')) {
                    const userId = receipt.split('_')[1];

                    // Calculate period end (30 days)
                    const currentPeriodEnd = new Date();
                    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

                    const { error } = await supabase
                        .from('user_subscriptions')
                        .upsert({
                            user_id: userId,
                            plan_id: 'premium',
                            status: 'active',
                            current_period_end: currentPeriodEnd.toISOString(),
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id' });

                    if (error) {
                        console.error('Failed to update subscription via webhook:', error);
                    } else {
                        console.log(`Successfully upgraded user ${userId} to premium via webhook`);
                    }
                }
                break;
            }

            case 'subscription.charged': {
                const subscription = event.payload.subscription.entity;
                const userId = subscription.notes?.userId;

                if (userId) {
                    const currentPeriodEnd = new Date(subscription.current_end * 1000);

                    await supabase
                        .from('user_subscriptions')
                        .update({
                            status: 'active',
                            current_period_end: currentPeriodEnd.toISOString(),
                            updated_at: new Date().toISOString()
                        })
                        .eq('user_id', userId);
                }
                break;
            }

            case 'subscription.cancelled':
            case 'subscription.halted': {
                const subscription = event.payload.subscription.entity;
                const userId = subscription.notes?.userId;

                if (userId) {
                    await supabase
                        .from('user_subscriptions')
                        .update({
                            status: 'canceled',
                            updated_at: new Date().toISOString()
                        })
                        .eq('user_id', userId);
                }
                break;
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Razorpay webhook error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
