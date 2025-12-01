import MealSignupForm from '@/components/MealSignupForm';
import LocationCards from '@/components/LocationCards';
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Meals for Raquel
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
          Help support our team member by providing a home-cooked meal.
          Sign up below to coordinate your meal drop-off.
        </p>
        <Link
          href="/meals"
          className="text-blue-600 hover:underline"
        >
          View all scheduled meals
        </Link>
      </div>

      {/* Main Content - Form and Location Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Signup Form - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Sign Up to Provide a Meal
            </h2>
            <MealSignupForm />
          </div>

          {/* Info Section */}
          <div className="mt-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                How It Works
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-700">
                <li>Select a date and location that works for you</li>
                <li>Describe the meal you&apos;ll be bringing</li>
                <li>The courier will follow up to set a meeting time</li>
                <li>Drop off your meal and the courier will deliver it to Raquel</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Location Cards - Takes 1 column on large screens */}
        <div className="lg:col-span-1">
          <LocationCards />
        </div>
      </div>
    </div>
  );
}
