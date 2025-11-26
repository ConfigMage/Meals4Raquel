import MealSignupForm from '@/components/MealSignupForm';
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

      {/* Signup Form */}
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Sign Up to Provide a Meal
        </h2>
        <MealSignupForm />
      </div>

      {/* Info Section */}
      <div className="mt-12 max-w-2xl mx-auto">
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            How It Works
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>Select a date and location that works for you</li>
            <li>Describe the meal you&apos;ll be bringing</li>
            <li>Drop off your meal by 2:00 PM on the selected day</li>
            <li>A courier will pick it up and deliver it to Raquel</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
