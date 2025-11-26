'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface MealDetails {
  id: number;
  name: string;
  mealDescription: string;
  pickupDate: string;
  location: string;
  alreadyCancelled: boolean;
}

export default function CancelPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [meal, setMeal] = useState<MealDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/cancel/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error('Invalid cancellation link');
        return res.json();
      })
      .then((data) => {
        setMeal(data);
        if (data.alreadyCancelled) {
          setIsCancelled(true);
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this meal signup?')) return;

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/cancel/${token}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel');
      }

      setIsCancelled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to home page
          </Link>
        </div>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-2">
            Cancellation Confirmed
          </h2>
          <p className="text-green-700 mb-4">
            Your meal signup has been cancelled. The couriers have been notified.
          </p>
          <Link href="/" className="btn btn-primary">
            Sign up for a different date
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Cancel Meal Signup</h1>

        <p className="text-gray-600 mb-6">
          Are you sure you want to cancel this meal?
        </p>

        {meal && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="mb-2">
              <strong>Name:</strong> {meal.name}
            </p>
            <p className="mb-2">
              <strong>Date:</strong> {formatDate(meal.pickupDate)}
            </p>
            <p className="mb-2">
              <strong>Location:</strong> {meal.location}
            </p>
            <p>
              <strong>Meal:</strong> {meal.mealDescription}
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <Link href="/" className="btn btn-secondary flex-1 text-center">
            Keep My Signup
          </Link>
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="btn btn-danger flex-1 disabled:opacity-50"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Meal'}
          </button>
        </div>
      </div>
    </div>
  );
}
