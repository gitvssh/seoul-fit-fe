# 환경 변수 설정 가이드

실제 변수 목록과 빌드타임/런타임 구분은 저장소 루트의 `.env.example`이 단일 기준이다.
로컬 개발에서는 이를 `.env.local`로 복사하고 필요한 값만 채운다.

```bash
cp .env.example .env.local
```

## 백엔드 URL

- `NEXT_PUBLIC_BACKEND_URL`: 브라우저가 OAuth와 API를 위해 직접 호출하는 URL이다.
  `NEXT_PUBLIC_*` 값이므로 `next build` 또는 Docker 빌드 시 이미지에 포함된다.
- `BACKEND_INTERNAL_URL`: Route Handler와 SSR 등 서버 코드가 런타임에 읽는 URL이다.
  Kubernetes에서는 클러스터 내부 Service 주소를 주입한다.

로컬에서는 두 변수를 생략하면 `src/config/environment.ts`의 loopback 기본값을 사용한다.
서버 코드는 `getBackendInternalUrl()`, 브라우저 코드는 `env.publicBackendUrl` 또는
`env.createPublicBackendEndpoint()`를 사용한다.

## API 키

- `NEXT_PUBLIC_KAKAO_CLIENT_ID`, `NEXT_PUBLIC_KAKAO_MAP_API_KEY`,
  `NEXT_PUBLIC_OPENWEATHER_API_KEY`: 브라우저 번들에 공개되는 빌드타임 값이다.
- `SEOUL_API_KEY`: 서버 컨테이너에만 주입하는 런타임 값이다.

실제 키가 든 `.env.local`은 커밋하지 않는다. `NODE_ENV`와 `NEXT_RUNTIME`은 Next.js가
관리하므로 직접 설정하지 않는다.
