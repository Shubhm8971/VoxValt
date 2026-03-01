import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import Razorpay from 'razorpay';
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

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.error("Razorpay keys not found in environment variables.");
            return NextResponse.json(
                { success: false, error: 'Payment gateway not configured' } as ApiResponse<null>,
                { status: 500 }
            );
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        // Premium Plan: ₹299 per month
        // Amount must be in the smallest currency unit (paise for INR)
        const options = {
            amount: 29900,
            currency: "INR",
            receipt: `receipt_${user.id}_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({
            success: true,
            data: {
                id: order.id,
                amount: order.amount,
                currency: order.currency
            },
        });

    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        return NextResponse.json(
            { success: false, error: (error as Error).message } as ApiResponse<null>,
            { status: 500 }
        );
    }
}
