import { MARKER_COLORS } from '@/constant';
import { useRef } from 'react';
import * as L from 'leaflet';
import type { MarkerInfo } from '@/types';

export const useMap = () => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<MarkerInfo[]>([]);
  const polylinesRef = useRef<L.Polyline[]>([]);

  // SVG 마커 생성 함수 (컴포넌트 외부로 이동 가능)
  const createSVGMarker = async (color: string, markerId: number) => {
    try {
      const response = await fetch('/marker.svg');
      let svgString = await response.text();

      svgString = svgString
        .replace(/COLOR_PLACEHOLDER/g, color)
        .replace(/NUMBER_PLACEHOLDER/g, markerId.toString());

      // 런타임에 Leaflet이 로드되었는지 확인
      if (typeof window !== 'undefined' && window.L) {
        return window.L.icon({
          iconUrl: `data:image/svg+xml;base64,${btoa(svgString)}`,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [0, -41]
        });
      }

      throw new Error('Leaflet not loaded');
    } catch {
      // Leaflet이 로드되지 않은 경우 fallback
      if (typeof window !== 'undefined' && window.L) {
        return window.L.divIcon({
          html: `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">${markerId}</div>`,
          iconSize: [25, 25],
          iconAnchor: [12, 12]
        });
      }

      throw new Error('Leaflet not loaded');
    }
  };

  // 마커 추가 (useCallback 불필요 - 의존성 없음)
  const addMarker = async (lat: number, lng: number) => {
    if (!mapRef.current || markersRef.current.length >= 5) return null;

    const markerId = markersRef.current.length + 1;
    const colorInfo = MARKER_COLORS[markerId - 1];

    const customIcon = await createSVGMarker(colorInfo.color, markerId);

    // 런타임에 Leaflet이 로드되었는지 확인
    if (typeof window !== 'undefined' && window.L) {
      const marker = window.L.marker([lat, lng], { icon: customIcon }).addTo(
        mapRef.current
      );

      const markerInfo: MarkerInfo = {
        id: markerId,
        lat,
        lng,
        marker,
        address: '주소 검색 중...',
        isSearchingAddress: true,
        color: colorInfo.color,
        bgColor: colorInfo.bgColor,
        borderColor: colorInfo.borderColor
      };

      markersRef.current.push(markerInfo);
      return markerInfo;
    }

    return null;
  };

  // 마커 제거 (useCallback 불필요 - 의존성 없음)
  const removeMarker = (markerId: number) => {
    const markerIndex = markersRef.current.findIndex(m => m.id === markerId);
    if (markerIndex !== -1) {
      const marker = markersRef.current[markerIndex];
      mapRef.current?.removeLayer(marker.marker);
      markersRef.current.splice(markerIndex, 1);
    }
  };

  // 모든 마커 제거 (useCallback 불필요 - 의존성 없음)
  const clearAllMarkers = () => {
    markersRef.current.forEach(m => mapRef.current?.removeLayer(m.marker));
    markersRef.current = [];

    polylinesRef.current.forEach(polyline =>
      mapRef.current?.removeLayer(polyline)
    );
    polylinesRef.current = [];
  };

  // 마커 정보 업데이트 (useCallback 불필요 - 의존성 없음)
  const updateMarkerInfo = (markerId: number, updates: Partial<MarkerInfo>) => {
    const markerIndex = markersRef.current.findIndex(m => m.id === markerId);
    if (markerIndex !== -1) {
      markersRef.current[markerIndex] = {
        ...markersRef.current[markerIndex],
        ...updates
      };
    }
  };

  // 경로 추가 (useCallback 불필요 - 의존성 없음)
  const addPolyline = (coordinates: number[][], color: string) => {
    if (!mapRef.current) return;

    // 런타임에 Leaflet이 로드되었는지 확인
    if (typeof window !== 'undefined' && window.L) {
      const polyline = window.L.polyline(
        coordinates.map((coord: number[]) => [coord[1], coord[0]]),
        {
          color,
          weight: 4,
          opacity: 0.8
        }
      ).addTo(mapRef.current);

      polylinesRef.current.push(polyline);
    }
  };

  // 지도 중심 이동 (useCallback 불필요 - 의존성 없음)
  const setMapView = (lat: number, lng: number, zoom: number = 15) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], zoom);
    }
  };

  return {
    mapRef,
    markersRef,
    polylinesRef,
    addMarker,
    removeMarker,
    clearAllMarkers,
    updateMarkerInfo,
    addPolyline,
    setMapView,
    createSVGMarker
  };
};
