import WalkmanMap from '@/components/WalkmanMap';

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🚶‍♂️ Walkman</h1>

        <WalkmanMap />
      </div>
    </div>
  );
}
