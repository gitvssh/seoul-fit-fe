// lib/seoulApi.ts - 서울 API 직접 호출 서비스

const API_KEY = process.env.SEOUL_API_KEY || '';
import { env } from '@/config/environment';

const BASE_URL = env.seoulApiBaseUrl;

// 지하철 역 정보 타입
export interface SubwayStationRow {
  BLDN_ID: string;
  BLDN_NM: string;
  ROUTE: string;
  LAT: string;
  LOT: string;
}

interface SubwayApiResponse {
  subwayStationMaster: {
    list_total_count: number;
    RESULT: {
      CODE: string;
      MESSAGE: string;
    };
    row: SubwayStationRow[];
  };
}

// 따릉이 대여소 타입
export interface BikeStationRow {
  rackTotCnt: string;
  stationName: string;
  parkingBikeTotCnt: string;
  shared: string;
  stationLatitude: string;
  stationLongitude: string;
  stationId: string;
}

interface BikeApiResponse {
  rentBikeStatus: {
    list_total_count: number;
    RESULT: {
      CODE: string;
      MESSAGE: string;
    };
    row: BikeStationRow[];
  };
}

// 지하철 전체 데이터 로드 (서버 시작시 1회)
export async function loadAllSubwayStations(): Promise<SubwayStationRow[]> {
  try {
    console.log('[서울API] 지하철 전체 데이터 로드 시작...');

    const apiUrl = `${BASE_URL}/${API_KEY}/json/subwayStationMaster/1/800/`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`지하철 API 호출 실패: ${response.status}`);
    }

    const data: SubwayApiResponse = await response.json();

    if (data.subwayStationMaster.RESULT.CODE !== 'INFO-000') {
      throw new Error(`지하철 API 응답 에러: ${data.subwayStationMaster.RESULT.MESSAGE}`);
    }

    const stations = data.subwayStationMaster.row;
    console.log(`[서울API] 지하철 데이터 로드 완료: ${stations.length}개 역`);

    return stations;
  } catch (error) {
    console.error('[서울API] 지하철 데이터 로드 실패:', error);
    throw error;
  }
}

// 따릉이 전체 데이터 로드 (1분마다 갱신)
// 타입 가드 함수
function isBikeApiResponse(data: unknown): data is BikeApiResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'rentBikeStatus' in data &&
    typeof (data as Record<string, unknown>).rentBikeStatus === 'object' &&
    (data as Record<string, unknown>).rentBikeStatus !== null &&
    'RESULT' in ((data as Record<string, unknown>).rentBikeStatus as Record<string, unknown>) &&
    'row' in ((data as Record<string, unknown>).rentBikeStatus as Record<string, unknown>)
  );
}

// 따릉이 API 단일 호출 함수
async function fetchBikeBatch(startIndex: number, endIndex: number): Promise<BikeStationRow[]> {
  const apiUrl = `${BASE_URL}/${API_KEY}/json/bikeList/${startIndex}/${endIndex}/`;
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`따릉이 API 호출 실패: ${response.status}`);
  }

  const responseText = await response.text();
  let data: unknown;

  // XML 응답 체크 및 처리
  if (responseText.trim().startsWith('<')) {
    console.warn(
      `[서울API] XML/HTML 응답 받음 (${startIndex}-${endIndex}), JSON으로 재시도...`
    );
    // XML 응답일 경우 URL을 json으로 변경하여 재시도
    const jsonUrl = apiUrl.replace('/xml/', '/json/');
    const retryResponse = await fetch(jsonUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!retryResponse.ok) {
      console.error(`따릉이 API 재시도 실패: ${retryResponse.status}`);
      // API가 일시적으로 다운되었을 수 있으므로 빈 배열 반환
      return [];
    }
    
    const retryText = await retryResponse.text();
    if (retryText.trim().startsWith('<')) {
      console.error(`따릉이 API가 계속 XML을 반환합니다. API 상태를 확인해주세요.`);
      // API가 일시적으로 다운되었을 수 있으므로 빈 배열 반환
      return [];
    }
    
    try {
      data = JSON.parse(retryText);
    } catch (parseError) {
      console.error('[서울API] JSON 파싱 실패:', parseError);
      // API가 일시적으로 다운되었을 수 있으므로 빈 배열 반환
      return [];
    }
  } else {
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[서울API] JSON 파싱 실패:', parseError);
      // API가 일시적으로 다운되었을 수 있으므로 빈 배열 반환
      return [];
    }
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    'RESULT' in data &&
    !('rentBikeStatus' in data)
  ) {
    const errorResult = (data as { RESULT: { CODE: string; MESSAGE: string } }).RESULT;
    throw new Error(`따릉이 API 에러: ${errorResult.CODE} - ${errorResult.MESSAGE}`);
  }

  if (!isBikeApiResponse(data)) {
    throw new Error('따릉이 API 응답 구조가 예상과 다릅니다.');
  }

  if (data.rentBikeStatus.RESULT.CODE !== 'INFO-000') {
    throw new Error(`따릉이 API 응답 에러: ${data.rentBikeStatus.RESULT.MESSAGE}`);
  }

  return data.rentBikeStatus.row;
}

