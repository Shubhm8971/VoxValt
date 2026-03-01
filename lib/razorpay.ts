import Razorpay from 'razorpay';
import crypto from 'crypto';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'INR',
    interval: 'month' as const,
    features: [
      '7-day task history',
      'Basic voice recording',
      'Local storage only',
      '5 recordings per month'
    ],
    limits: {
      recordingsPerMonth: 5,
      storageDays: 7,
      cloudSync: false,
    }
  },
  PREMIUM: {
    id: 'premium_monthly',
    name: 'Premium',
    price: 9900, // ₹99.00 in paise
    currency: 'INR',
    interval: 'month' as const,
    features: [
      'Unlimited voice recordings',
      'Unlimited task history',
      'Cloud sync across devices',
      'Advanced search & filters',
      'Calendar integration',
      'Priority support'
    ],
    limits: {
      recordingsPerMonth: -1, // unlimited
      storageDays: -1, // forever
      cloudSync: true,
    }
  },
  TEAM: {
    id: 'team_monthly',
    name: 'Team',
    price: 29900, // ₹299.00 in paise
    currency: 'INR',
    interval: 'month' as const,
    features: [
      'Everything in Premium',
      'Shared team workspace',
      'Team collaboration',
      'Admin dashboard',
      'Team analytics',
      'Priority support'
    ],
    limits: {
      recordingsPerMonth: -1,
      storageDays: -1,
      cloudSync: true,
      teamMembers: 10,
    }
  },
  PREMIUM_YEARLY: {
    id: 'premium_yearly',
    name: 'Premium (Yearly)',
    price: 99000, // ₹990/year (save 20%)
    currency: 'INR',
    interval: 'year' as const,
    features: [
      'Unlimited voice recordings',
      'Unlimited task history',
      'Cloud sync across devices',
      'Advanced search & filters',
      'Calendar integration',
      'Priority support',
      'Save 20% vs monthly'
    ],
    limits: {
      recordingsPerMonth: -1,
      storageDays: -1,
      cloudSync: true,
    }
  },
  TEAM_YEARLY: {
    id: 'team_yearly',
    name: 'Team (Yearly)',
    price: 299000, // ₹2990/year (save 20%)
    currency: 'INR',
    interval: 'year' as const,
    features: [
      'Everything in Premium',
      'Shared team workspace',
      'Team collaboration',
      'Admin dashboard',
      'Team analytics',
      'Priority support',
      'Save 20% vs monthly'
    ],
    limits: {
      recordingsPerMonth: -1,
      storageDays: -1,
      cloudSync: true,
      teamMembers: 10,
    }
  }
};

export interface Subscription {
  id: string;
  userId: string;
  plan: keyof typeof PLANS;
  status: 'active' | 'canceled' | 'expired';
  startDate: Date;
  endDate: Date;
  razorpaySubscriptionId?: string;
  razorpayPaymentId?: string;
}

export async function createRazorpayOrder(planId: string, userId: string) {
  const plan = Object.values(PLANS).find(p => p.id === planId);
  if (!plan || plan.price === 0) {
    throw new Error('Invalid plan selected');
  }

  const order = await razorpay.orders.create({
    amount: plan.price,
    currency: plan.currency,
    receipt: `receipt_${userId}_${Date.now()}`,
    notes: {
      userId,
      planId,
    },
  });

  return order;
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
}

export async function createSubscriptionPlan(planId: string) {
  const plan = Object.values(PLANS).find(p => p.id === planId);
  if (!plan || plan.price === 0) {
    throw new Error('Invalid plan for subscription');
  }

  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: plan.interval === 'year' ? 12 : 12, // 12 months
    quantity: 1,
    customer_notify: 1,
    notes: {
      planId,
    },
  });

  return subscription;
}
