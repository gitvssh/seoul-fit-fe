import type { Facility } from '@/lib/types';
import type { SearchItem } from '@/shared/lib/hooks/useSearchCache';
import { isValidSeoulCoordinate } from '@/shared/lib/utils/coordinate-validator';

// 카테고리별 상세 데이터 타입 정의
interface LibraryData {
  lbrryName?: string;
  name?: string;
  xcnts?: number;
  latitude?: number;
  ydnts?: number;
  longitude?: number;
  adres?: string;
  address?: string;
  telNo?: string;
  phoneNumber?: string;
  hmpgUrl?: string;
  website?: string;
  lbrrySeName?: string;
  codeValue?: string;
  opTime?: string;
  operatingHours?: string;
  fdrmCloseDate?: string;
  lbrrySeqNo?: string;
  guCode?: string;
}

interface ParkData {
  name?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  adminTel?: string;
  content?: string;
  useReference?: string;
  templateUrl?: string;
  area?: string;
  openDate?: string;
  mainEquipment?: string;
  mainPlants?: string;
  zone?: string;
  managementDept?: string;
  imageUrl?: string;
}

interface CulturalEventData {
  title?: string;
  latitude?: number;
  longitude?: number;
  place?: string;
  district?: string;
  orgName?: string;
  codeName?: string;
  useTarget?: string;
  eventDate?: string;
  startDate?: string;
  endDate?: string;
  orgLink?: string;
  homepageAddr?: string;
  useFee?: string;
  isFree?: string;
  themeCode?: string;
  ticket?: string;
  mainImg?: string;
  program?: string;
  etcDesc?: string;
}

interface CulturalReservationData {
  name?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  phoneNumber?: string;
  description?: string;
  reservationUrl?: string;
}

interface CoolingCenterData {
  name?: string;
  latitude?: number;
  longitude?: number;
  mapCoordY?: number;
  mapCoordX?: number;
  roadAddress?: string;
  lotAddress?: string;
  facilityType1?: string;
  facilityType2?: string;
  capacity?: number;
  areaSize?: string;
  remarks?: string;
}

interface RestaurantData {
  name?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  newAddress?: string;
  phone?: string;
  website?: string;
  operatingHours?: string;
  representativeMenu?: string;
  subwayInfo?: string;
}

type SearchDetailData =
  | LibraryData
  | ParkData
  | CulturalEventData
  | CulturalReservationData
  | CoolingCenterData
  | RestaurantData;

// 카테고리별 상세 데이터를 Facility로 변환하는 함수들
export function convertSearchResultToFacility(
  category: SearchItem['category'],
  data: SearchDetailData,
  searchItem: SearchItem
): Facility | null {
  try {
    let facility: Facility | null;
    switch (category) {
      case 'library':
        facility = convertLibraryToFacility(data, searchItem);
        break;
      case 'park':
        facility = convertParkToFacility(data, searchItem);
        break;
      case 'cultural_event':
        facility = convertCulturalEventToFacility(data, searchItem);
        break;
      case 'cultural_reservation':
        facility = convertCulturalReservationToFacility(data, searchItem);
        break;
      case 'cooling_center':
        facility = convertCoolingCenterToFacility(data, searchItem);
        break;
      case 'restaurant':
        facility = convertRestaurantToFacility(data, searchItem);
        break;
      default:
        console.warn('지원하지 않는 카테고리:', category);
        return null;
    }

    return isValidSeoulCoordinate(facility.position.lat, facility.position.lng) ? facility : null;
  } catch (error) {
    console.error('데이터 변환 실패:', error);
    return null;
  }
}

// 도서관 데이터 변환
function convertLibraryToFacility(data: LibraryData, searchItem: SearchItem): Facility {
  return {
    id: searchItem.id,
    name: data.lbrryName || data.name || searchItem.name,
    category: 'library',
    position: {
      lat: data.ydnts || data.latitude || 0,
      lng: data.xcnts || data.longitude || 0,
    },
    address: data.adres || data.address || searchItem.address || '',
    phone: data.telNo || data.phoneNumber,
    website: data.hmpgUrl || data.website,
    description: `${data.lbrrySeName || ''} | ${data.codeValue || ''}`
      .trim()
      .replace(/^\\|\\s*|\\s*\\|$/g, ''),
    congestionLevel: 'low',
    operatingHours: data.opTime || data.operatingHours,
  };
}