export async function loadAllBikeStations(): Promise<BikeStationRow[]> {
  try {
    console.log('[서울API] 따릉이 전체 데이터 로드 시작...');

    // 1000개씩 두 번 호출
    const [batch1, batch2] = await Promise.all([
      fetchBikeBatch(1, 1000),
      fetchBikeBatch(1001, 2000),
    ]);

    const allStations = [...batch1, ...batch2];
    console.log(
      `[서울API] 따릉이 데이터 로드 완료: ${allStations.length}개 대여소 (batch1: ${batch1.length}, batch2: ${batch2.length})`
    );

    return allStations;
  } catch (error) {
    console.error('[서울API] 따릉이 데이터 로드 실패:', error);
    throw error;
  }
}

// 공원 데이터 타입
export interface ParkRow {
  P_PARK: string;
  P_IDX: string;
  P_LIST_CONTENT: string;
  AREA: string;
  P_ADDR: string;
  P_ADMINTEL: string;
  LONGITUDE: string;
  LATITUDE: string;
  USE_REFER: string;
  P_IMG: string;
}

interface ParkApiResponse {
  SearchParkInfoService: {
    list_total_count: number;
    RESULT: {
      CODE: string;
      MESSAGE: string;
    };
    row: ParkRow[];
  };
}

// 공원 데이터 직접 호출
export async function loadAllParks(): Promise<ParkRow[]> {
  try {
    console.log('[서울API] 공원 전체 데이터 로드 시작...');

    // 서울 공원 정보 API 호출
    const apiUrl = `${BASE_URL}/${API_KEY}/json/SearchParkInfoService/1/1000/`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`공원 API 호출 실패: ${response.status}`);
    }

    const data: ParkApiResponse = await response.json();

    if (data.SearchParkInfoService.RESULT.CODE !== 'INFO-000') {
      throw new Error(`공원 API 응답 에러: ${data.SearchParkInfoService.RESULT.MESSAGE}`);
    }

    const parks = data.SearchParkInfoService.row || [];
    console.log(`[서울API] 공원 데이터 로드 완료: ${parks.length}개`);

    return parks;
  } catch (error) {
    console.error('[서울API] 공원 데이터 로드 실패:', error);
    throw error;
  }
}

// 도서관 데이터 타입  
export interface LibraryRow {
  LBRRY_NAME: string;
  ADRES: string;
  TEL_NO: string;
  HMPG_URL: string;
  XCNTS: string;
  YDNTS: string;
  OP_TIME: string;
  FDRM_CLOSE_DATE: string;
}

interface LibraryApiResponse {
  SeoulPublicLibraryInfo: {
    list_total_count: number;
    RESULT: {
      CODE: string;
      MESSAGE: string;
    };
    row: LibraryRow[];
  };
}

