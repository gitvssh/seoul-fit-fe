---
class: plan
owner: frontend
last_verified: 2026-10-11
---

# 2026-10 UI/UX 리디자인 조사

공모전 이후 포트폴리오 품질로 끌어올리기 위해 2026-10-11에 수행한 조사다. 라이브
사이트 감사·코드 감사·디자인 방향· 인터랙션 라이브러리 실측·포트폴리오
프레젠테이션 조사 6건을 종합한 [보고서](report.md)가 구현 계획의 정본이며,
채택한 시각 언어는 [디자인 시스템](../../DESIGN_SYSTEM.md)에 요약했다.

| 문서                                                                           | 내용                                                                                                 |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| [report.md](report.md)                                                         | 4단계 리디자인 계획: 필수 수정 20선, 스택 정합, 토큰·타이포·카테고리, 라이브러리 결정표, 쇼케이스 층 |
| [live_site_ux_audit.md](live_site_ux_audit.md)                                 | 2026-10-11 seoulfit.damecasol.com 헤드리스 감사 (390/768/1440, 결함 32건)                            |
| [code_audit_map_core.md](code_audit_map_core.md)                               | 지도·마커·시트 코드 결함과 리디자인 제약 (리비전 da98ea5)                                            |
| [code_audit_shell_pages.md](code_audit_shell_pages.md)                         | 헤더·패널·보조 페이지·테마 기반·i18n·정리 대상                                                       |
| [design_direction_references.md](design_direction_references.md)               | 레퍼런스 비교, 결정 기록, paste-ready 토큰, 타이포, 카테고리 색, 모션                                |
| [map_interaction_patterns_libraries.md](map_interaction_patterns_libraries.md) | 바텀시트·마커·검색·칩·상태·다크모드 실측과 의존성 결정                                               |
| [portfolio_presentation.md](portfolio_presentation.md)                         | 평가자가 보는 것, README·About·품질 지표·안티패턴                                                    |

관찰 스크린샷(135장)과 실험 스크립트는 저장소에 넣지 않았다. 문서 안의
`(세션 스크래치패드)/...` 경로는 조사 당시의 로컬 작업 폴더를 가리키며, 사본은
소유자의 검토 자료 폴더(`D:\download\project\seoul-fit-fe\`)에 있다. 코드 인용의
`파일:라인`은 리비전 `da98ea5` 기준이라 이후 커밋에서 위치가 바뀔 수 있다.
