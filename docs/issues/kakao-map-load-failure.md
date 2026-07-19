# 카카오맵 로드 실패 이슈 분석 및 해결방안

_작성일: 2025년 8월 21일_  
_상태: 🔴 CRITICAL - 지도 기능 전체 장애_  
_영향범위: 모든 사용자_

---

## 🚨 이슈 개요

카카오맵 API가 로드되지 않아 지도 기능이 전체적으로 작동하지 않는 상황입니다.

---

## 🔍 문제 진단

### 1. 오류 증상
- 카카오맵 스크립트 로드 시 **404 에러** 발생
- 지도 컨테이너는 렌더링되나 지도가 표시되지 않음
- 콘솔에 "카카오맵 로드 실패" 메시지 출력

### 2. 원인 분석

#### API 응답 확인 결과
```bash
curl -I "https://dapi.kakao.com/v2/maps/sdk.js?appkey=8bb6267aba6b69af4605b7fd2dd75c96&autoload=false"

# 응답
HTTP/2 404 
x-apihub-error-from: apihub
```

**근본 원인**: API 키가 유효하지 않거나 도메인 등록이 되어있지 않음

### 3. 코드 분석

#### 현재 구현 (`hooks/useKakaoMap.ts`)
```typescript
script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&autoload=false`;
```

#### 환경변수 (`.env.local`)
```
NEXT_PUBLIC_KAKAO_MAP_API_KEY=8bb6267aba6b69af4605b7fd2dd75c96
```

---

## ✅ 해결 방안

### 즉시 조치사항 (Priority 1)

#### 1. 카카오 개발자 콘솔 확인
1. [카카오 개발자 사이트](https://developers.kakao.com) 접속
2. "내 애플리케이션" → 해당 앱 선택
3. 다음 사항 확인:
   - **JavaScript 키**: 현재 사용 중인 키와 일치하는지 확인
   - **플랫폼 설정**: Web 플랫폼이 등록되어 있는지 확인
   - **사이트 도메인**: 다음 도메인들이 모두 등록되어 있는지 확인
     - `http://localhost:3000`
     - `http://localhost:3001`
     - `https://seoul-fit.com` (프로덕션 도메인)

#### 2. 도메인 추가 등록
카카오 개발자 콘솔에서:
```
설정 > 플랫폼 > Web > 사이트 도메인에 추가:
- http://localhost:3000
- http://127.0.0.1:3000
- http://localhost:*
- 실제 배포 도메인 (환경별 등록)
```

#### 3. 카카오맵 API 활성화 확인
**2024년 12월 1일부터 신규 요구사항**:
1. 앱 설정 → 제품 설정 → 카카오맵
2. "카카오맵 API 사용" 활성화
3. 저장

### 코드 수정사항 (Priority 2)

#### 1. 에러 처리 개선
```typescript
// hooks/useKakaoMap.ts 수정
import { createLogger } from '@/src/shared/lib/logger';

const logger = createLogger('useKakaoMap');

export const useKakaoMap = ({ containerId, center, level = 3 }: UseKakaoMapOptions) => {
  // ... existing code ...

  const initializeMap = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      setMapStatus({ loading: true, success: false, error: null });

      // API 키 유효성 체크
      const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;
      if (!apiKey) {
        throw new Error('카카오맵 API 키가 설정되지 않았습니다');
      }

      // 개발 환경에서 API 키 로깅 (처음 8자리만)
      if (process.env.NODE_ENV === 'development') {
        logger.debug('API Key 확인', { 
          keyPrefix: apiKey.substring(0, 8) + '...' 
        });
      }

      // 이미 로드되어 있으면 바로 지도 생성
      const windowWithKakao = window as WindowWithKakao;
      if (windowWithKakao.kakao?.maps) {
        logger.debug('카카오맵 이미 로드됨');
        createMap();
        return;
      }

      // 기존 스크립트 제거 (중복 방지)
      const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
      if (existingScript) {
        existingScript.remove();
      }

      // 스크립트 로드
      const script = document.createElement('script');
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services,clusterer,drawing`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        logger.debug('카카오맵 스크립트 로드 성공');
        const windowWithKakao = window as WindowWithKakao;
        if (windowWithKakao.kakao?.maps) {
          windowWithKakao.kakao.maps.load(() => {
            logger.debug('카카오맵 API 초기화 완료');
            createMap();
          });
        } else {
          throw new Error('카카오맵 객체를 찾을 수 없습니다');
        }
      };

      script.onerror = (error) => {
        logger.error('카카오맵 스크립트 로드 실패', error as Error);
        setMapStatus({ 
          loading: false, 
          success: false, 
          error: '카카오맵 로드 실패 - API 키 또는 도메인 설정을 확인하세요' 
        });
      };

      document.head.appendChild(script);
    } catch (error) {
      logger.error('지도 초기화 실패', error as Error);
      setMapStatus({
        loading: false,
        success: false,
        error: error instanceof Error ? error.message : '지도 초기화 실패',
      });
    }
  }, [containerId]);

  // ... rest of the code
};
```

#### 2. 폴백 UI 제공
```typescript
// components/map/MapView.tsx
export const MapView: React.FC<MapViewProps> = ({ ... }) => {
  // ... existing code ...

  if (contextMapStatus?.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg p-8">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">지도를 불러올 수 없습니다</h3>
        <p className="text-gray-600 text-center mb-4">
          {contextMapStatus.error}
        </p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>
    );
  }

  // ... rest of the component
};
```

### 대체 방안 (Priority 3)

#### 새 API 키 발급 절차
1. [카카오 개발자 사이트](https://developers.kakao.com) 로그인
2. "애플리케이션 추가하기" 클릭
3. 앱 이름: "Seoul Fit Map"
4. 사업자명: (해당사항 입력)
5. 카테고리: "지도/네비게이션"
6. 생성 후 "앱 키" 메뉴에서 JavaScript 키 복사
7. `.env.local` 파일 업데이트

#### 환경변수 업데이트
```bash
# .env.local
NEXT_PUBLIC_KAKAO_MAP_API_KEY=새로_발급받은_JavaScript_키
```

---

## 🔧 검증 방법

### 1. API 키 유효성 테스트
```bash
# 터미널에서 실행
curl -I "https://dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_API_KEY&autoload=false"