// 도서관 데이터 직접 호출
export async function loadAllLibraries(): Promise<LibraryRow[]> {
  try {
    console.log('[서울API] 도서관 전체 데이터 로드 시작...');

    const apiUrl = `${BASE_URL}/${API_KEY}/json/SeoulPublicLibraryInfo/1/300/`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`도서관 API 호출 실패: ${response.status}`);
    }

    const data: LibraryApiResponse = await response.json();

    if (data.SeoulPublicLibraryInfo.RESULT.CODE !== 'INFO-000') {
      throw new Error(`도서관 API 응답 에러: ${data.SeoulPublicLibraryInfo.RESULT.MESSAGE}`);
    }

    const libraries = data.SeoulPublicLibraryInfo.row || [];
    console.log(`[서울API] 도서관 데이터 로드 완료: ${libraries.length}개`);

    return libraries;
  } catch (error) {
    console.error('[서울API] 도서관 데이터 로드 실패:', error);
    throw error;
  }
}

// 혼잡도 데이터 타입 - UI와 호환되는 원시 API 형식 사용
export interface CongestionData {
  AREA_CD: string;           // 장소 코드
  AREA_NM: string;           // 장소명  
  AREA_CONGEST_LVL: string;  // 혼잡도 레벨 (여유, 보통, 약간 붐빔, 붐빔)
  AREA_CONGEST_MSG: string;  // 혼잡도 메시지
  timestamp?: string;        // 타임스탬프 (옵션)
  cached?: boolean;          // 캐시 여부 (옵션)
}

