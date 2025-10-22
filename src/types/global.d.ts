import * as L from 'leaflet';

// Leaflet이 런타임에 window.L로 로드되므로 타입 선언
declare global {
  interface Window {
    L: typeof L;
  }
}

// 전역 타입을 위한 빈 export (모듈로 인식시키기 위해)
export {};
