'use client';

import { useState, useEffect } from 'react';
import { PickupLocation, MealSignupFormData } from '@/types';
import { formatDate } from '@/lib/utils';
import { ALLOWED_DATES, getLocationInfo } from '@/lib/locations';

export default function MealSignupForm() {
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<MealSignupFormData>({
    name: '',
    phone: '',
    email: '',
    pickupLocationId: 0,
    mealDescription: '',
    freezerFriendly: false,
    noteToCourier: '',
    canBringToSalem: false,
  });

  useEffect(() => {
    fetch('/api/pickup-locations')
      .then((res) => res.json())
      .then((data) => setPickupLocations(data))
      .catch((err) => console.error('Error fetching pickup locations:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      setIsSuccess(true);
      setFormData({
        name: '',
        phone: '',
        email: '',
        pickupLocationId: 0,
        mealDescription: '',
        freezerFriendly: false,
        noteToCourier: '',
        canBringToSalem: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'pickupLocationId' ? parseInt(value, 10) : value,
    }));
  };

  // Filter to only allowed dates and group by date
  const filteredLocations = pickupLocations.filter((loc) => {
    // Normalize the date to YYYY-MM-DD format for comparison
    const dateStr = typeof loc.pickup_date === 'string'
      ? loc.pickup_date.split('T')[0]
      : new Date(loc.pickup_date).toISOString().split('T')[0];
    return ALLOWED_DATES.includes(dateStr);
  });

  const locationsByDate = filteredLocations.reduce((acc, loc) => {
    const dateStr = typeof loc.pickup_date === 'string'
      ? loc.pickup_date.split('T')[0]
      : new Date(loc.pickup_date).toISOString().split('T')[0];
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(loc);
    return acc;
  }, {} as Record<string, PickupLocation[]>);

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-green-800 mb-2">
            Thank you for signing up!
          </h3>
          <p className="text-green-700 mb-4">
            Check your email for a confirmation with all the details and a cancellation link.
          </p>
          <button
            onClick={() => setIsSuccess(false)}
            className="btn btn-primary"
          >
            Sign up for another meal
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="(503) 555-1234"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="john@example.com"
        />
        <p className="text-sm text-gray-500 mt-1">
          You&apos;ll receive a confirmation email with cancellation link.
        </p>
      </div>

      <div>
        <label htmlFor="pickupLocationId" className="block text-sm font-medium text-gray-700 mb-1">
          Pickup Date & Location <span className="text-red-500">*</span>
        </label>
        <select
          id="pickupLocationId"
          name="pickupLocationId"
          value={formData.pickupLocationId}
          onChange={handleChange}
          required
        >
          <option value="">Select a date and location</option>
          {Object.entries(locationsByDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, locations]) => (
              <optgroup key={date} label={formatDate(date)}>
                {locations.map((loc) => {
                  const locInfo = getLocationInfo(loc.location);
                  const displayText = locInfo
                    ? `${loc.location}: ${locInfo.name}${locInfo.note ? ` (${locInfo.note})` : ''}`
                    : loc.location;
                  return (
                    <option key={loc.id} value={loc.id}>
                      {displayText}
                    </option>
                  );
                })}
              </optgroup>
            ))}
        </select>
      </div>

      <div>
        <label htmlFor="mealDescription" className="block text-sm font-medium text-gray-700 mb-1">
          Meal Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="mealDescription"
          name="mealDescription"
          value={formData.mealDescription}
          onChange={handleChange}
          required
          rows={3}
          placeholder="Describe the meal you'll be making, including estimated number of servings (e.g., chicken casserole with rice and vegetables, 3 servings)"
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="freezerFriendly"
            checked={formData.freezerFriendly}
            onChange={handleChange}
          />
          <span className="text-sm text-gray-700">
            This meal is freezer-friendly
          </span>
        </label>
      </div>

      <div>
        <label htmlFor="noteToCourier" className="block text-sm font-medium text-gray-700 mb-1">
          Note to Courier (optional)
        </label>
        <textarea
          id="noteToCourier"
          name="noteToCourier"
          value={formData.noteToCourier}
          onChange={handleChange}
          rows={2}
          placeholder="If selected I5 Corridor location, please include your rough location here."
        />
        <p className="text-sm text-gray-500 mt-1">
          This note will only be visible to couriers.
        </p>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-sm text-yellow-800">
          The courier will follow up to set a specific time to meet at the chosen location.
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || pickupLocations.length === 0}
        className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Submitting...' : 'Sign Up to Provide a Meal'}
      </button>
    </form>
  );
}
