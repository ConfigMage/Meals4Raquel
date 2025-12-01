import { LOCATIONS, LocationKey } from '@/lib/locations';

export default function LocationCards() {
  const locationOrder: LocationKey[] = ['Portland', 'I5 Corridor', 'Salem', 'Eugene'];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Drop-off Locations
      </h3>
      {locationOrder.map((key) => {
        const loc = LOCATIONS[key];
        return (
          <div
            key={key}
            className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500"
          >
            <h4 className="font-bold text-gray-900">{key}</h4>
            <p className="text-sm text-gray-700 mt-1">{loc.name}</p>
            <p className="text-sm text-gray-600">{loc.address}</p>
            {loc.city && <p className="text-sm text-gray-600">{loc.city}</p>}
            {loc.note && (
              <p className="text-sm text-blue-600 italic mt-1">{loc.note}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