// 공원 데이터 변환
function convertParkToFacility(data: ParkData, searchItem: SearchItem): Facility {
  return {
    id: searchItem.id,
    name: data.name || searchItem.name,
    category: 'park',
    position: {
      lat: data.latitude || 0,
      lng: data.longitude || 0,
    },
    address: data.address || searchItem.address || '',
    phone: data.adminTel,
    description: data.content,
    congestionLevel: 'low',
    operatingHours: data.useReference,
    website: data.templateUrl,
  };
}

// 문화행사 데이터 변환
function convertCulturalEventToFacility(data: CulturalEventData, searchItem: SearchItem): Facility {
  return {
    id: searchItem.id,
    name: data.title || searchItem.name,
    category: 'cultural_event',
    position: {
      lat: data.latitude || 0,
      lng: data.longitude || 0,
    },
    address: `${data.place || ''} (${data.district || ''})`.trim(),
    phone: data.orgName ? `주최: ${data.orgName}` : undefined,
    description: `${data.codeName || ''} | ${data.useTarget || ''}`
      .trim()
      .replace(/^\\|\\s*|\\s*\\|$/g, ''),
    congestionLevel: 'low',
    operatingHours: data.eventDate || `${data.startDate} ~ ${data.endDate}`,
    website: data.orgLink || data.homepageAddr,
    culturalEvent: {
      id: searchItem.id,
      title: data.title || searchItem.name,
      description: data.etcDesc || `${data.codeName || ''} | ${data.useTarget || ''}`.trim(),
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      type: 'exhibition' as const,
      requiresReservation: false,
      reservationUrl: data.orgLink || data.homepageAddr,
      // 추가 속성
      codeName: data.codeName,
      district: data.district,
      eventDate: data.eventDate,
      place: data.place,
      orgName: data.orgName,
      useTarget: data.useTarget,
      useFee: data.useFee,
      isFree: data.isFree === '무료' || String(data.isFree) === 'true',
      themeCode: data.themeCode,
      ticket: data.ticket,
      mainImg: data.mainImg,
      program: data.program,
      etcDesc: data.etcDesc,
    },
  };
}

// 문화예약 데이터 변환
function convertCulturalReservationToFacility(
  data: CulturalReservationData,
  searchItem: SearchItem
): Facility {
  return {
    id: searchItem.id,
    name: data.name || searchItem.name,
    category: 'cultural_reservation',
    position: {
      lat: data.latitude || 0,
      lng: data.longitude || 0,
    },
    address: data.address || searchItem.address || '',
    phone: data.phoneNumber,
    description: data.description,
    congestionLevel: 'low',
    website: data.reservationUrl,
    isReservable: true,
  };
}

// 무더위쉼터 데이터 변환
function convertCoolingCenterToFacility(data: CoolingCenterData, searchItem: SearchItem): Facility {
  return {
    id: searchItem.id,
    name: data.name || searchItem.name,
    category: 'cooling_shelter',
    position: {
      lat: data.latitude || data.mapCoordY || 0,
      lng: data.longitude || data.mapCoordX || 0,
    },
    address: data.roadAddress || data.lotAddress || searchItem.address || '',
    congestionLevel: 'low',
  };
}

// 맛집 데이터 변환
function convertRestaurantToFacility(data: RestaurantData, searchItem: SearchItem): Facility {
  return {
    id: searchItem.id,
    name: data.name || searchItem.name,
    category: 'restaurant',
    position: {
      lat: data.latitude || 0,
      lng: data.longitude || 0,
    },
    address: data.address || data.newAddress || searchItem.address || '',
    phone: data.phone,
    website: data.website,
    operatingHours: data.operatingHours,
    description: data.representativeMenu,
    congestionLevel: 'low',
  };
}
