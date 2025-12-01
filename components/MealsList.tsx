'use client';

import { useState, useEffect } from 'react';
import { MealsByLocation, MealWithLocation } from '@/types';
import { formatDate, groupMealsByDate } from '@/lib/utils';
import { getLocationInfo, LocationKey } from '@/lib/locations';

export default function MealsList() {
  const [meals, setMeals] = useState<MealsByLocation>({
    Salem: [],
    Portland: [],
    Eugene: [],
    'I5 Corridor': [],
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

  const renderLocation = (location: LocationKey) => {
    // Filter out cancelled meals
    const locationMeals = meals[location].filter(meal => !meal.cancelled_at);
    const mealsByDate = groupMealsByDate(locationMeals);
    const sortedDates = Object.keys(mealsByDate).sort();
    const locInfo = getLocationInfo(location);

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 text-white px-4 py-3">
          <h2 className="text-xl font-bold">{location}</h2>
          {locInfo && (
            <div className="text-sm text-blue-100 mt-1">
              <p>{locInfo.name}</p>
              <p>{locInfo.address}</p>
              {locInfo.city && <p>{locInfo.city}</p>}
              {locInfo.note && <p className="italic">{locInfo.note}</p>}
            </div>
          )}
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
                      className="p-3 rounded-lg border-l-4 bg-green-50 border-green-400"
                    >
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
          <strong>Important:</strong> The courier will follow up to set a specific
          time to meet at the chosen location.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderLocation('Portland')}
        {renderLocation('I5 Corridor')}
        {renderLocation('Salem')}
        {renderLocation('Eugene')}
      </div>
    </div>
  );
}
