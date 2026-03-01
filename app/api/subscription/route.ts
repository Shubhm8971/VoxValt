import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyAuth(request);
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' } as ApiResponse<null>,
                { status: 401 }
            );
        }

        const plan = await getUserSubscriptionPlan(user.id);

        return NextResponse.json({
            success: true,
            data: plan,
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: (error as Error).message } as ApiResponse<null>,
            { status: 500 }
        );
    }
}