// 서울시 주요 120장소 목록
export const SEOUL_LOCATIONS = [
  // 관광특구
  {code: 'POI001', name: '강남 MICE 관광특구', lat: 37.5175, lng: 127.0473},
  {code: 'POI002', name: '동대문 관광특구', lat: 37.5663, lng: 127.0092},
  {code: 'POI003', name: '명동 관광특구', lat: 37.5636, lng: 126.9824},
  {code: 'POI004', name: '이태원 관광특구', lat: 37.5344, lng: 126.9957},
  {code: 'POI005', name: '잠실 관광특구', lat: 37.5133, lng: 127.1028},
  {code: 'POI006', name: '종로·청계 관광특구', lat: 37.5700, lng: 126.9920},
  {code: 'POI007', name: '홍대 관광특구', lat: 37.5519, lng: 126.9245},
  // 고궁·문화유산
  {code: 'POI008', name: '경복궁', lat: 37.5788, lng: 126.9770},
  {code: 'POI009', name: '광화문·덕수궁', lat: 37.5658, lng: 126.9756},
  {code: 'POI010', name: '보신각', lat: 37.5693, lng: 126.9833},
  {code: 'POI011', name: '서울 암사동 유적', lat: 37.5525, lng: 127.1311},
  {code: 'POI012', name: '창덕궁·종묘', lat: 37.5755, lng: 126.9946},
  // 지하철역
  {code: 'POI013', name: '가산디지털단지역', lat: 37.4817, lng: 126.8824},
  {code: 'POI014', name: '강남역', lat: 37.4979, lng: 127.0276},
  {code: 'POI015', name: '건대입구역', lat: 37.5401, lng: 127.0701},
  {code: 'POI016', name: '고덕역', lat: 37.5559, lng: 127.1544},
  {code: 'POI017', name: '고속터미널역', lat: 37.5047, lng: 127.0046},
  {code: 'POI018', name: '교대역', lat: 37.4934, lng: 127.0146},
  {code: 'POI019', name: '구로디지털단지역', lat: 37.4851, lng: 126.9015},
  {code: 'POI020', name: '구로역', lat: 37.5034, lng: 126.8876},
  {code: 'POI021', name: '군자역', lat: 37.5573, lng: 127.0793},
  {code: 'POI023', name: '대림역', lat: 37.4933, lng: 126.8964},
  {code: 'POI024', name: '동대문역', lat: 37.5713, lng: 127.0095},
  {code: 'POI025', name: '뚝섬역', lat: 37.5472, lng: 127.0477},
  {code: 'POI026', name: '미아사거리역', lat: 37.6133, lng: 127.0302},
  {code: 'POI027', name: '발산역', lat: 37.5583, lng: 126.8374},
  {code: 'POI029', name: '사당역', lat: 37.4766, lng: 126.9816},
  {code: 'POI030', name: '삼각지역', lat: 37.5346, lng: 126.9734},
  {code: 'POI031', name: '서울대입구역', lat: 37.4813, lng: 126.9527},
  {code: 'POI032', name: '서울식물원·마곡나루역', lat: 37.5640, lng: 126.8337},
  {code: 'POI033', name: '서울역', lat: 37.5547, lng: 126.9706},
  {code: 'POI034', name: '선릉역', lat: 37.5048, lng: 127.0493},
  {code: 'POI035', name: '성신여대입구역', lat: 37.5927, lng: 127.0165},
  {code: 'POI036', name: '수유역', lat: 37.6369, lng: 127.0259},
  {code: 'POI037', name: '신논현역·논현역', lat: 37.5047, lng: 127.0245},
  {code: 'POI038', name: '신도림역', lat: 37.5089, lng: 126.8913},
  {code: 'POI039', name: '신림역', lat: 37.4844, lng: 126.9298},
  {code: 'POI040', name: '신촌·이대역', lat: 37.5561, lng: 126.9364},
  {code: 'POI041', name: '양재역', lat: 37.4844, lng: 127.0344},
  {code: 'POI042', name: '역삼역', lat: 37.5000, lng: 127.0364},
  {code: 'POI043', name: '연신내역', lat: 37.6190, lng: 126.9211},
  {code: 'POI044', name: '오목교역·목동운동장', lat: 37.5240, lng: 126.8748},
  {code: 'POI045', name: '왕십리역', lat: 37.5612, lng: 127.0375},
  {code: 'POI046', name: '용산역', lat: 37.5299, lng: 126.9649},
  {code: 'POI047', name: '이태원역', lat: 37.5344, lng: 126.9944},
  {code: 'POI048', name: '장지역', lat: 37.4781, lng: 127.1264},
  {code: 'POI049', name: '장한평역', lat: 37.5611, lng: 127.0642},
  {code: 'POI050', name: '천호역', lat: 37.5388, lng: 127.1239},
  {code: 'POI051', name: '총신대입구(이수)역', lat: 37.4869, lng: 126.9817},
  {code: 'POI052', name: '충정로역', lat: 37.5596, lng: 126.9632},
  {code: 'POI053', name: '합정역', lat: 37.5496, lng: 126.9137},
  {code: 'POI054', name: '혜화역', lat: 37.5823, lng: 127.0017},
  {code: 'POI055', name: '홍대입구역(2호선)', lat: 37.5577, lng: 126.9240},
  {code: 'POI056', name: '회기역', lat: 37.5895, lng: 127.0575},
  // 시장·상업지역
  {code: 'POI058', name: '가락시장', lat: 37.4922, lng: 127.1182},
  {code: 'POI059', name: '가로수길', lat: 37.5194, lng: 127.0233},
  {code: 'POI060', name: '광장(전통)시장', lat: 37.5663, lng: 127.0092},
  {code: 'POI061', name: '김포공항', lat: 37.5586, lng: 126.7909},
  {code: 'POI063', name: '노량진', lat: 37.5130, lng: 126.9426},
  {code: 'POI064', name: '덕수궁길·정동길', lat: 37.5658, lng: 126.9756},
  {code: 'POI066', name: '북촌한옥마을', lat: 37.5816, lng: 126.9841},
  {code: 'POI067', name: '서촌', lat: 37.5834, lng: 126.9734},
  {code: 'POI068', name: '성수카페거리', lat: 37.5444, lng: 127.0557},
  {code: 'POI070', name: '쌍문역', lat: 37.6519, lng: 127.0297},
  {code: 'POI071', name: '압구정로데오거리', lat: 37.5270, lng: 127.0386},
  {code: 'POI072', name: '여의도', lat: 37.5216, lng: 126.9244},
  {code: 'POI073', name: '연남동', lat: 37.5606, lng: 126.9217},
  {code: 'POI074', name: '영등포 타임스퀘어', lat: 37.5170, lng: 126.9063},
  {code: 'POI076', name: '용리단길', lat: 37.5309, lng: 126.9723},
  {code: 'POI077', name: '이태원 앤틱가구거리', lat: 37.5344, lng: 126.9957},
  {code: 'POI078', name: '인사동', lat: 37.5759, lng: 126.9852},
  {code: 'POI079', name: '창동 신경제 중심지', lat: 37.6543, lng: 127.0470},
  {code: 'POI080', name: '청담동 명품거리', lat: 37.5195, lng: 127.0569},
  {code: 'POI081', name: '청량리 제기동 일대 전통시장', lat: 37.5803, lng: 127.0255},
  {code: 'POI082', name: '해방촌·경리단길', lat: 37.5309, lng: 126.9723},
  // 랜드마크·복합시설
  {code: 'POI083', name: 'DDP(동대문디자인플라자)', lat: 37.5663, lng: 127.0092},
  {code: 'POI084', name: 'DMC(디지털미디어시티)', lat: 37.5800, lng: 126.8895},
  // 공원·자연
  {code: 'POI085', name: '강서한강공원', lat: 37.5586, lng: 126.8166},
  {code: 'POI086', name: '고척돔', lat: 37.4985, lng: 126.8669},
  {code: 'POI087', name: '광나루한강공원', lat: 37.5494, lng: 127.1188},
  {code: 'POI088', name: '광화문광장', lat: 37.5729, lng: 126.9769},
  {code: 'POI089', name: '국립중앙박물관·용산가족공원', lat: 37.5240, lng: 126.9803},
  {code: 'POI090', name: '난지한강공원', lat: 37.5664, lng: 126.8752},
  {code: 'POI091', name: '남산공원', lat: 37.5538, lng: 126.9810},
  {code: 'POI092', name: '노들섬', lat: 37.5175, lng: 126.9507},
  {code: 'POI093', name: '뚝섬한강공원', lat: 37.5303, lng: 127.0665},
  {code: 'POI094', name: '망원한강공원', lat: 37.5555, lng: 126.8947},
  {code: 'POI095', name: '반포한강공원', lat: 37.5133, lng: 126.9965},
  {code: 'POI096', name: '북서울꿈의숲', lat: 37.6206, lng: 127.0411},
  {code: 'POI098', name: '서리풀공원·몽마르뜨공원', lat: 37.4954, lng: 127.0093},
  {code: 'POI099', name: '서울광장', lat: 37.5658, lng: 126.9780},
  {code: 'POI100', name: '서울대공원', lat: 37.4349, lng: 126.9878},
  {code: 'POI101', name: '서울숲공원', lat: 37.5448, lng: 127.0374},
  {code: 'POI102', name: '아차산', lat: 37.5546, lng: 127.1034},
  {code: 'POI103', name: '양화한강공원', lat: 37.5347, lng: 126.8974},
  {code: 'POI104', name: '어린이대공원', lat: 37.5481, lng: 127.0811},
  {code: 'POI105', name: '여의도한강공원', lat: 37.5282, lng: 126.9328},
  {code: 'POI106', name: '월드컵공원', lat: 37.5681, lng: 126.8975},
  {code: 'POI107', name: '응봉산', lat: 37.5546, lng: 127.0199},
  {code: 'POI108', name: '이촌한강공원', lat: 37.5213, lng: 126.9697},
  {code: 'POI109', name: '잠실종합운동장', lat: 37.5133, lng: 127.0719},
  {code: 'POI110', name: '잠실한강공원', lat: 37.5200, lng: 127.0829},
  {code: 'POI111', name: '잠원한강공원', lat: 37.5200, lng: 127.0110},
  {code: 'POI112', name: '청계산', lat: 37.4348, lng: 127.0569},
  {code: 'POI113', name: '청와대', lat: 37.5862, lng: 126.9746},
  // 추가 상업지역
  {code: 'POI114', name: '북창동 먹자골목', lat: 37.5636, lng: 126.9824},
  {code: 'POI115', name: '남대문시장', lat: 37.5583, lng: 126.9775},
  {code: 'POI116', name: '익선동', lat: 37.5724, lng: 126.9913},
  {code: 'POI117', name: '신정네거리역', lat: 37.5252, lng: 126.8627},
  {code: 'POI118', name: '잠실새내역', lat: 37.5112, lng: 127.0861},
  {code: 'POI119', name: '잠실역', lat: 37.5133, lng: 127.1000},
  {code: 'POI120', name: '잠실롯데타워 일대', lat: 37.5133, lng: 127.1025},
  {code: 'POI121', name: '송리단길·호수단길', lat: 37.5133, lng: 127.1050},
  {code: 'POI122', name: '신촌 스타광장', lat: 37.5561, lng: 126.9364},
  {code: 'POI123', name: '보라매공원', lat: 37.4858, lng: 126.9242},
  {code: 'POI124', name: '서대문독립공원', lat: 37.5748, lng: 126.9586},
  {code: 'POI125', name: '안양천', lat: 37.5170, lng: 126.8520},
  {code: 'POI126', name: '여의서로', lat: 37.5216, lng: 126.9200},
  {code: 'POI127', name: '올림픽공원', lat: 37.5219, lng: 127.1227},
  {code: 'POI128', name: '홍제폭포', lat: 37.5906, lng: 126.9451}
];

