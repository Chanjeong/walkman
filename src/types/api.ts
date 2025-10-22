// 주소 검색 API 응답 타입
export interface AddressSearchResult {
  lat: string;
  lon: string;
  display_name: string;
  place_id: string;
  osm_type: string;
  osm_id: string;
}

// 역지오코딩 API 응답 타입
export interface ReverseGeocodeResult {
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

// OSRM API 응답 타입
export interface OSRMRoute {
  distance: number;
  duration: number;
  geometry: {
    coordinates: number[][];
    type: string;
  };
}

export interface OSRMResponse {
  routes: OSRMRoute[];
  waypoints: Array<{
    location: [number, number];
    name: string;
  }>;
}

// 거리 계산 결과 타입
export interface DistanceResult {
  totalDistance: number;
  totalTime: number;
  segments: Array<{
    distance: number;
    duration: number;
  }>;
}

// 경로 표시 결과 타입
export interface RouteDisplayResult {
  geometry: OSRMRoute['geometry'];
  startMarker: import('./map').MarkerInfo;
  endMarker: import('./map').MarkerInfo;
}
