'use client';

import { useEffect, useState, useCallback } from 'react';
import { useMap } from '@/hooks/useMap';
import { useAddressSearch } from '@/hooks/useAddressSearch';
import { useDistanceCalculation } from '@/hooks/useDistanceCalculation';
import * as L from 'leaflet';
import type { MarkerInfo } from '@/types';

export default function WalkmanMap() {
  // 커스텀 훅들
  const {
    mapRef,
    markersRef,
    polylinesRef,
    addMarker,
    clearAllMarkers,
    updateMarkerInfo,
    addPolyline,
    setMapView
  } = useMap();

  const {
    isSearching: isAddressSearching,
    searchAddress,
    getAddressFromCoordinates
  } = useAddressSearch();

  const { calculateDistance, showRoutes } = useDistanceCalculation();

  // 로컬 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [markerInfos, setMarkerInfos] = useState<MarkerInfo[]>([]);
  const [walkingDistance, setWalkingDistance] = useState('- km');
  const [walkingTime, setWalkingTime] = useState('- 분');

  // 거리 계산 및 표시
  const calculateAndDisplayDistance = useCallback(async () => {
    setWalkingDistance('계산 중...');
    setWalkingTime('계산 중...');

    try {
      const result = await calculateDistance(markersRef.current);

      if (result.totalDistance > 0) {
        setWalkingDistance(`${result.totalDistance.toFixed(2)} km`);
        setWalkingTime(`${Math.round(result.totalTime)} 분`);

        // 걷기 경로 표시
        if (markersRef.current.length >= 2) {
          const routeData = await showRoutes(markersRef.current);

          // 기존 경로 제거
          if (mapRef.current) {
            const map = mapRef.current;
            polylinesRef.current.forEach(polyline => map.removeLayer(polyline));
          }
          polylinesRef.current = [];

          // 새 경로 표시
          routeData.forEach(({ geometry, startMarker }) => {
            if (geometry) {
              addPolyline(geometry.coordinates, startMarker.color);
            }
          });
        }
      } else {
        setWalkingDistance('계산 실패');
        setWalkingTime('계산 실패');
      }
    } catch {
      setWalkingDistance('계산 실패');
      setWalkingTime('계산 실패');
    }
  }, [
    calculateDistance,
    showRoutes,
    addPolyline,
    polylinesRef,
    mapRef,
    markersRef
  ]);

  // 마커 클릭 핸들러
  const onMapClick = useCallback(
    async (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      const newMarker = await addMarker(lat, lng);
      if (newMarker) {
        setMarkerInfos([...markersRef.current]);

        // 한국 주소 검색 (역지오코딩)
        try {
          const address = await getAddressFromCoordinates(lat, lng);
          updateMarkerInfo(newMarker.id, {
            address,
            isSearchingAddress: false
          });
          setMarkerInfos([...markersRef.current]);
        } catch {
          updateMarkerInfo(newMarker.id, {
            address: '주소를 찾을 수 없습니다',
            isSearchingAddress: false
          });
          setMarkerInfos([...markersRef.current]);
        }

        // 거리 계산
        if (markersRef.current.length >= 2) {
          await calculateAndDisplayDistance();
        }
      }
    },
    [
      addMarker,
      getAddressFromCoordinates,
      updateMarkerInfo,
      calculateAndDisplayDistance,
      markersRef
    ]
  );

  // 지도 초기화
  useEffect(() => {
    const initMap = async () => {
      // Leaflet CSS와 JS 동적 로드
      if (typeof window !== 'undefined') {
        // CSS 로드
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // JS 로드
        if (!window.L) {
          await new Promise<void>(resolve => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => resolve();
            document.head.appendChild(script);
          });
        }

        // 지도 초기화
        if (window.L && !mapRef.current) {
          const Leaflet = window.L;
          mapRef.current = Leaflet.map('map').setView(
            [37.206731, 127.105114],
            16
          );

          Leaflet.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ).addTo(mapRef.current);

          // 지도 클릭 이벤트
          mapRef.current.on('click', onMapClick);
        }
      }
    };

    initMap();

    // 윈도우 리사이즈 이벤트
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onMapClick, mapRef]);

  // 주소 검색
  const handleSearchAddress = async () => {
    if (!searchQuery.trim()) return;

    try {
      const result = await searchAddress(searchQuery);
      if (result) {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        // 지도 중심만 이동 (마커는 추가하지 않음)
        setMapView(lat, lng, 15);
      } else {
        alert('검색 결과를 찾을 수 없습니다.');
      }
    } catch {
      alert('주소 검색 중 오류가 발생했습니다.');
    }
  };

  // 마커 초기화
  const clearMarkers = () => {
    clearAllMarkers();
    setMarkerInfos([]);
    setWalkingDistance('- km');
    setWalkingTime('- 분');
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-2rem)] p-2">
      {/* 지도 영역 */}
      <div className="flex-1 rounded-2xl shadow-xl overflow-hidden">
        <div id="map" className="h-full w-full"></div>
      </div>

      {/* 정보 영역 */}
      <div className="w-1/4 flex flex-col gap-4">
        {/* 주소 검색 */}
        <div className="bg-white rounded-2xl shadow-xl p-3">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            🔍 주소 검색
          </h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearchAddress()}
              placeholder="주소를 입력하세요"
              className="flex-1 min-w-0 px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isAddressSearching}
            />
            <button
              onClick={handleSearchAddress}
              disabled={isAddressSearching || !searchQuery.trim()}
              className="shrink-0 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed">
              {isAddressSearching ? '검색 중...' : '검색'}
            </button>
          </div>
        </div>

        {/* 거리 정보 */}
        <div className="bg-white rounded-2xl shadow-xl p-3">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            📏 거리 정보
          </h3>
          <div className="flex gap-2 mb-2">
            <div className="flex-1 text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">걷기 거리</div>
              <div className="font-bold text-blue-600" id="walkingDistance">
                {walkingDistance}
              </div>
            </div>
            <div className="flex-1 text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">예상 시간</div>
              <div className="font-bold text-green-600" id="walkingTime">
                {walkingTime}
              </div>
            </div>
          </div>
          <button
            onClick={clearMarkers}
            className="w-full py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            마커 초기화
          </button>
        </div>

        {/* 마커 정보 카드들 */}
        <div className="bg-white rounded-2xl shadow-xl p-3 flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            📍 마커 정보 ({markerInfos.length}/5)
          </h3>

          {markerInfos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <div className="text-4xl mb-2">📍</div>
              <div className="text-sm text-center">
                지도를 클릭하여
                <br />
                마커를 추가해주세요!
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {markerInfos.map(marker => (
                <div
                  key={marker.id}
                  className={`bg-linear-to-br ${marker.bgColor} to-white p-2 rounded-lg border ${marker.borderColor} hover:shadow-md transition-shadow`}>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="font-bold text-sm"
                      style={{ color: marker.color }}>
                      {marker.id}번 위치
                    </span>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: marker.color }}></div>
                  </div>
                  <div className="text-xs text-gray-600 leading-relaxed">
                    {marker.isSearchingAddress ? (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        주소 검색 중...
                      </div>
                    ) : (
                      <>
                        <div className="font-medium mb-1">{marker.address}</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
