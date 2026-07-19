# Seoul Fit Frontend 🏙️

> **AI 기반 서울시 공공시설 통합 네비게이터**  
> 실시간 데이터와 지능형 추천을 통해 서울의 공공시설을 발견하고, 탐색하며, 최적화된 경험을 제공합니다.

[![Next.js](https://img.shields.io/badge/Next.js-15.4.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.17-38B2AC)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 주요 기능

### 🗺️ **인터랙티브 지도 경험**
- **실시간 시설 시각화** - 성능을 위한 클러스터링 지원
- **다중 카테고리 필터링** (공원, 도서관, 문화공간, 맛집 등)
- **스마트 위치 기반 검색** - 자동 완성 기능
- **개인화된 시설 추천**

### 📊 **실시간 데이터 통합**
- **인기 시설의 실시간 혼잡도**
- **위치별 현재 날씨 정보** 및 예보
- **대중교통 통합** (서울지하철 역사 정보)
- **자전거 대여소** (서울자전거 "따릉이")

### 🎯 **스마트 기능**
- **AI 기반 추천** - 사용자 선호도 기반
- **시설 업데이트 및 알림 시스템**
- **다크/라이트 모드 지원** - 시스템 설정 자동 감지
- **모든 기기에 최적화된 반응형 디자인**

### 🔐 **사용자 경험**
- **카카오 로그인 통합** - 개인화된 경험 제공
- **선호도 관리** - 영구 저장 지원
- **접근성 우선 설계** - WCAG 가이드라인 준수
- **프로그레시브 웹 앱** 기능

---

## 🚀 빠른 시작

### 사전 요구사항

- **Node.js** 20.0 이상
- **npm** 9.0 이상
- **Git** 버전 관리용

### 설치 방법

1. **저장소 복제**
   ```bash
   git clone https://github.com/your-username/seoul-fit-fe.git
   cd seoul-fit-fe
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   루트 디렉토리에 `.env.local` 파일을 생성하세요:
   ```bash
   touch .env.local
   ```
   
   다음 환경 변수를 추가하세요:
   ```env
   # 카카오맵 API 키 (필수)
   NEXT_PUBLIC_KAKAO_MAP_API_KEY=your_kakao_map_api_key
   
   # 서울 열린데이터 API 키 (필수)
   SEOUL_API_KEY=your_seoul_open_data_key
   
   # 브라우저가 직접 호출할 백엔드 URL (빌드타임)
   NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8080

   # Route Handler가 호출할 백엔드 URL (런타임)
   BACKEND_INTERNAL_URL=http://127.0.0.1:8080
   ```
   
   ### 🔑 API 키 발급 방법:
   
   #### **카카오맵 API 키**
   1. [카카오 개발자 콘솔](https://developers.kakao.com/) 방문
   2. 새 애플리케이션 생성 또는 기존 애플리케이션 선택
   3. **"플랫폼"** → **"Web"** → 도메인 추가
   4. **"제품 설정"** → **"지도"** 서비스 활성화
   5. **"앱 설정"** → **"앱 키"**에서 **JavaScript 키** 복사
   
   #### **서울 열린데이터 API 키**
   1. [서울 열린데이터 광장](https://data.seoul.go.kr/) 방문
   2. 무료 계정 가입
   3. **"데이터 신청"** → **"나의 신청현황"** 이동
   4. **"API 키 신청"** 클릭
   5. 신청서 작성 (보통 즉시 승인)
   6. **인증키** 복사

4. **개발 서버 시작**
   ```bash
   npm run dev
   ```

5. **브라우저에서 확인**
   [http://localhost:3000](http://localhost:3000)으로 이동

---

## 🛠️ 개발

### 사용 가능한 스크립트

```bash
# 개발
npm run dev          # Turbopack으로 개발 서버 시작
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버 시작

# 코드 품질
npm run lint         # ESLint 실행
npm run lint:fix     # ESLint 문제 자동 수정
npm run type-check   # TypeScript 타입 검사
npm run format       # Prettier로 코드 포맷팅
npm run validate     # 모든 품질 검사 실행

# 유지보수
npm run clean        # 빌드 산출물 정리
```

### 프로젝트 구조

```
seoul-fit-fe/
├── app/                    # Next.js App Router 페이지
│   ├── api/               # API 라우트
│   ├── auth/              # 인증 페이지
│   └── globals.css        # 전역 스타일
├── components/            # React 컴포넌트
│   ├── auth/             # 인증 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   ├── map/              # 지도 관련 컴포넌트
│   └── ui/               # 재사용 가능한 UI 컴포넌트
├── hooks/                # 커스텀 React 훅
├── lib/                  # 유틸리티 라이브러리
├── services/             # API 서비스
├── store/                # 상태 관리 (Zustand)
├── styles/               # 추가 스타일시트
└── utils/                # 유틸리티 함수
```

### 기술 스택

#### **프론트엔드 핵심**
- **[Next.js 15.4.4](https://nextjs.org/)** - App Router를 사용한 React 프레임워크
- **[React 19.1.0](https://reactjs.org/)** - 최신 기능을 갖춘 UI 라이브러리
- **[TypeScript 5](https://www.typescriptlang.org/)** - 타입 안전한 JavaScript

#### **스타일링 & UI**
- **[TailwindCSS 3.4.17](https://tailwindcss.com/)** - 유틸리티 우선 CSS 프레임워크
- **[Radix UI](https://www.radix-ui.com/)** - 접근성이 우수한 컴포넌트 기본 요소
- **[Lucide React](https://lucide.dev/)** - 아름다운 아이콘 라이브러리

#### **상태 관리**
- **[Zustand](https://zustand-demo.pmnd.rs/)** - 경량 상태 관리
- **React Context** - 사용자 인증 및 선호도용

#### **지도 & 위치**
- **[카카오맵 API](https://apis.map.kakao.com/)** - 인터랙티브 지도
- **Geolocation API** - 사용자 위치 서비스
- **실시간 데이터** - 서울 열린데이터 광장 통합

#### **개발 도구**
- **[ESLint](https://eslint.org/)** - 엄격한 규칙의 코드 린팅
- **[Prettier](https://prettier.io/)** - 코드 포맷팅
- **[Turbopack](https://turbo.build/pack)** - 초고속 번들러

---

## 🗺️ 데이터 소스

이 애플리케이션은 여러 서울시 정부 API와 통합됩니다:

- **서울 열린데이터 광장** - 공공시설 정보
- **서울교통공사** - 지하철 실시간 데이터
- **서울자전거 (따릉이)** - 자전거 대여소 데이터
- **기상청** - 날씨 데이터
- **서울시 교통정보** - 실시간 혼잡도 데이터

---

## 🤝 기여하기

커뮤니티의 기여를 환영합니다! 자세한 내용은 [기여 가이드](CONTRIBUTING.md)를 참조하세요.

### 빠른 기여 단계

1. **저장소 포크**
2. **기능 브랜치 생성** (`git checkout -b feature/amazing-feature`)
3. **[코드 스타일 가이드](docs/guides/code-style.md)를 따라 변경사항 작성**
4. **품질 검사 실행** (`npm run validate`)
5. **변경사항 커밋** (`git commit -m 'Add amazing feature'`)
6. **브랜치에 푸시** (`git push origin feature/amazing-feature`)
7. **Pull Request 열기**

### 개발 가이드라인

- **TypeScript 모범 사례 준수**
- **포괄적인 테스트 작성** (곧 제공 예정)
- **100% 접근성 준수 유지**
- **명확한 주석으로 코드 문서화**
- **시맨틱 커밋 컨벤션 준수**

---

## 📚 문서

- 📖 **[시작하기 가이드](docs/guides/getting-started.md)**
- 🏗️ **[아키텍처 개요](ARCHITECTURE.md)**
- 🎨 **[컴포넌트 문서](docs/components/)**
- 🔧 **[API 참조](docs/api/)**
- 🚀 **[배포 가이드](docs/setup/deployment.md)**

---

## 🌍 브라우저 지원

| 브라우저 | 버전 |
|---------|---------|
| Chrome | ≥ 88 |
| Firefox | ≥ 85 |
| Safari | ≥ 14 |
| Edge | ≥ 88 |

---

## 📄 라이센스

이 프로젝트는 **MIT 라이센스** 하에 라이센스가 부여됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 🙏 감사의 말

- **서울특별시** - 열린데이터 API 제공
- **카카오** - 우수한 지도 서비스 제공
- **React 커뮤니티** - 놀라운 오픈소스 도구들
- **기여자들** - 이 프로젝트를 더 좋게 만들어주는 모든 분들

---

## 🔗 링크

- **[이슈 트래커](https://github.com/your-username/seoul-fit-fe/issues)** - 버그 신고
- **[토론](https://github.com/your-username/seoul-fit-fe/discussions)** - 커뮤니티 채팅
- **[로드맵](docs/community/roadmap.md)** - 향후 계획

---

<div align="center">
  <sub>서울 시민과 방문객을 위해 ❤️로 제작되었습니다</sub>
</div>
