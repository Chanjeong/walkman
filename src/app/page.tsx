import WalkmanMap from '@/components/WalkmanMap';

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl mb-6 p-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🚶‍♂️ Walkman</h1>
          <p className="text-gray-600">
            지도를 클릭해서 두 지점을 선택하면 걷기 거리와 시간을 계산해드립니다
          </p>
        </div>

        <WalkmanMap />
      </div>
    </div>
  );
}
