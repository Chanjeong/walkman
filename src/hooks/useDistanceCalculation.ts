import { useMutation } from '@tanstack/react-query';
import type { MarkerInfo, DistanceResult, RouteDisplayResult } from '@/types';

const getWalkingDistanceAPI = async (
  start: [number, number],
  end: [number, number]
): Promise<{ distance: number; duration: number }> => {
  const response = await fetch(
    `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=false&alternatives=false&steps=false`
  );

  if (!response.ok) {
    throw new Error('거리 계산 실패');
  }

  const data = await response.json();

  if (data.routes && data.routes[0]) {
    return {
      distance: data.routes[0].distance / 1000, // km로 변환
      duration: data.routes[0].duration / 60 // 분으로 변환
    };
  }

  return { distance: 0, duration: 0 };
};

const getRouteGeometryAPI = async (
  start: [number, number],
  end: [number, number]
): Promise<{ coordinates: number[][]; type: string } | null> => {
  const response = await fetch(
    `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
  );

  if (!response.ok) {
    throw new Error('경로 정보 가져오기 실패');
  }

  const data = await response.json();

  if (data.routes && data.routes[0]) {
    return data.routes[0].geometry;
  }

  return null;
};

export const useDistanceCalculation = () => {
  // 전체 경로 거리 계산 뮤테이션
  const calculateTotalDistanceMutation = useMutation({
    mutationFn: async (markers: MarkerInfo[]): Promise<DistanceResult> => {
      if (markers.length < 2)
        return { totalDistance: 0, totalTime: 0, segments: [] };

      // 모든 구간의 거리 계산을 병렬로 실행
      const segmentPromises = [];
      for (let i = 0; i < markers.length - 1; i++) {
        const start: [number, number] = [markers[i].lat, markers[i].lng];
        const end: [number, number] = [markers[i + 1].lat, markers[i + 1].lng];
        segmentPromises.push(getWalkingDistanceAPI(start, end));
      }

      const segments = await Promise.all(segmentPromises);

      const totalDistance = segments.reduce(
        (sum, segment) => sum + segment.distance,
        0
      );
      const totalTime = segments.reduce(
        (sum, segment) => sum + segment.duration,
        0
      );

      return { totalDistance, totalTime, segments };
    }
  });

  // 경로 표시 뮤테이션
  const showRoutesMutation = useMutation({
    mutationFn: async (
      markers: MarkerInfo[]
    ): Promise<RouteDisplayResult[]> => {
      if (markers.length < 2) return [];

      // 모든 구간의 경로 정보를 병렬로 가져오기
      const routePromises = [];
      for (let i = 0; i < markers.length - 1; i++) {
        const start: [number, number] = [markers[i].lat, markers[i].lng];
        const end: [number, number] = [markers[i + 1].lat, markers[i + 1].lng];
        routePromises.push(getRouteGeometryAPI(start, end));
      }

      const routeData = await Promise.all(routePromises);

      // 각 구간별로 경로 정보 반환
      return routeData
        .filter(
          (geometry): geometry is NonNullable<typeof geometry> =>
            geometry !== null
        )
        .map((geometry, index) => ({
          geometry,
          startMarker: markers[index],
          endMarker: markers[index + 1]
        }));
    }
  });

  // 거리 계산 실행
  const calculateDistance = async (markers: MarkerInfo[]) => {
    return await calculateTotalDistanceMutation.mutateAsync(markers);
  };

  // 경로 표시 실행
  const showRoutes = async (markers: MarkerInfo[]) => {
    return await showRoutesMutation.mutateAsync(markers);
  };

  return {
    // 뮤테이션 상태
    isCalculating: calculateTotalDistanceMutation.isPending,
    isShowingRoutes: showRoutesMutation.isPending,
    calculationError:
      calculateTotalDistanceMutation.error || showRoutesMutation.error,

    // 함수들
    calculateDistance,
    showRoutes,

    // 뮤테이션 객체들
    calculateTotalDistanceMutation,
    showRoutesMutation
  };
};