# 정상 응답 예시
HTTP/2 200
content-type: application/javascript
```

### 2. 브라우저 콘솔 확인
```javascript
// 개발자 도구 콘솔에서 실행
window.kakao && window.kakao.maps
// 정상이면 객체가 출력됨
```

### 3. 네트워크 탭 확인
- 개발자 도구 → Network 탭
- `sdk.js` 파일이 200 상태로 로드되는지 확인
- 404 또는 403 에러가 없는지 확인

---

## 📋 체크리스트

### 즉시 확인 사항
- [ ] 카카오 개발자 콘솔에 로그인 가능한가?
- [ ] JavaScript API 키가 올바르게 설정되어 있는가?
- [ ] Web 플랫폼이 등록되어 있는가?
- [ ] localhost:3000이 도메인에 등록되어 있는가?
- [ ] 카카오맵 API가 활성화되어 있는가?
- [ ] API 일일 쿼터를 초과하지 않았는가?

### 코드 수정 사항
- [ ] Logger 시스템 적용
- [ ] 에러 메시지 개선
- [ ] 폴백 UI 구현
- [ ] 재시도 로직 추가

---

## 🚀 예방 조치

### 1. 환경별 API 키 분리
```bash
# .env.local (개발)
NEXT_PUBLIC_KAKAO_MAP_API_KEY_DEV=개발용_키

# .env.production (프로덕션)
NEXT_PUBLIC_KAKAO_MAP_API_KEY_PROD=프로덕션_키
```

### 2. 헬스체크 구현
```typescript
// utils/kakao-health-check.ts
export const checkKakaoMapHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}`,
      { method: 'HEAD' }
    );
    return response.ok;
  } catch {
    return false;
  }
};
```

### 3. 모니터링 추가
- API 호출 실패율 모니터링
- 일일 쿼터 사용량 추적
- 에러 발생 시 알림 설정

---

## 📊 영향도 분석

### 기능 영향
- **지도 표시**: 100% 장애
- **시설 마커**: 작동 불가
- **위치 검색**: 작동 불가
- **경로 안내**: 작동 불가

### 사용자 영향
- 모든 사용자가 지도 기능을 사용할 수 없음
- 핵심 서비스 전체 마비 상태

---

## 🎯 결론

**즉시 조치 필요**: 카카오 개발자 콘솔에서 API 키와 도메인 설정을 확인하고 수정해야 합니다.

### 우선순위
1. **P0**: 카카오 개발자 콘솔 설정 확인 (5분)
2. **P1**: 도메인 추가 등록 (10분)
3. **P2**: 코드 에러 처리 개선 (30분)
4. **P3**: 모니터링 시스템 구축 (2시간)

이 문제는 **설정 이슈**로 보이며, 코드 자체는 정상입니다. 카카오 개발자 콘솔에서 설정을 확인하면 즉시 해결 가능합니다.
