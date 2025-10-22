import * as L from 'leaflet';

export interface MarkerInfo {
  id: number;
  lat: number;
  lng: number;
  marker: L.Marker;
  address: string;
  isSearchingAddress: boolean;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface MarkerColor {
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface MapRefs {
  mapRef: React.RefObject<L.Map | null>;
  markersRef: React.RefObject<MarkerInfo[]>;
  polylinesRef: React.RefObject<L.Polyline[]>;
}
