'use client';

import { useEffect, useState, useCallback } from 'react';
import { useMap } from '@/hooks/useMap';
import { useAddressSearch } from '@/hooks/useAddressSearch';
import { useDistanceCalculation } from '@/hooks/useDistanceCalculation';
import * as L from 'leaflet';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import type { MarkerInfo } from '@/types';
import { PlusIcon } from '@heroicons/react/24/outline';
import CourseModal from './CourseModal';

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 거리 계산 및 표시
  const calculateAndDisplayDistance = useCallback(async () => {
    setWalkingDistance('계산 중...');
    setWalkingTime('계산 중...');

    try {
      const result = await calculateDistance(markersRef.current);

      if (result.totalDistance > 0) {
        setWalkingDistance(`${result.totalDistance.toFixed(2)} km`);
        setWalkingTime(formatTime(result.totalTime));

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
      // 버튼 클릭인지 확인 (이벤트 타겟이 버튼인지 체크)
      if (e.originalEvent && e.originalEvent.target) {
        const target = e.originalEvent.target as HTMLElement;
        if (target.closest('button')) {
          return; // 버튼 클릭이면 마커 생성하지 않음
        }
      }

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
        toast.error('검색 결과를 찾을 수 없습니다.');
      }
    } catch {
      toast.error('주소 검색 중 오류가 발생했습니다.');
    }
  };

  // 마커 초기화
  const clearMarkers = () => {
    clearAllMarkers();
    setMarkerInfos([]);
    setWalkingDistance('- km');
    setWalkingTime('- 분');
  };

  // 시간 변환 함수 (분을 시간과 분으로)
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);

    if (hours > 0) {
      return `${hours}시간 ${remainingMinutes}분`;
    } else {
      return `${remainingMinutes}분`;
    }
  };

  // 엑셀 내보내기 함수
  const exportToExcel = async () => {
    if (markerInfos.length === 0) return;

    try {
      // 거리 계산 결과 가져오기
      const distanceResult = await calculateDistance(markersRef.current);

      // 엑셀 데이터 생성
      const excelData = [];
      let cumulativeDistance = 0;
      let cumulativeTime = 0;

      for (let i = 0; i < markerInfos.length; i++) {
        const marker = markerInfos[i];

        // 현재 구간의 거리와 시간 계산
        let segmentDistance = 0;
        let segmentTime = 0;

        if (i > 0) {
          const segmentIndex = i - 1;
          if (distanceResult.segments[segmentIndex]) {
            segmentDistance = distanceResult.segments[segmentIndex].distance;
            segmentTime = distanceResult.segments[segmentIndex].duration;
            cumulativeDistance += segmentDistance;
            cumulativeTime += segmentTime;
          }
        }

        excelData.push({
          순서: i + 1,
          위도: marker.lat,
          경도: marker.lng,
          주소: marker.address,
          구간거리_km: i > 0 ? segmentDistance.toFixed(2) : '-',
          구간시간: i > 0 ? formatTime(segmentTime) : '-',
          총누적거리_km: i > 0 ? cumulativeDistance.toFixed(2) : '-',
          총누적시간: i > 0 ? formatTime(cumulativeTime) : '-'
        });
      }

      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // 컬럼 너비 설정
      const columnWidths = [
        { wch: 8 }, // 순서
        { wch: 12 }, // 위도
        { wch: 12 }, // 경도
        { wch: 30 }, // 주소
        { wch: 15 }, // 구간거리
        { wch: 15 }, // 구간시간
        { wch: 15 }, // 총누적거리
        { wch: 15 } // 총누적시간
      ];
      worksheet['!cols'] = columnWidths;

      // 워크북에 워크시트 추가
      XLSX.utils.book_append_sheet(workbook, worksheet, '걷기경로');

      // 파일명 생성 (현재 날짜 포함)
      const now = new Date();
      const dateString = now.toISOString().split('T')[0];
      const fileName = `걷기경로_${dateString}.xlsx`;

      // 엑셀 파일 다운로드
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('엑셀 내보내기 실패:', error);
      toast.error('엑셀 파일 생성에 실패했습니다.');
    }
  };

  // 엑셀 파일 가져오기 함수
  const importFromExcel = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 확장자 검증
    if (
      !file.name.toLowerCase().endsWith('.xlsx') &&
      !file.name.toLowerCase().endsWith('.xls')
    ) {
      toast.error('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
      return;
    }

    try {
      // 파일 읽기
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData || jsonData.length === 0) {
        toast.error('엑셀 파일에 데이터가 없습니다.');
        return;
      }

      // 필수 컬럼 검증
      const requiredColumns = ['순서', '위도', '경도', '주소'];
      const firstRow = jsonData[0] as Record<string, unknown>;

      for (const column of requiredColumns) {
        if (!(column in firstRow)) {
          toast.error(`올바른 엑셀 파일 형식을 사용해주세요.`);
          return;
        }
      }

      // 데이터 검증 및 정렬
      const validatedData = (jsonData as Record<string, unknown>[])
        .map((row, index) => {
          const 순서 = Number(row.순서);
          const 위도 = Number(row.위도);
          const 경도 = Number(row.경도);
          const 주소 = String(row.주소);

          // 좌표 유효성 검사
          if (isNaN(위도) || isNaN(경도) || isNaN(순서)) {
            throw new Error(
              `${index + 1}번째 행의 데이터 형식이 올바르지 않습니다.`
            );
          }

          if (위도 < -90 || 위도 > 90 || 경도 < -180 || 경도 > 180) {
            throw new Error(`${index + 1}번째 행의 좌표가 유효하지 않습니다.`);
          }

          return {
            순서,
            위도,
            경도,
            주소: 주소 || '주소 정보 없음'
          };
        })
        .sort((a, b) => a.순서 - b.순서); // 순서대로 정렬

      if (validatedData.length === 0) {
        toast.error('유효한 데이터가 없습니다.');
        return;
      }

      // 기존 마커 초기화
      clearMarkers();

      // 새로운 마커 생성 (주소 정보와 함께)
      for (const data of validatedData) {
        const markerInfo = await addMarker(data.위도, data.경도);
        if (markerInfo) {
          // 주소 정보를 바로 설정 (검색하지 않음)
          updateMarkerInfo(markerInfo.id, {
            address: data.주소,
            isSearchingAddress: false
          });
        }
      }

      // 마커 정보 상태 업데이트 (모든 마커 정보를 가져옴)
      setMarkerInfos([...markersRef.current]);

      // 엑셀 데이터에서 총 거리와 시간 정보 가져와서 표시
      const lastRow = jsonData[jsonData.length - 1] as Record<string, unknown>;
      if (lastRow && lastRow.총누적거리_km) {
        setWalkingDistance(`${lastRow.총누적거리_km} km`);

        // 시간 정보 처리 (총누적시간 또는 총누적시간_분)
        const timeValue = lastRow.총누적시간 || lastRow.총누적시간_분;
        if (timeValue) {
          if (typeof timeValue === 'string') {
            // 이미 포맷된 시간 (예: "3시간 3분")
            setWalkingTime(timeValue);
          } else if (typeof timeValue === 'number') {
            // 숫자로 된 분 (예: 183)
            setWalkingTime(formatTime(timeValue));
          }
        }
      }

      // 경로 표시만 실행 (거리 계산은 건너뛰기)
      if (markersRef.current.length > 1) {
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

      toast.success(
        `엑셀 파일에서 ${validatedData.length}개의 마커를 성공적으로 가져왔습니다.`
      );
    } catch {
      toast.error('엑셀 파일을 읽는 중 오류가 발생했습니다.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] p-2 w-full gap-6">
      {/* 지도 영역 */}
      <div className="flex-1 rounded-2xl shadow-xl overflow-hidden relative">
        <div id="map" className="h-full w-full relative">
          {markerInfos.length > 0 && (
            <button
              onClick={() => {
                setIsModalOpen(true);
              }}
              className="absolute top-4 right-4 z-[9999] bg-primary text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-100 flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 정보 영역 */}
      <div className="w-80 flex flex-col gap-4">
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
              className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isAddressSearching}
            />
            <button
              onClick={handleSearchAddress}
              disabled={isAddressSearching || !searchQuery.trim()}
              className="shrink-0 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed">
              검색
            </button>
          </div>
        </div>

        {/* 거리 정보 */}
        <div className="bg-white rounded-2xl shadow-xl p-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              📏 거리 정보
            </h3>
            <label className="mb-2 bg-gray-500 px-2 py-1 text-white rounded-lg hover:bg-gray-600 transition-colors cursor-pointer text-center">
              📁
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={importFromExcel}
                className="hidden"
              />
            </label>
          </div>
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
          <div className="flex gap-2">
            <button
              onClick={clearMarkers}
              className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
              마커 초기화
            </button>
          </div>
        </div>

        {/* 마커 정보 카드들 */}
        <div className="bg-white rounded-2xl shadow-xl p-3 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <h3 className="text-lg font-semibold text-gray-800">
              📍 마커 정보 ({markerInfos.length}/5)
            </h3>
            {markerInfos.length > 0 && (
              <button
                onClick={exportToExcel}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1">
                출력
              </button>
            )}
          </div>

          <div className="flex-1 overflow-hidden min-h-0">
            {markerInfos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="text-4xl mb-2">📍</div>
                <div className="text-sm text-center">
                  지도를 클릭하여
                  <br />
                  마커를 추가해주세요!
                </div>
              </div>
            ) : (
              <div className="h-full overflow-y-auto space-y-2 pr-2">
                {markerInfos.map(marker => (
                  <div
                    key={marker.id}
                    className={`bg-linear-to-br ${marker.bgColor} to-white p-2 rounded-lg border ${marker.borderColor} hover:shadow-md transition-shadow shrink-0`}>
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
                          <div className="font-medium mb-1">
                            {marker.address}
                          </div>
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

      {/* 코스 저장 모달 */}
      <CourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        markers={markerInfos}
      />
    </div>
  );
}
