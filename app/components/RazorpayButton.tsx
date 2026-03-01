'use client';

import { useState } from 'react';
import Script from 'next/script';

interface RazorpayButtonProps {
  planId: string;
  planName: string;
  price: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function RazorpayButton({
  planId,
  planName,
  price,
  onSuccess,
  onError,
  disabled = false,
  loading = false,
}: RazorpayButtonProps) {
  const [isLoading, setIsLoading] = useState(loading);

  const handlePayment = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);

    try {
      // Create order
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      const { orderId, amount, currency, key } = await response.json();

      if (!orderId) {
        throw new Error('Failed to create payment order');
      }

      // Initialize Razorpay
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'Voxvalt',
        description: `${planName} Subscription`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planId,
              }),
            });

            const { success, subscription } = await verifyResponse.json();

            if (success) {
              onSuccess();
            } else {
              onError('Payment verification failed');
            }
          } catch (error) {
            onError('Payment verification failed');
          }
        },
        prefill: {
          name: '', // Will be filled from user profile
          email: '', // Will be filled from user profile
          contact: '', // Will be filled from user profile
        },
        theme: {
          color: '#3B82F6',
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
            onError('Payment cancelled');
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      onError('Failed to initiate payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <button
        onClick={handlePayment}
        disabled={disabled || isLoading}
        className={`
          w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300
          ${disabled || isLoading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
          }
          ${isLoading ? 'opacity-75 cursor-wait' : ''}
        `}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : (
          `Pay ₹${price / 100}`
        )}
      </button>
    </>
  );
}