// 혼잡도 데이터 직접 호출
export async function getCongestionData(lat: number, lng: number): Promise<CongestionData | null> {
  try {
    console.log(`[서울API] 혼잡도 데이터 API 호출: lat=${lat}, lng=${lng}`);

    // 가장 가까운 장소 코드 찾기
    let minDistance = Infinity;
    let nearestCode = 'POI001';

    for (const location of SEOUL_LOCATIONS) {
      const distance = Math.sqrt(
        Math.pow(lat - location.lat, 2) + Math.pow(lng - location.lng, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestCode = location.code;
      }
    }

    const apiUrl = `${BASE_URL}/${API_KEY}/json/citydata_ppltn/1/5/${nearestCode}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`혼잡도 API 호출 실패: ${response.status}`);
    }

    const responseText = await response.text();
    
    if (responseText.startsWith('<')) {
      console.error('API가 XML 형태로 응답했습니다:', responseText.substring(0, 100));
      return null;
    }

    const data = JSON.parse(responseText);

    if (data.RESULT?.['RESULT.CODE'] !== 'INFO-000') {
      console.error(`API 응답 에러: ${data.RESULT?.['RESULT.MESSAGE']}`);
      return null;
    }

    const congestionArray = data['SeoulRtd.citydata_ppltn'];
    if (!congestionArray || congestionArray.length === 0) {
      console.warn(`${nearestCode}에 대한 혼잡도 데이터가 없습니다.`);
      return null;
    }

    const congestionData = congestionArray[0];
    
    // UI와 호환되는 원시 API 형식으로 반환
    return {
      AREA_CD: nearestCode,
      AREA_NM: congestionData.AREA_NM,
      AREA_CONGEST_LVL: congestionData.AREA_CONGEST_LVL,
      AREA_CONGEST_MSG: congestionData.AREA_CONGEST_MSG,
      timestamp: new Date().toISOString(),
      cached: false
    };
  } catch (error) {
    console.error('[서울API] 혼잡도 데이터 로드 실패:', error);
    return null;
  }
}
