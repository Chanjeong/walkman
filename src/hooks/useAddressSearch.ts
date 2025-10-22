import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AddressSearchResult, ReverseGeocodeResult } from '@/types';

// 주소 검색 API 호출
const searchAddressAPI = async (
  query: string
): Promise<AddressSearchResult | null> => {
  if (!query.trim()) return null;

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&countrycodes=kr&limit=1`
  );

  if (!response.ok) {
    throw new Error('주소 검색 실패');
  }

  const data = await response.json();
  return data[0] || null;
};

// 역지오코딩 API 호출 (좌표 → 주소)
const reverseGeocodeAPI = async (lat: number, lng: number): Promise<string> => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=ko`
  );

  if (!response.ok) {
    throw new Error('주소 검색 실패');
  }

  const data: ReverseGeocodeResult = await response.json();
  return data.display_name || '주소를 찾을 수 없습니다';
};

export const useAddressSearch = () => {
  const queryClient = useQueryClient();

  // 주소 검색 뮤테이션
  const searchAddressMutation = useMutation({
    mutationFn: searchAddressAPI,
    onSuccess: data => {
      // 성공 시 쿼리 캐시 업데이트
      queryClient.setQueryData(['addressSearch'], data);
    }
  });

  // 역지오코딩 뮤테이션
  const reverseGeocodeMutation = useMutation({
    mutationFn: ({ lat, lng }: { lat: number; lng: number }) =>
      reverseGeocodeAPI(lat, lng)
  });

  // 주소 검색 실행
  const searchAddress = async (query: string) => {
    return await searchAddressMutation.mutateAsync(query);
  };

  // 역지오코딩 실행
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    return await reverseGeocodeMutation.mutateAsync({ lat, lng });
  };

  return {
    // 쿼리 상태
    isSearching:
      searchAddressMutation.isPending || reverseGeocodeMutation.isPending,
    searchError: searchAddressMutation.error || reverseGeocodeMutation.error,

    // 함수들
    searchAddress,
    getAddressFromCoordinates,

    // 뮤테이션 상태
    searchAddressMutation,
    reverseGeocodeMutation
  };
};
