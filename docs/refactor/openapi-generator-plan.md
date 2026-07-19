# OpenAPI Generator 도입 계획

_작성일: 2025년 8월 21일_  
_버전: 1.0.0_  
_대상: Seoul Fit Frontend 프로젝트_

---

## 📋 목차

1. [개요](#-개요)
2. [도입 배경](#-도입-배경)
3. [OpenAPI Generator란?](#-openapi-generator란)
4. [기대 효과](#-기대-효과)
5. [구현 계획](#-구현-계획)
6. [실제 적용 예시](#-실제-적용-예시)
7. [마이그레이션 전략](#-마이그레이션-전략)
8. [베스트 프랙티스](#-베스트-프랙티스)

---

## 🎯 개요

**OpenAPI Generator**를 도입하여 백엔드 API 스펙으로부터 자동으로 TypeScript 클라이언트 코드를 생성하는 시스템을 구축합니다. 이를 통해 API 통신 레이어의 타입 안전성을 보장하고 개발 생산성을 향상시킵니다.

### 핵심 목표
- **타입 안전성**: API 응답/요청 타입 자동 생성
- **일관성**: 백엔드와 프론트엔드 간 스키마 동기화
- **생산성**: 보일러플레이트 코드 자동화
- **유지보수성**: API 변경사항 자동 반영

---

## 🌍 도입 배경

### 현재 문제점

#### 1. 수동 타입 정의의 한계
```typescript
// 현재: 수동으로 타입 정의
interface FacilityResponse {
  id: string;
  name: string;
  // ... 백엔드와 동기화 안됨
}

// 문제: 백엔드 변경 시 수동 업데이트 필요
```

#### 2. API 호출 코드 중복
```typescript
// 현재: 각 API마다 반복적인 코드
export const fetchFacilities = async () => {
  const response = await fetch('/api/facilities');
  if (!response.ok) throw new Error();
  return response.json();
};

// 매번 에러 처리, 헤더 설정 등 반복
```

#### 3. 타입 불일치 위험
- 백엔드 스키마 변경 시 런타임 에러 발생
- 컴파일 타임에 API 변경사항 감지 불가
- 프론트엔드와 백엔드 타입 정의 불일치

### 해결 방안
OpenAPI 스펙 기반 코드 자동 생성으로 위 문제들을 근본적으로 해결

---

## 📚 OpenAPI Generator란?

### 정의
OpenAPI Specification (이전 Swagger)을 기반으로 클라이언트 SDK, 서버 스텁, 문서 등을 자동 생성하는 도구

### 작동 원리
```
1. 백엔드에서 OpenAPI 스펙 제공 (openapi.yaml/json)
    ↓
2. OpenAPI Generator 실행
    ↓
3. TypeScript 클라이언트 코드 자동 생성
    ↓
4. 프론트엔드에서 생성된 코드 사용
```

### 생성되는 코드
- **API 클라이언트**: 모든 엔드포인트에 대한 메소드
- **타입 정의**: 요청/응답 DTO 타입
- **모델**: 도메인 모델 인터페이스
- **유틸리티**: 인증, 에러 처리 등

---

## 🎯 기대 효과

### 정량적 효과
- **개발 시간**: API 통합 시간 70% 감소
- **버그 감소**: 타입 관련 버그 90% 감소
- **코드량**: API 레이어 코드 60% 감소
- **유지보수**: API 변경 대응 시간 80% 감소

### 정성적 효과
- **개발자 경험**: 자동 완성 및 타입 체크
- **신뢰성**: 컴파일 타임 타입 검증
- **일관성**: 표준화된 API 클라이언트
- **문서화**: 자동 생성된 타입이 곧 문서

---

## 🛠️ 구현 계획

### Phase 1: 환경 구축 (Day 1-2)

#### 1. 필요 패키지 설치
```bash
# OpenAPI Generator CLI
npm install -D @openapitools/openapi-generator-cli

# TypeScript Axios 클라이언트 (선택사항)
npm install axios

# Fetch API 클라이언트 (대안)
npm install -D openapi-typescript
npm install openapi-fetch
```

#### 2. 설정 파일 생성
```json
// openapitools.json
{
  "generator": "typescript-axios",
  "generatorVersion": "7.0.0",
  "inputSpec": "./openapi.yaml",
  "outputDir": "./src/shared/api/generated",
  "globalProperties": {
    "apiDocs": false,
    "modelDocs": false
  },
  "configOptions": {
    "supportsES6": true,
    "withInterfaces": true,
    "enumPropertyNaming": "UPPER_CASE",
    "modelPropertyNaming": "camelCase"
  }
}
```

#### 3. 스크립트 추가
```json
// package.json
{
  "scripts": {
    "api:generate": "openapi-generator-cli generate",
    "api:validate": "openapi-generator-cli validate -i ./openapi.yaml",
    "api:update": "npm run api:validate && npm run api:generate",
    "prebuild": "npm run api:update"
  }
}
```

### Phase 2: OpenAPI 스펙 정의 (Day 3-5)

#### 백엔드 OpenAPI 스펙 예시
```yaml
openapi: 3.0.0
info:
  title: Seoul Fit API
  version: 2.0.0
  description: 서울시 공공시설 정보 API

servers:
  - url: http://backend:8080
    description: Cluster-internal backend
  - url: http://localhost:3000
    description: Development

paths:
  /facilities:
    get:
      summary: 시설 목록 조회
      operationId: getFacilities
      parameters:
        - name: category
          in: query
          schema:
            $ref: '#/components/schemas/FacilityCategory'
        - name: lat
          in: query
          schema:
            type: number
        - name: lng
          in: query
          schema:
            type: number
        - name: radius
          in: query
          schema:
            type: number
      responses:
        '200':
          description: 성공
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Facility'
        '400':
          $ref: '#/components/responses/BadRequest'
        '500':
          $ref: '#/components/responses/InternalError'

  /facilities/{id}:
    get:
      summary: 시설 상세 조회
      operationId: getFacilityById
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: 성공
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FacilityDetail'
        '404':
          $ref: '#/components/responses/NotFound'

components:
  schemas:
    FacilityCategory:
      type: string
      enum:
        - RESTAURANT
        - PARK
        - LIBRARY
        - SUBWAY
        - COOLING_CENTER
        
    Facility:
      type: object
      required:
        - id
        - name
        - category
        - position
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        category:
          $ref: '#/components/schemas/FacilityCategory'
        position:
          $ref: '#/components/schemas/Position'
        address:
          type: string
        congestionLevel:
          type: integer
          minimum: 1
          maximum: 5
          
    Position:
      type: object
      required:
        - lat
        - lng
      properties:
        lat:
          type: number
          format: double
        lng:
          type: number
          format: double
          
    FacilityDetail:
      allOf:
        - $ref: '#/components/schemas/Facility'
        - type: object
          properties:
            description:
              type: string
            openingHours:
              type: string
            phoneNumber:
              type: string
            amenities:
              type: array
              items:
                type: string
                
  responses:
    BadRequest:
      description: 잘못된 요청
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
            
    NotFound:
      description: 리소스를 찾을 수 없음
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
            
    InternalError:
      description: 서버 내부 오류
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
            
  schemas:
    Error:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: string
        message:
          type: string
        details:
          type: object
```

### Phase 3: 코드 생성 및 통합 (Day 6-7)

#### 1. 생성된 코드 구조
```
src/shared/api/generated/
├── api/
│   ├── facilities-api.ts       # API 클라이언트
│   └── auth-api.ts
├── models/
│   ├── facility.ts             # 타입 정의
│   ├── position.ts
│   └── index.ts
└── configuration.ts            # API 설정
```

#### 2. 생성된 코드 예시
```typescript
// src/shared/api/generated/api/facilities-api.ts
export class FacilitiesApi extends BaseAPI {
  /**
   * 시설 목록 조회
   */
  public getFacilities(
    category?: FacilityCategory,
    lat?: number,
    lng?: number,
    radius?: number,
    options?: AxiosRequestConfig
  ): Promise<AxiosResponse<Array<Facility>>> {
    return this.axios.get('/facilities', {
      params: { category, lat, lng, radius },
      ...options
    });
  }

  /**
   * 시설 상세 조회
   */
  public getFacilityById(
    id: string,
    options?: AxiosRequestConfig
  ): Promise<AxiosResponse<FacilityDetail>> {
    return this.axios.get(`/facilities/${id}`, options);
  }
}

// src/shared/api/generated/models/facility.ts
export interface Facility {
  id: string;
  name: string;
  category: FacilityCategory;
  position: Position;
  address?: string;
  congestionLevel?: number;
}

export enum FacilityCategory {
  RESTAURANT = 'RESTAURANT',
  PARK = 'PARK',
  LIBRARY = 'LIBRARY',
  SUBWAY = 'SUBWAY',
  COOLING_CENTER = 'COOLING_CENTER'
}
```

### Phase 4: 래퍼 레이어 구현 (Day 8-10)

#### API 클라이언트 래퍼
```typescript
// src/shared/api/client.ts
import { Configuration, FacilitiesApi, AuthApi } from './generated';
import { createLogger } from '@/shared/lib/logger';

const logger = createLogger('APIClient');

class APIClient {
  private config: Configuration;
  public facilities: FacilitiesApi;
  public auth: AuthApi;

  constructor() {
    this.config = new Configuration({
      basePath: process.env.NEXT_PUBLIC_API_URL,
      accessToken: this.getAccessToken,
    });

    this.facilities = new FacilitiesApi(this.config);
    this.auth = new AuthApi(this.config);

    this.setupInterceptors();
  }

  private getAccessToken = async () => {
    // 토큰 관리 로직
    return localStorage.getItem('accessToken') || '';
  };

  private setupInterceptors() {
    // 요청 인터셉터
    this.config.axios?.interceptors.request.use(
      (config) => {
        logger.debug('API Request', { 
          url: config.url,
          method: config.method 
        });
        return config;
      },
      (error) => {
        logger.error('API Request Error', error);
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터
    this.config.axios?.interceptors.response.use(
      (response) => {
        logger.debug('API Response', { 
          url: response.config.url,
          status: response.status 
        });
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          // 토큰 갱신 로직
          await this.refreshToken();
        }
        logger.error('API Response Error', error);
        return Promise.reject(error);
      }
    );
  }

  private async refreshToken() {
    // 토큰 갱신 구현
  }
}

export const apiClient = new APIClient();
```

#### React Query 통합
```typescript
// src/features/facility/api/use-facilities.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import type { FacilityCategory } from '@/shared/api/generated';

export const useFacilities = (
  category?: FacilityCategory,
  position?: { lat: number; lng: number }
) => {
  return useQuery({
    queryKey: ['facilities', category, position],
    queryFn: async () => {
      const response = await apiClient.facilities.getFacilities(
        category,
        position?.lat,
        position?.lng,
        1000 // 1km radius
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
};

export const useFacilityDetail = (id: string) => {
  return useQuery({
    queryKey: ['facility', id],
    queryFn: async () => {
      const response = await apiClient.facilities.getFacilityById(id);
      return response.data;
    },
    enabled: !!id,
  });
};
```

---

## 🔄 마이그레이션 전략

### 점진적 마이그레이션

#### 1단계: 새 API부터 적용
```typescript
// 새로운 API는 생성된 코드 사용
import { apiClient } from '@/shared/api/client';

const facilities = await apiClient.facilities.getFacilities();
```

#### 2단계: 기존 API 점진적 교체
```typescript
// 기존 코드
const fetchFacilities = async () => {
  const res = await fetch('/api/facilities');
  return res.json();
};

// 마이그레이션
const fetchFacilities = async () => {
  const { data } = await apiClient.facilities.getFacilities();
  return data;
};
```

#### 3단계: 레거시 코드 제거
- 모든 API 호출이 생성된 코드 사용
- 수동 타입 정의 제거
- 레거시 API 유틸리티 제거

### 호환성 레이어
```typescript
// src/shared/api/legacy-adapter.ts
// 기존 코드와의 호환성을 위한 어댑터
export const legacyApiAdapter = {
  async getFacilities() {
    const { data } = await apiClient.facilities.getFacilities();
    // 기존 형식으로 변환
    return data.map(transformToLegacyFormat);
  }
};
```

---

## ✅ 베스트 프랙티스

### 1. 스펙 버전 관리
```yaml
# openapi.yaml
info:
  version: 2.0.0  # 명시적 버전 관리
  x-api-version: '2024-01-15'  # 커스텀 버전 정보
```

### 2. CI/CD 통합
```yaml
# .github/workflows/api-generate.yml
name: Generate API Client

on:
  push:
    paths:
      - 'openapi.yaml'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run api:generate
      - uses: peter-evans/create-pull-request@v5
        with:
          title: 'Update generated API client'
          commit-message: 'chore: update generated API client'
```

### 3. 타입 확장
```typescript
// src/shared/api/extensions.ts
import { Facility } from './generated';

// 생성된 타입 확장
export interface FacilityWithDistance extends Facility {
  distance?: number;
  isOpen?: boolean;
}

// 유틸리티 타입
export type FacilityMap = Map<string, Facility>;
```

### 4. 에러 처리
```typescript
// src/shared/api/error-handler.ts
export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export const handleAPIError = (error: any): never => {
  if (error.response) {
    throw new APIError(
      error.response.status,
      error.response.data.code,
      error.response.data.message
    );
  }
  throw error;
};
```

### 5. 모킹 및 테스트
```typescript
// src/shared/api/__mocks__/client.ts
export const mockApiClient = {
  facilities: {
    getFacilities: jest.fn().mockResolvedValue({
      data: [/* mock data */]
    }),
    getFacilityById: jest.fn()
  }
};
```

---

## 📊 성공 지표

### 단기 (1개월)
- [ ] OpenAPI 스펙 작성 완료
- [ ] 코드 생성 파이프라인 구축
- [ ] 주요 API 3개 이상 마이그레이션

### 중기 (3개월)
- [ ] 전체 API의 50% 이상 생성 코드 사용
- [ ] 타입 관련 버그 50% 감소
- [ ] API 통합 시간 30% 단축

### 장기 (6개월)
- [ ] 100% API 자동 생성 코드 사용
- [ ] 타입 관련 런타임 에러 제로
- [ ] 백엔드-프론트엔드 스키마 100% 동기화

---

## 🚀 다음 단계 - **우선순위 조정** ⚠️

### ⏸️ **일시 보류 (Phase 3 이후로 연기)**
**이유**: App Layer 리팩토링이 우선순위
- OpenAPI Generator 도입 전에 아키텍처 정리 필요
- API 라우트 단순화 후 적용이 더 효과적

### 📋 **연기된 계획**
#### Phase 3.1: OpenAPI Generator 도입 (App Layer 리팩토링 완료 후)
1. OpenAPI Generator CLI 설치
2. 샘플 스펙으로 POC 구현  
3. 1개 API 엔드포인트 마이그레이션

#### Phase 3.2: 전면 적용
1. 백엔드팀과 OpenAPI 스펙 협의
2. 전체 API 스펙 문서화
3. 생성 코드 통합 테스트

#### Phase 3.3: 고도화
1. GraphQL 코드 생성 검토
2. Mock 서버 자동 생성
3. API 문서 자동화

### 💡 **보류 사유**
1. **아키텍처 우선**: FSD 구조 완성이 최우선
2. **복잡도 관리**: 동시 리팩토링은 위험성 증가
3. **효과성 극대화**: 정리된 구조에서 OpenAPI 적용이 더 효과적

---

## 📚 참고 자료

### 도구
- [OpenAPI Generator](https://openapi-generator.tech/)
- [openapi-typescript](https://github.com/drwpow/openapi-typescript)
- [Swagger Editor](https://editor.swagger.io/)

### 스펙
- [OpenAPI Specification](https://swagger.io/specification/)
- [JSON Schema](https://json-schema.org/)

### 예제
- [Petstore Example](https://petstore3.swagger.io/)
- [Real World OpenAPI](https://github.com/APIs-guru/openapi-directory)

---

## 🎯 결론

OpenAPI Generator 도입은 **타입 안전성과 개발 생산성을 동시에 확보하는 핵심 전략**입니다.

### 핵심 가치
1. **자동화**: 반복적인 코드 작성 제거
2. **일관성**: 백엔드-프론트엔드 스키마 동기화
3. **안정성**: 컴파일 타임 타입 검증
4. **생산성**: 개발 속도 대폭 향상

Seoul Fit 프로젝트는 이를 통해 **더 안정적이고 유지보수가 쉬운 코드베이스**를 구축할 수 있습니다.
