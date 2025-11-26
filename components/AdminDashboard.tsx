'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PickupLocation, MealSignup, Courier } from '@/types';
import { formatDate } from '@/lib/utils';

type Tab = 'meals' | 'locations' | 'couriers';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('meals');
  const [meals, setMeals] = useState<(MealSignup & { pickup_date: string; location: string })[]>([]);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const router = useRouter();

  // Modal states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<PickupLocation | null>(null);
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);

  // Form states
  const [locationForm, setLocationForm] = useState({ pickupDate: '', location: 'Salem', active: true });
  const [courierForm, setCourierForm] = useState({ name: '', email: '', phone: '', locations: [] as string[], active: true });

  useEffect(() => {
    loadData();
  }, [locationFilter, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (locationFilter) params.append('location', locationFilter);
      if (statusFilter) params.append('status', statusFilter);

      const [mealsRes, locationsRes, couriersRes] = await Promise.all([
        fetch(`/api/admin/meals?${params}`),
        fetch('/api/admin/pickup-locations'),
        fetch('/api/admin/couriers'),
      ]);

      if (!mealsRes.ok || !locationsRes.ok || !couriersRes.ok) {
        if (mealsRes.status === 401 || locationsRes.status === 401 || couriersRes.status === 401) {
          router.push('/admin');
          return;
        }
      }

      const [mealsData, locationsData, couriersData] = await Promise.all([
        mealsRes.json(),
        locationsRes.json(),
        couriersRes.json(),
      ]);

      setMeals(mealsData);
      setPickupLocations(locationsData);
      setCouriers(couriersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  };

  // Location CRUD
  const handleSaveLocation = async () => {
    const method = editingLocation ? 'PUT' : 'POST';
    const url = editingLocation
      ? `/api/admin/pickup-locations/${editingLocation.id}`
      : '/api/admin/pickup-locations';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(locationForm),
    });

    if (response.ok) {
      setShowLocationModal(false);
      setEditingLocation(null);
      setLocationForm({ pickupDate: '', location: 'Salem', active: true });
      loadData();
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this pickup location?')) return;
    await fetch(`/api/admin/pickup-locations/${id}`, { method: 'DELETE' });
    loadData();
  };

  // Courier CRUD
  const handleSaveCourier = async () => {
    const method = editingCourier ? 'PUT' : 'POST';
    const url = editingCourier
      ? `/api/admin/couriers/${editingCourier.id}`
      : '/api/admin/couriers';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courierForm),
    });

    if (response.ok) {
      setShowCourierModal(false);
      setEditingCourier(null);
      setCourierForm({ name: '', email: '', phone: '', locations: [], active: true });
      loadData();
    }
  };

  const handleDeleteCourier = async (id: number) => {
    if (!confirm('Are you sure you want to delete this courier?')) return;
    await fetch(`/api/admin/couriers/${id}`, { method: 'DELETE' });
    loadData();
  };

  const openLocationModal = (location?: PickupLocation) => {
    if (location) {
      setEditingLocation(location);
      setLocationForm({
        pickupDate: location.pickup_date.split('T')[0],
        location: location.location,
        active: location.active,
      });
    } else {
      setEditingLocation(null);
      setLocationForm({ pickupDate: '', location: 'Salem', active: true });
    }
    setShowLocationModal(true);
  };

  const openCourierModal = (courier?: Courier) => {
    if (courier) {
      setEditingCourier(courier);
      setCourierForm({
        name: courier.name,
        email: courier.email,
        phone: courier.phone,
        locations: courier.locations,
        active: courier.active,
      });
    } else {
      setEditingCourier(null);
      setCourierForm({ name: '', email: '', phone: '', locations: [], active: true });
    }
    setShowCourierModal(true);
  };

  const renderMealsTab = () => (
    <div>
      <div className="flex gap-4 mb-4">
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="">All Locations</option>
          <option value="Salem">Salem</option>
          <option value="Portland">Portland</option>
          <option value="Eugene">Eugene</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Location</th>
              <th>Name</th>
              <th>Meal</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Freezer</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {meals.map((meal) => (
              <tr key={meal.id} className={meal.cancelled_at ? 'bg-red-50' : ''}>
                <td>{formatDate(meal.pickup_date)}</td>
                <td>{meal.location}</td>
                <td>{meal.name}</td>
                <td className="max-w-xs truncate">{meal.meal_description}</td>
                <td>{meal.phone}</td>
                <td>{meal.email}</td>
                <td>{meal.freezer_friendly ? 'Yes' : 'No'}</td>
                <td>
                  {meal.cancelled_at ? (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                      Cancelled
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Active
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLocationsTab = () => (
    <div>
      <button
        onClick={() => openLocationModal()}
        className="btn btn-primary mb-4"
      >
        Add Pickup Location
      </button>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pickupLocations.map((loc) => (
              <tr key={loc.id}>
                <td>{formatDate(loc.pickup_date)}</td>
                <td>{loc.location}</td>
                <td>
                  {loc.active ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="space-x-2">
                  <button
                    onClick={() => openLocationModal(loc)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteLocation(loc.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCouriersTab = () => (
    <div>
      <button
        onClick={() => openCourierModal()}
        className="btn btn-primary mb-4"
      >
        Add Courier
      </button>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Locations</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {couriers.map((courier) => (
              <tr key={courier.id}>
                <td>{courier.name}</td>
                <td>{courier.email}</td>
                <td>{courier.phone}</td>
                <td>{courier.locations.join(', ')}</td>
                <td>
                  {courier.active ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="space-x-2">
                  <button
                    onClick={() => openCourierModal(courier)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCourier(courier.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button onClick={handleLogout} className="btn btn-secondary">
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          {(['meals', 'locations', 'couriers'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          {activeTab === 'meals' && renderMealsTab()}
          {activeTab === 'locations' && renderLocationsTab()}
          {activeTab === 'couriers' && renderCouriersTab()}
        </>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingLocation ? 'Edit Pickup Location' : 'Add Pickup Location'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={locationForm.pickupDate}
                  onChange={(e) => setLocationForm({ ...locationForm, pickupDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <select
                  value={locationForm.location}
                  onChange={(e) => setLocationForm({ ...locationForm, location: e.target.value })}
                >
                  <option value="Salem">Salem</option>
                  <option value="Portland">Portland</option>
                  <option value="Eugene">Eugene</option>
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={locationForm.active}
                  onChange={(e) => setLocationForm({ ...locationForm, active: e.target.checked })}
                />
                <span>Active</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowLocationModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleSaveLocation} className="btn btn-primary">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Courier Modal */}
      {showCourierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingCourier ? 'Edit Courier' : 'Add Courier'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={courierForm.name}
                  onChange={(e) => setCourierForm({ ...courierForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={courierForm.email}
                  onChange={(e) => setCourierForm({ ...courierForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={courierForm.phone}
                  onChange={(e) => setCourierForm({ ...courierForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Locations</label>
                <div className="space-y-2">
                  {['Salem', 'Portland', 'Eugene'].map((loc) => (
                    <label key={loc} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={courierForm.locations.includes(loc)}
                        onChange={(e) => {
                          const newLocations = e.target.checked
                            ? [...courierForm.locations, loc]
                            : courierForm.locations.filter((l) => l !== loc);
                          setCourierForm({ ...courierForm, locations: newLocations });
                        }}
                      />
                      <span>{loc}</span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={courierForm.active}
                  onChange={(e) => setCourierForm({ ...courierForm, active: e.target.checked })}
                />
                <span>Active</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCourierModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleSaveCourier} className="btn btn-primary">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
