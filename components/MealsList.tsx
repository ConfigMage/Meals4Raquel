'use client';

import { useState, useEffect } from 'react';
import { MealsByLocation, MealWithLocation } from '@/types';
import { formatDate, groupMealsByDate } from '@/lib/utils';

export default function MealsList() {
  const [meals, setMeals] = useState<MealsByLocation>({
    Salem: [],
    Portland: [],
    Eugene: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/meals')
      .then((res) => res.json())
      .then((data) => {
        setMeals(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching meals:', err);
        setIsLoading(false);
      });
  }, []);

  const renderLocation = (location: 'Salem' | 'Portland' | 'Eugene') => {
    const locationMeals = meals[location];
    const mealsByDate = groupMealsByDate(locationMeals);
    const sortedDates = Object.keys(mealsByDate).sort();

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 text-white px-4 py-3">
          <h2 className="text-xl font-bold">{location}</h2>
        </div>
        <div className="p-4">
          {sortedDates.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No meals scheduled
            </p>
          ) : (
            sortedDates.map((date) => (
              <div key={date} className="mb-6 last:mb-0">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">
                  {formatDate(date)}
                </h3>
                <div className="space-y-3">
                  {mealsByDate[date].map((meal: MealWithLocation) => (
                    <div
                      key={meal.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        meal.cancelled_at
                          ? 'bg-red-50 border-red-400'
                          : 'bg-green-50 border-green-400'
                      }`}
                    >
                      <div className={meal.cancelled_at ? 'line-through text-gray-500' : ''}>
                        <p className="font-medium">{meal.name}</p>
                        <p className="text-sm text-gray-600">
                          {meal.meal_description}
                        </p>
                        {meal.freezer_friendly && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Freezer Friendly
                          </span>
                        )}
                      </div>
                      {meal.cancelled_at && (
                        <p className="text-red-600 text-sm mt-1 font-medium">
                          (Cancelled)
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading meals...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
        <p className="text-sm text-yellow-800">
          <strong>Important:</strong> All meals should be dropped off no later than{' '}
          <strong>2:00 PM</strong> at the specified location. If this is not possible,
          please contact the courier.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderLocation('Salem')}
        {renderLocation('Portland')}
        {renderLocation('Eugene')}
      </div>
    </div>
  );
}
