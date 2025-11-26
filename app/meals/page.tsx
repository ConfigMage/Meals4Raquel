import MealsList from '@/components/MealsList';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function MealsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Scheduled Meals</h1>
        <Link href="/" className="btn btn-primary">
          Sign Up to Provide a Meal
        </Link>
      </div>

      <MealsList />
    </div>
  );
}
