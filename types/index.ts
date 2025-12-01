export interface PickupLocation {
  id: number;
  pickup_date: string;
  location: 'Salem' | 'Portland' | 'Eugene' | 'I5 Corridor';
  active: boolean;
  created_at: string;
}

export interface MealSignup {
  id: number;
  pickup_location_id: number;
  name: string;
  phone: string;
  email: string;
  meal_description: string;
  freezer_friendly: boolean;
  note_to_courier: string | null;
  can_bring_to_salem: boolean;
  cancellation_token: string;
  cancelled_at: string | null;
  created_at: string;
  // Joined fields
  pickup_date?: string;
  location?: string;
}

export interface Courier {
  id: number;
  name: string;
  email: string;
  phone: string;
  locations: string[];
  active: boolean;
  created_at: string;
}

export interface MealSignupFormData {
  name: string;
  phone: string;
  email: string;
  pickupLocationId: number;
  mealDescription: string;
  freezerFriendly: boolean;
  noteToCourier: string;
  canBringToSalem: boolean;
}

export interface MealsByLocation {
  Salem: MealWithLocation[];
  Portland: MealWithLocation[];
  Eugene: MealWithLocation[];
  'I5 Corridor': MealWithLocation[];
}

export interface MealWithLocation extends MealSignup {
  pickup_date: string;
  location: string;
}

export interface CourierInfo {
  name: string;
  phone: string;
  email: string;
}
