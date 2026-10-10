# 서울핏(Seoul Fit) 포트폴리오 쇼케이스화: 평가자 관점과 프레젠테이션 레이어 조사 노트

> 작성 기준일: 2026-10-11 (KST). 대상: https://seoulfit.damecasol.com , 저장소
> seoul-fit/seoul-fit-fe (소유자 fork: gitvssh/seoul-fit-fe).
>
> **읽는 법**
>
> - 근거 등급: **[A]** 회사 채용 페이지·공식 문서·1차 자료 / **[B]** 실무자
>   글·강의·벤더 블로그 / **[C]** 일화·익명 커뮤니티.
> - 노력(effort): **S** ≤ 0.5일, **M** 1–2일, **L** ≥ 3일. 이 값은 이 노트의
>   추정치이며 인용 근거가 아니다.
> - "직접 관찰/측정" = headless Chromium(Playwright 1.61, Chrome for
>   Testing 149)과 Lighthouse 13.5.0으로 2026-10-10 16:5x UTC(= 10-11 KST
>   01:5x)에 공개 URL을 로그인 없이 확인한 결과. 저장소는 읽기만 했고 수정하지
>   않았다.
> - 시크릿 값(저장소 `test-kakao-map.html`·공개 번들에 노출된 Kakao JS 키 등)은
>   의도적으로 기재하지 않는다.
> - 코드 레벨 결함(UI/UX, 죽은 코드, 토큰·타이포 등)은 같은 폴더의
>   `code_audit_map_core.md`, `code_audit_shell_pages.md`가 다룬다. 이 노트는
>   "무엇을 보여줄 것인가(프레젠테이션 레이어)"에 집중하고, 겹치는 항목은 해당
>   감사 노트의 결함 ID(D09, D12, D17, D25 등)를 교차 참조한다.
>
> **핵심 결론**
>
> 1. 토스는 공개 저장소만 보고 코드 품질·모듈화·디렉토리 구조·TypeScript
>    엄격성·제품 완성도·커밋/PR 단위·README를 평가한다고 밝혔다(2025-04).
>    카카오·당근 FAQ는 제출 형식만 안내하고, 카카오는 **링크가 사라지면 평가
>    불가**를 경고한다. → 저장소·라이브 URL·1–2쪽 PDF **세 입구 모두** 대비한다.
> 2. 지도 앱 앞에 전면 intro를 세우기보다 **지도 우선 + 닫을 수 있는 welcome
>    카드 + `/about` 케이스 스터디 + 데모 위치(라이브 데이터) + 빈/오류 상태
>    정비**가 근거 있는 조합이다(OSM·Strava·kepler.gl·Windy·서울시 도시데이터를
>    직접 확인, NN/g 온보딩·빈 상태 글).
> 3. 현재 첫인상의 최대 감점: 전면 영문·기본 스타일 쿠키 모달, 위치 거부 시
>    오류처럼 보이는 "서울 지금"과 콘솔 error 2건, `/places` 중복 카드, 영문
>    기본 404, About의 Website가 옛 Vercel 배포, 보일러플레이트 SVG·키 하드코딩
>    HTML·구버전 README.
> 4. README는 DarkAudit·HanGat_Map 구조(배너·CTA·문제/해결·스크린샷·데이터
>    원칙/출처/고지·Mermaid·측정 조건이 있는 품질 표·리뷰어 코드 지도·한계)로
>    재구성하고, 스크린샷·GIF는 Playwright headless + ffmpeg 로컬 스크립트로
>    생성한다.
> 5. 품질 지표는 **측정 조건과 함께**: 직접 측정한 베이스라인은 데스크톱
>    91/95/88/100, 모바일 기본 throttling 성능 45–56(무스로틀 100). 단일
>    숫자·최고점·"WCAG 준수" 단언·가짜 사용자 수치는 금지.
> 6. PWA는 manifest까지만, 서비스 워커·3D·애니메이션·스킬 바는 후순위(직접 근거
>    약함).
> 7. 못 찾은 것: 네이버·카카오·당근·우아한형제들의 사이드 프로젝트 평가
>    기준(공개 자료 없음), 토스 챕터 면접관 토크 본문, Reddit r/webdev, Kent C.
>    Dodds·Addy Osmani 가이드.

---

## 1) 평가자가 실제로 보는 것

### Takeaway

- 평가 기준을 직접 밝힌 한국 조직의 **1차 자료는 토스뿐**이며, 토스는 이력서
  없이 공개 저장소만 보고 "코드 품질·모듈화·디렉토리 구조·TypeScript 엄격성·제품
  완성도(성능/사용 경험)·커밋/PR 단위·README"를 평가한다고 명시했다. "화려한
  기술이나 코드 패턴"보다 "본질적인 코드의 고민"을 본다.
- 카카오·당근 채용 FAQ는 포트폴리오를 **URL로 내도 되지만 링크가 사라지면 평가할
  수 없다**(카카오), **PDF를 권장하고 웹 링크는 PDF 안에 넣으라**(당근)고
  안내한다. 즉 평가자는 서로 다른 입구(PDF → 라이브 URL → 저장소)로 들어오며, 세
  곳 모두 60초 안에 "무엇이고, 왜 이렇게 만들었고, 실제로 도는가"가 읽혀야 한다.
- 실무자 글은 대체로 일치한다: 라이브 데모 + 저장소, 맥락을 주는 README, 문제 →
  선택 이유/트레이드오프 → 결과, 한계의 정직한 표기, 작은 완성도 > 미완성 대형.
  2026년 자료는 여기에 "AI가 만든 결과물이 흔하니 **결정을 설명할 수 있는
  증거**가 신호"라는 점을 더한다. 반대로 "포트폴리오는 거의 안 본다"는 목소리도
  있어 평가자 행동은 균질하지 않다.

### Cited Findings

**한국 회사 1차 자료 [A]**

- 토스 프론트엔드 Head of Frontend(박서진)는 2025-04-08 글에서 이력서 없이
  저장소 링크로 지원받는다고 밝히며 "토스에는 여러분의 고민한 내용이 남긴 GitHub
  저장소 링크 하나만 제출하면 돼요.", "저희 프론트엔드 리더들은 오직 코드를
  기준으로 평가할게요."라고 썼다. 공개 저장소만 허용(재직 회사의 비공개 저장소
  금지)이고 접수 마감은 2025-05-31 23:59였다(현재 열려 있는지는 미확인). —
  [토스 프론트엔드에 이력서 없이 리포지토리 링크로 지원하세요](https://toss.tech/article/frontend-apply-without-resume)
- 같은 글의 "리포지토리 제출 가이드" 원문 항목: "모듈화 및 코드 품질을 지키기
  위해 고민한 리포지토리면 좋아요." / "명확한 디렉토리 구조로 코드 파일을 찾고
  수정하기 쉽도록 고민한 리포지토리면 좋아요." / "TypeScript를 정확하게 사용하기
  위해 고민한 리포지토리면 좋아요." / "제품의 완성도(성능 또는 사용 경험)를
  끌어올리기 위해 고민한 리포지토리면 좋아요." / "커밋이나 Pull Request를 읽기
  쉽게 나눠서 협업을 쉽게 한 리포지토리면 좋아요." / "화려한 기술이나 코드
  패턴보다는 본질적인 코드의 고민이 드러나는 리포지토리면 좋아요." / "프로젝트가
  어떤 것을 구현하는지 알 수 있는 README가 있는 리포지토리가 좋아요." 또한
  "토스는 프론트엔드 코드의 품질, 모듈화, 디렉토리 구조를 제일 중요하게
  생각해요." —
  [토스 테크](https://toss.tech/article/frontend-apply-without-resume)
- 같은 글 본문 키워드 검사에서 '테스트', '접근성', '배포', '데모'라는 단어는
  나타나지 않았다(WebFetch 키워드 검사 결과; 토스가 이를 무시한다는 뜻이 아니라
  **이 글의 평가 안내에는 명시되지 않았다**는 뜻). —
  [토스 테크](https://toss.tech/article/frontend-apply-without-resume)
- 토스 프론트엔드 채용 공고의 이력서 가이드: "그동안의 경험을 단순 나열하는 것이
  아닌, 경험 속에서의 임팩트 및 러닝 포인트를 기술해주세요." / "단순히 주어진
  업무를 해결한 것이 아니라 문제를 주도적으로 정의하고 기술적으로 해결한 사례를
  기술해주세요." / "특히 복잡하거나 반복되는 문제를 단순한 형태로 추상화한
  경험을 설명해주시면 좋아요." 자격 요건에는 React 웹 서비스 개발·운영 경험,
  브라우저 렌더링 성능 최적화 경험이 나온다. —
  [토스 Frontend Developer 공고](https://toss.im/career/job-detail?job_id=4076141003)
- 토스의 Frontend Fundamentals는 좋은 코드의 4기준을 "가독성(읽기 쉬운 정도) ·
  예측 가능성(함수/컴포넌트 동작을 얼마나 예측할 수 있는가) · 응집도(수정되어야
  할 코드가 항상 같이 수정되는가) · 결합도(수정 시 영향 범위)"로 정의하고 "좋은
  프론트엔드 코드는 변경하기 쉬운 코드예요."라고 말한다. 4기준을 동시에 만족하기
  어렵고 상황에 따라 우선순위를 정하라는 트레이드오프도 명시한다. —
  [Frontend Fundamentals](https://frontend-fundamentals.com/code-quality/code/)
- 카카오 채용 FAQ: "포트폴리오 파일 첨부 대신 URL로 넣어도 되나요? → URL을
  남겨주셔도 됩니다. 다만, 서류 검토 전 URL이 변경되거나 사라질 경우 포트폴리오
  확인이 불가하니 참고해 주시기 바랍니다." (직접 렌더링해 읽음, 2026-10-11) —
  [카카오 영입 FAQ](https://careers.kakao.com/faq)
- 당근 채용 FAQ: "서류 제출 양식은 없나요? → 지원자님을 가장 잘 표현할 수 있는
  형태로 자유롭게 제출해 주세요. · 파일 형식: PDF를 권장드려요. hwp, word는 호환
  문제가 있어 지양해 주세요. zip 파일은 제출이 불가하며, 웹 링크는
  이력서·포트폴리오 파일에 첨부해 주세요. · 언어: 국문 또는 영문 모두 가능하나,
  국내 포지션은 국문을 권장해요." —
  [당근 채용 FAQ(지원 관련)](https://careers.daangn.com/faq/%EC%A7%80%EC%9B%90-%EA%B4%80%EB%A0%A8/)
- 우아한형제들 "합류여정": 지원서 접수 → 1차 실무진 인터뷰("2~3명의 심사관이
  참석하여 다대일 방식으로, 약 1시간") → 2차 경영진 인터뷰 → 처우 협의. 경우에
  따라 "코딩테스트, 사전과제, 추가인터뷰, WSP, 평판조회" 등이 추가될 수 있다. 이
  페이지에는 포트폴리오·GitHub 평가에 관한 문구가 없다. —
  [우아한형제들 합류여정](https://career.woowahan.com/woowa-recruit-info)

**한국 실무자·플랫폼 글 [B]**

- 요즘IT(필자 한날, 2024-07-24): "채용 담당자는 서류 전형에서 이력서를 본 다음
  포트폴리오를 봅니다." / "결과물 위주로 내용을 구성하면 채용 담당자는
  프로젝트의 맥락을 읽을 수 없습니다." / "반드시 저장소 URL로 연결해야 한다면
  저장소의 소개를 친절하고 세세하게 README.md에 담아 설명해야 합니다." / 데모
  영상은 "로그인이나 페이지 접속 과정은 과감히 잘라내고 바로 핵심을 보여줘야
  해요." 커밋 기록이 뒤섞이면 담당자가 길을 잃는다고 경고한다. —
  [뽑히는 개발자 포트폴리오는 어떻게 만드나요?](https://yozm.wishket.com/magazine/detail/2686/)
- 알체라 블로그(2025-12-21, 필자 미표기): "처음부터 끝까지 직접 구현한 경험을
  우선합니다.", "소규모라도 완성도가 높은 것이 미완성 대형 프로젝트보다 나으며",
  "GitHub Pages, Netlify, Vercel로 무료 호스팅하며 커스텀 도메인으로 전문성을
  높입니다.", "기술 선택 이유와 고려 사항을 설명하고 트레이드오프와 대안을
  논의하여 사고 과정을 전달합니다.", "트러블슈팅 경험을 상세히 기록하고". —
  [알체라 개발자 포트폴리오 글](https://www.alchera.ai/resource/blog/developer-portfolio)
- 인프런 블로그(2022-06-10, 이력서 TIP): "프로젝트 경험은 가장 중요한
  영역이에요.", "구체적인 프로젝트 내용을 알 수 있는 사이트나 노션 링크가 있으면
  첨부하는 것도 추천해 드려요.", "기술적 문제를 적극적으로 해결한 사례가 있으면
  적어주세요." (3년 이상 지난 자료) —
  [인프런 개발자 이력서 작성 TIP](https://www.inflearn.com/blogs/2119)
- 인프런 강의 소개문(2025-05-26, 문태훈 강사)에 "React Todo App? I've seen
  hundreds of them already."라는 채용 담당자 반응 문구가 있다(강의 홍보
  문구이므로 근거로는 약함). —
  [인프런 웹 프론트엔드 포트폴리오 강의](https://www.inflearn.com/en/course/웹-프론트엔드-포트폴리오)
- 익명 커뮤니티 Q&A(2026-07-20, 백엔드 신입 기준, 답변자 4명): 3명은 PDF 기본 +
  GitHub/웹 보조, 1명은 웹 포트폴리오 기본 + PDF 요약본. "이력서는 면접관이 '이
  지원자가 어떤 경험을 했는지' 판단하는 첫 단계"라는 답변도 있다. 답변자 신원은
  검증되지 않았다. —
  [코멘토 Q&A](https://comento.kr/job-questions/모든회사/sw개발/개발직군_신입%20공채%20지원%20시%20포트폴리오%20관련%20질문%20있습니다-632217)

**글로벌 자료**

- GreatFrontEnd(2026-06-17, 팀 저술, 인용된 외부 인물 없음) [B]: 프로젝트
  카드에서 라이브 데모로 연결, README에 setup·기능 목록·한계 표기, 쓰지 않는
  파일 제거, "Loading, empty, and error states should be visually different.",
  "If something is mocked, say it is mocked.", 일부 평가자는 GitHub을 먼저
  열므로 저장소 청결이 중요, 시크릿 창에서 메인 플로우·모바일 폭·README 명령을
  새 폴더에서 재현해 보는 "clean-room check"를 권한다. 핵심 질문은 "이 사람에게
  주니어 프론트엔드 과제를 맡겨도 되는가"이며 답은 About이 아니라 작업물에서
  나와야 한다고 본다. (WebFetch 요약 경유) —
  [GreatFrontEnd](https://www.greatfrontend.com/blog/how-to-build-frontend-developer-portfolio-with-no-experience)
- Ask HN "What projects do hiring managers like to see?"(2025-02-22): purvesta —
  "the main thing I want to see is that you're passionate about your work.",
  여러 달 이어진 한 프로젝트(기술 교체·리팩터링·릴리스), 의미 있는 커밋
  메시지(모호한 "Updated stuff." 싫음). gregjor — "I look for a history of
  growth and accomplishments.", "I want someone who shows a focus on solving
  business problems rather than a focus on languages, tools, frameworks, etc.",
  대학 과제·튜토리얼류(to-do 앱)는 비선호, 그러나 포트폴리오는 "mostly get
  barely glanced at"이라고도 말한다. 댓글 3개 규모의 작은 스레드다. [C/B] —
  [HN 43134745](https://news.ycombinator.com/item?id=43134745) (본문은 미러
  [hn.svelte.dev](https://hn.svelte.dev/item/43134745)에서 확인)
- Josh Comeau(무료 e-book 소개 페이지): "As a junior developer, your portfolio
  of projects is the greatest asset you have.", "I recommend showcasing between
  2 and 5 projects.", "A portfolio site isn't supposed to be an index of
  everything you've ever created, it should be a highlight reel.", 포트폴리오
  사이트는 고용주를 "guide"하는 도구라고 설명한다. 팟캐스트 목차에는 "Don't put
  skill bars on your website! What do they even mean?!"이 있다(본문 설명은
  페이지에 없음). [B] —
  [joshwcomeau.com/effective-portfolio](https://joshwcomeau.com/effective-portfolio/)
  ; [Scrimba 팟캐스트 72](https://podcast.scrimba.com/72)
- SocialTalent(Lee Flanagan, 2026-08-23): "A resume used to be proof of work
  already done. Now it risks becoming proof of work AI already did.", "The
  interview is now the only place left to find out what they can actually do."
  평가 신호로 "How the candidate explains a decision, not just what they
  decided"를 든다. 채용 컨설팅/교육사 블로그로 연구 논문이 아니다. [B] —
  [SocialTalent](https://www.socialtalent.com/?p=96405)
- 익명 일화(미러 스냅샷, 2025-12-26 캡처): r/cscareerquestionsCAD "Are junior
  portfolios being replaced by AI-generated noise?" — 토론토 중견사 채용
  매니저가 "90% of the Personal Projects they see now are clearly built using
  Cursor or Windsurf"라며 주니어 GitHub 링크를 안 본다는 이야기. 같은 글의
  최상위 댓글(126점)은 "Nobody looked at GitHub even before AI.", 다른 댓글은
  GitHub 프로젝트가 면접 대화에 도움이 됐다고 반박한다. [C] —
  [Reddit 미러 스냅샷](https://reddit.sentinel-team.org/posts/1ps4yet/snapshots/2025-12-26T18%3A31%3A31.46825Z)

**서로 엇갈리는 지점**

- 토스(코드만 본다)와 당근·익명 Q&A(PDF가 기본, 링크는 보조)와 HN
  gregjor("barely glanced")는 평가자 행동이 조직·직무에 따라 다르다는 뜻이다. —
  [토스](https://toss.tech/article/frontend-apply-without-resume) ;
  [당근 FAQ](https://careers.daangn.com/faq/%EC%A7%80%EC%9B%90-%EA%B4%80%EB%A0%A8/)
  ; [HN](https://news.ycombinator.com/item?id=43134745)
- "평가자는 대략 60초 안에 거른다"는 체크리스트(홈 10초 → 대표 프로젝트 라이브
  데모 → 코드·README 순)는 벤더 블로그의 주장이며 검증된 채용 통계가 아니다. 또
  다른 가이드의 "73% of hiring managers…"(Stack Overflow 2024 설문 인용이라고
  주장)는 원출처를 확인하지 못해 제외했다. —
  [devplaybook 체크리스트](https://devplaybook.cc/blog/developer-portfolio-checklist-20-things-hiring-managers)
  ; [hakia](https://www.hakia.com/skills/building-portfolio/) (둘 다 신뢰 낮음,
  반례 예시로만 인용)

### Inferences

- **높은 신호(평가자가 실제로 가중하는 것)**: ① 코드 구조·모듈화·타입
  엄격성(토스) ② 제품 완성도 = 로딩·빈/오류 상태·모바일(토스, GreatFrontEnd) ③
  README의 맥락·한계(토스, 요즘IT, 알체라) ④ 문제 → 선택 이유/트레이드오프
  서사(토스 공고, 알체라, SocialTalent) ⑤ 커밋/PR 위생(토스, HN) ⑥ 링크가 살아
  있고 정확함(카카오 FAQ, GreatFrontEnd). 낮은 신호: 장식적 애니메이션, 스킬 바,
  뱃지 남발, 오프라인 PWA(→ §6).
- Seoul Fit 자산과 매핑: FSD형 구조(`src/entities·features·widgets·shared`),
  `tsconfig` `strict: true`, Jest 테스트(정적 집계 262개 `it/test` 호출),
  `docs/`의 접근성 체크리스트·관측성·불변 릴리스·BACKLOG의 트레이드오프 기록은
  이미 토스 기준에 맞는 **재료**다. 문제는 재료가 첫 화면(README/URL/PDF)에 안
  올라와 있다는 점이다. —
  [tsconfig.json](file:///home/lsh/dev/side/seoul-fit-fe/tsconfig.json) ;
  [docs/BACKLOG.md](file:///home/lsh/dev/side/seoul-fit-fe/docs/BACKLOG.md) ;
  [docs/ACCESSIBILITY_CHECKLIST.md](file:///home/lsh/dev/side/seoul-fit-fe/docs/ACCESSIBILITY_CHECKLIST.md)
- 카카오 FAQ가 경고한 "링크 소실"은 이 프로젝트에서 구체적 위험이다: 저장소
  About의 Website가 옛 Vercel 배포(`seoul-fit.vercel.app`, 제목 "Seoul Fit Map",
  "데이터 로딩 중… 0개 시설" 화면)를 가리킨다(§3). 정식 URL을 하나로 고정해야
  한다.
- AI 보조 개발이 일반화된 시기에는 "결정을 설명할 수 있는가"가 신호이므로
  ADR/트레이드오프 문서(예: 단일 replica 고정 이유가 이미 BACKLOG에 있음)가 작은
  노력으로 큰 차별점이 된다.
- 사용자·트래픽이 없는 것은 약점이 아니다. 평가 기준(토스 글)에 사용자 수가
  없고, 오히려 가짜 지표가 신뢰를 깎는다(§5·§6).

### Gaps

- 네이버·카카오·당근·우아한형제들 **프론트엔드 사이드 프로젝트 평가 기준을 직접
  밝힌 공개 자료는 찾지 못했다**(카카오·당근 FAQ는 제출 형식만, 우아한형제들
  페이지는 포트폴리오 언급 없음, 네이버 채용 FAQ는 렌더링해도 본문을 얻지 못함).
- 토스 프론트엔드 챕터 면접관 토크("Next.js, 그만 쓰세요")는 X 게시물 소개문만
  확인했고 본문/영상을 읽지 못했다. —
  [X 게시물](https://x.com/TossFrontend/status/1862002803075690607) (소개문만)
- 한국 개발 유튜버·velog/tistory 글은 검색에서 면접관 관점의 1차 증언을 찾지
  못했다(Medium 일부는 403). Reddit r/webdev는 검색 도구가 차단되어 직접
  인용하지 못했다.
- Kent C. Dodds, Addy Osmani의 포트폴리오/채용 가이드는 검색에서 찾지 못했다.
- "평가자가 포트폴리오에 쓰는 시간"에 대한 신뢰할 만한 통계는 없다.

---

## 2) 인앱 프레젠테이션 권장안

### Takeaway

- 지도 우선 앱 앞에 전면 intro/hero를 세우는 것은 근거가 약하다. 확인한 지도
  제품(OpenStreetMap, Strava Heatmap, Windy, kepler.gl, 서울시 실시간
  도시데이터)은 모두 **도구가 먼저**이고, 설명은 닫을 수 있는 카드·모달·"?"
  도움말·샘플 데이터 링크로 곁들인다. NN/g도 온보딩은 "가능하면 만들지 말고"
  맥락 도움말을 쓰라고 한다.
- 권장 조합: ① `/`는 지도 그대로 ② 첫 방문 1회만 뜨는 **닫을 수 있는 welcome
  카드**(모달 아님) + 상시 "?" ③ 별도 `/about` 케이스 스터디(평가자용 입구) ④
  위치 권한이 없어도 "살아 있는" 기본 상태(데모 위치 + 라이브 데이터) ⑤ 빈/오류
  상태에 상태·학습 단서·다음 행동 제공 ⑥ "이런 걸 눌러 보세요" 시나리오 칩.
- 현재 첫인상의 가장 큰 감점 요인은 intro 부재보다 **(a) 전면 쿠키 모달(영문
  문구·기본 파란 버튼) (b) 위치 거부 시 오류처럼 보이는 기본 상태와 콘솔 에러
  (c) 공개 목록의 중복 카드 (d) 영문 기본 404**다. 이 넷은 S~M 노력으로 해결되고
  효과가 크다.

### Cited Findings

**현재 상태(직접 관찰, 2026-10-11 KST, headless Chromium, 로그인 없음)**

- [O1] 첫 방문 시 화면 전체를 덮는 "쿠키 설정" 모달: 체크박스 "analytics", 영문
  설명 "Anonymous page and feature usage analytics.", 버튼 "모두 수락 / 모두
  거부 / 내 선택 확인"(기본 파란 버튼). 홈(`/`)과 존재하지 않는 URL(404)
  모두에서 같은 모달이 뜬다. README는 GA4가 Zaraz 소유라고 적는다. Zaraz 문서는
  동의 모달이 "첫 방문에 자동 표시"되고 `zaraz.showConsentModal()`로 다시 열 수
  있다고 설명하지만 문구·스타일·번역 커스터마이징은 다루지 않는다. —
  [seoulfit.damecasol.com](https://seoulfit.damecasol.com/) ;
  [Cloudflare Zaraz Consent](https://developers.cloudflare.com/zaraz/consent-management/)
  ; [README.md](file:///home/lsh/dev/side/seoul-fit-fe/README.md)
- [O2] 동의를 닫으면 지도 우선 화면: 헤더에 **로고 타일만 있고 "Seoul
  Fit"/"서울핏" 워드마크가 없음**, 검색창 placeholder
  `장소 또는 "한산한 실내 도서관" 검색`(예시 질의가 이미 있음), English 토글,
  "장소 둘러보기", 햄버거 메뉴, 좌측 패널(현 지도 N곳 / 내 생활 / 목록 보기 /
  지역 선택 / **서울 지금** / 필터 칩 / 상황별 추천 6칩 / 추천 카드 / 짧은 활동
  계획). 서버 렌더 HTML에는 `HomeLanding`(제목·설명·6개 카테고리 카드)이 있으나
  hydration 직후 지도 레이아웃으로 교체된다(감사 노트 D17). —
  [seoulfit.damecasol.com](https://seoulfit.damecasol.com/) ;
  [code_audit_shell_pages.md](./code_audit_shell_pages.md)
- [O3] 위치 권한이 없을 때(headless 기본) "서울 지금" 카드가 주황 글씨로 "이
  위치의 실시간 도시데이터를 확인할 수 없어 일반 장소 정보로 추천합니다." + 칩
  "기준 시각 미확인"을 보여 주고, 추천 3건이 모두 "57점", "확인: 운영시간을
  확인할 수 없어요"이며 "시청역"이 연속 2번 나온다. 첫 화면의 핵심 기능(서울
  지금·점수·근거)이 **실패/빈 상태로 보인다**. —
  [seoulfit.damecasol.com](https://seoulfit.damecasol.com/)
- [O4] 로드 시 콘솔 error 2건:
  `[MapView] 위치 가져오기 실패: GeolocationPositionError`,
  `GPS 오류: User denied Geolocation`. Lighthouse Best Practices가
  `errors-in-console`, `geolocation-on-start`로 지적했다. —
  [seoulfit.damecasol.com](https://seoulfit.damecasol.com/)
- [O5] 존재하지 않는 URL은 Next.js 기본 영문 화면("404 / This page could not be
  found."). `/about`, `/privacy`, `/terms`, `/manifest.webmanifest`,
  `/apple-touch-icon.png`, `/icon.svg`는 모두 404. 감사 노트도 루트
  `not-found.tsx` 부재를 지적한다(D09). —
  [404 예시](https://seoulfit.damecasol.com/this-page-does-not-exist)
- [O6] 공개 목록 `/places/park`(총 266곳)에서 같은 장소가 두 번씩 나온다(두 열에
  동일 카드; HTML에서 같은 `/places/park/{id}` 링크가 2회). 렌더 코드는
  `result.content.map`을 한 번만 돈다 → API/데이터 쪽 중복 가능성이 높으나
  원인은 진단하지 않았다. 공개 SEO 페이지의 눈에 띄는 결함이다. —
  [/places/park](https://seoulfit.damecasol.com/places/park) ;
  [page.tsx](file:///home/lsh/dev/side/seoul-fit-fe/app/places/[category]/page.tsx)
- [O7] 로그아웃 상태의 "내 생활" 서랍: "로그인하면 여러 기기에서 이어집니다.
  로그인 전 저장한 장소는 이 기기에 안전하게 남아 있습니다. 왼쪽 메뉴에서
  로그인해 주세요." — 로그인 버튼은 **오른쪽** 메뉴 하단에 있고 CTA 버튼이
  없다(감사 D12). 로그인 버튼 색은 `#facc15`(Tailwind yellow-400)로 샘플링되며
  카카오 가이드의 `#FEE500`/radius 12px/공식 심볼 규정과 다르다(감사 D25).
  로그인 전에도 장소 저장이 된다는 문구는 **게스트 사용이 이미 가능**함을
  시사한다(저장 동작 자체는 확인하지 않음). —
  [seoulfit.damecasol.com](https://seoulfit.damecasol.com/) ;
  [카카오 로그인 디자인 가이드](https://developers.kakao.com/docs/ko/kakaologin/design-guide)
- [O8] 390×844 모바일에서 좌측 패널이 지도 대부분을 덮는다(감사 D02). —
  [seoulfit.damecasol.com](https://seoulfit.damecasol.com/)
- [O9] 공개 `<head>`는 `favicon.ico`만 있고 OG/Twitter 태그는 완비(1200×630 PNG,
  66 KB, 텍스트 카드). 홈 `<title>`은 "서울 공공시설 지도"로 브랜드가 없고 하위
  페이지는 "서울 공원 | Seoul Fit"이다. —
  [seoulfit.damecasol.com](https://seoulfit.damecasol.com/) ;
  [/opengraph-image](https://seoulfit.damecasol.com/opengraph-image)
- [O10] GitHub About의 Website는 옛 배포 `https://seoul-fit.vercel.app`이다(제목
  "Seoul Fit Map", "데이터 로딩 중... 0개 시설", "지도 마커 설정" 패널). 정식
  URL은 `seoulfit.damecasol.com`. —
  [seoul-fit.vercel.app](https://seoul-fit.vercel.app/) ;
  [gitvssh/seoul-fit-fe](https://github.com/gitvssh/seoul-fit-fe) ;
  [seoul-fit/seoul-fit-fe](https://github.com/seoul-fit/seoul-fit-fe)
- 캡처 파일(로컬):
  `…/scratchpad/shots/seoulfit_damecasol_com__desktop.png`(모달),
  `…__desktop_after.png`(동의 후), `…__mobile_after.png`,
  `…_places_park_desktop_after.png`, `seoulfit_my_life.png`,
  `seoulfit_menu.png`, `seoulfit_og.png`.

**참고 제품(직접 열어 본 구조, 2026-10-11, headless)**

- OpenStreetMap — 지도 우선. 왼쪽 패널에 "Welcome to OpenStreetMap!" + 한 문장
  소개("OpenStreetMap is a map of the world, created by people like you and free
  to use under an open license.") + 이용약관 문장 + 두 버튼 "Learn More"/"Start
  Mapping" + 닫기(X). 우측 컨트롤 스택에 "?" 도움말, 하단 "© OpenStreetMap
  contributors · Make a Donation · Website and API terms" 저작자 표기. —
  [openstreetmap.org](https://www.openstreetmap.org/)
- Strava Global Heatmap — 지도 우선(검색·"All
  Sports"·"Heatmaps/Segments"·"Create Route"). 일러스트 + 두 문장 설명("The
  Global Heatmap shows which roads and trails athletes have used most over the
  last 12 months…")의 닫을 수 있는 모달 "See Heatmaps"(Sign up/Log in), 쿠키
  동의는 **하단 가로 배너**로 지도를 일부만 가린다(Accept All / Customize /
  Reject Non-Essential). —
  [strava.com/maps/global-heatmap](https://www.strava.com/maps/global-heatmap)
- kepler.gl 데모 — 도구로 바로 진입, "Add Data To Map" 모달 우상단에 "No data?
  Try sample data", 하단에 "kepler.gl is a client-side application with no
  server backend. Data lives only on your machine/browser…" 프라이버시 문구. —
  [kepler.gl/demo](https://kepler.gl/demo)
- Citymapper — 랜딩 히어로("Making Cities Usable") 안에 실제 도구 입력("Get Me
  Somewhere — Plan a journey on our web app", Start/End/Now·Arrive·Leave/GO,
  도시 전환)이 들어 있다. 마케팅 + 도구 진입의 하이브리드. —
  [citymapper.com](https://citymapper.com/)
- AllTrails — 히어로 "Find your next adventure" + 검색창 + "Create a trip /
  Build custom route / Nearby trails" CTA, 하단에 "Top cities / Top parks / Top
  trails" 링크 목록(크롤 가능한 디렉터리, Seoul Fit의 `/places`와 같은 역할). —
  [alltrails.com](https://www.alltrails.com/)
- Windy — 인트로 없이 전체 화면 지도 + 레이어 메뉴(Weather radar, Satellite,
  Wind, Rain/thunder, Temperature…) + 하단 타임라인, "© OpenStreetMap
  contributors". — [windy.com](https://www.windy.com/)
- Felt — B2B 마케팅 랜딩. 히어로에 LAT/LON/BRG/ZOOM/CRS 좌표 HUD 모티프를 써서
  장식이 제품 정체성과 맞닿아 있다. — [felt.com](https://felt.com/)
- 서울시 실시간 도시데이터(Seoul Fit "서울 지금"의 데이터 원천 도메인) —
  "리스트로 보기 / 지도로 보기" 토글, 카테고리
  탭(전체보기·고궁·문화유산·공원·관광특구·발달상권·인구밀집지역), "총 121곳",
  "혼잡도 높은 순" 정렬, 사진 카드 + **색과 텍스트를 함께 쓴 상태
  알약**(붐빔/약간 붐빔/보통/여유), 로딩 문구 "데이터를 수신하고 있습니다.
  조금만 기다려주세요." —
  [data.seoul.go.kr/SeoulRtd](https://data.seoul.go.kr/SeoulRtd/)
- earth.nullschool.net(제한적 확인) — 메뉴의 "About this site", "Provide
  feedback", 데이터 출처(NOAA) 고지, "do not show this message again"이 있는
  공지 모달. — [earth.nullschool.net](https://earth.nullschool.net/)

**데모/게스트/샘플 데이터 사례**

- DarkAudit README(2026 공모전 출품작): "로그인 없이 바로 사용할 수 있고, 준비된
  데모 진단 결과를 바로 볼 수 있습니다"와 데모 결과 딥링크를 README 최상단에
  둔다. — [sogeumbbang/DarkAudit](https://github.com/sogeumbbang/DarkAudit)
- Immich README: "Demo" 섹션에 데모 URL과 로그인 자격(표)을 공개한다. —
  [immich-app/immich](https://github.com/immich-app/immich)
- kepler.gl: 데이터가 없는 방문자를 위한 "Try sample data". NN/g가 소개한 Loggly
  빈 상태는 "로그 소스 추가"와 "데모 데이터 불러오기" 두 경로를 제시한다. —
  [kepler.gl/demo](https://kepler.gl/demo) ;
  [NN/g Empty States](https://www.nngroup.com/articles/empty-state-interface-design/)

**패턴 근거**

- NN/g(Alita Kendrick, 2020-06-21, 모바일 앱 대상): "avoid creating app
  onboarding whenever possible", 사용하면서 배울 수 있어야 하며 "users should be
  able to learn the interface by using it", 맥락 팁이 낫고 "instructional
  overlays are often nice-to-have and not need-to-have elements", "we don't
  recommend deck-of-cards onboarding", "Avoid feature-promotion onboarding at
  first launch." —
  [NN/g Mobile-App Onboarding](https://www.nngroup.com/articles/mobile-app-onboarding/)
- NN/g(Kate Kaplan, 2021-09-19): 빈 상태 3원칙 = ① 시스템 상태 전달(비어
  있는지/로딩인지/실패인지) ② 학습 단서 ③ 핵심 작업으로 가는 직접 경로. 로딩 중
  "No records"를 보이면 신뢰를 해친다. —
  [NN/g Empty States](https://www.nngroup.com/articles/empty-state-interface-design/)
- Lighthouse `geolocation-on-start`: "Always request geolocation permission
  after a user action, not on page load.", "Assume users won't give you their
  locations,"(거부 시 대체 경로 필요). —
  [Chrome Developers](https://developer.chrome.com/docs/lighthouse/best-practices/geolocation-on-start)
- 카카오맵 저작권 표기: Web API에서 copyright 위치는 좌하단/우하단 중 선택,
  "copyright 문구는 반드시 표출되어야 합니다"(2020-10-20 답변; 답변자 역할
  표기는 없음). 지도 캡처 사용은 "오프라인 출처 표기 가이드를 준수하여 사용
  가능"(2023-04-19 답변; 가이드 원문은 확보하지 못함). —
  [DevTalk 110301](https://devtalk.kakao.com/t/copyright/110301) ;
  [DevTalk 128939](https://devtalk.kakao.com/t/topic/128939)
- Next.js: 루트 `app/not-found.tsx`가 매칭되지 않는 모든 URL을 처리하며 기본
  화면은 OS 색상 모드를 따른다. 404 응답에는 `noindex`가 자동 주입된다. —
  [Next.js not-found](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)

### Inferences

**권장 구성(어디에, 왜, 노력)**

| 요소                              | 권장          | 위치·형태                                                                                                                                                                                                              | 이유(근거)                                                                                                     | 노력 |
| --------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---- |
| 전면 landing hero                 | 비권장        | `/`를 막지 않음                                                                                                                                                                                                        | 확인한 지도 제품은 모두 도구 우선, NN/g는 온보딩 최소화. SSR `HomeLanding`과 hydration 불일치 위험(D17)도 있음 | -    |
| Welcome 카드                      | 권장          | 좌측 패널 상단(모바일은 바텀시트 상단)에 **모달 아닌 카드**, 닫으면 localStorage로 기억, 내용: 한 문장 가치 제안 + 시나리오 칩 3개 + "이 프로젝트 소개 →"                                                              | OSM/Strava 패턴, NN/g의 "dismissible, timely, unobtrusive"                                                     | S–M  |
| 상시 "?" / "이 앱은?"             | 권장          | 헤더(워드마크 옆) → welcome 재열기·`/about`·데이터 출처                                                                                                                                                                | OSM의 "?"·Help·About, earth.nullschool의 About 링크                                                            | S    |
| `/about` 케이스 스터디            | **강력 권장** | 새 라우트. 평가자용 입구(§3의 README와 같은 구조)                                                                                                                                                                      | 토스 공고("문제를 주도적으로 정의하고 기술적으로 해결"), 요즘IT(맥락), 알체라(트레이드오프), Josh(안내자 역할) | M    |
| 데모/게스트 모드                  | 권장          | ① 위치 권한 없을 때 **데모 위치(시청/광화문 등)**를 명시("기준: 서울시청 · 위치 권한 없음")하고 근처 도시데이터 지점의 실제 값을 표시 ② 로그인 없이 되는 기능(저장 등)을 안내 ③ 로그인 전용(알림)은 스크린샷/샘플 상태 | DarkAudit·Immich·kepler.gl의 "바로 체험" 패턴, NN/g Loggly                                                     | M    |
| 위치 요청 방식                    | 필수          | 자동 요청 제거, "내 위치" 버튼에서만 요청, 거부는 info 로그                                                                                                                                                            | Lighthouse `geolocation-on-start`, O4                                                                          | S    |
| "Try these" 칩                    | 권장          | 검색창 아래 3–5개(예: "비 오는 날 갈 만한 실내", "한산한 도서관", "오늘 열리는 행사") — 기존 6개 상황 프리셋·자연어 검색 재사용                                                                                        | NN/g 학습 단서 + 직접 경로, placeholder에 이미 예시 있음(O2)                                                   | S–M  |
| 빈/오류 상태 스토리               | 권장          | ① "서울 지금" 위치 없음 → 오류 톤 제거, 샘플 지점+기준 시각 ② "내 생활" 로그아웃 → 버튼 CTA, 방향 문구 수정(D12) ③ 지도 SDK 실패 ④ 404 디자인                                                                          | NN/g 3원칙, O3·O7·O5                                                                                           | S–M  |
| 쿠키 동의 UI                      | **필수 정리** | 모달 → 하단 가로 배너, 한국어 목적명·설명, 브랜드 색 버튼(Zaraz 설정에서 가능한지 확인)                                                                                                                                | Strava의 하단 배너 대비, O1                                                                                    | S    |
| 온보딩 투어(말풍선 순서 튜토리얼) | 비권장        | -                                                                                                                                                                                                                      | NN/g: deck-of-cards·기능 홍보형 온보딩 비권장                                                                  | -    |

**`/about` 구성안(허구 수치 없이)**

1. 한 문장 가치 제안 + 실제 화면 3장 또는 GIF 1개 + "지도에서 열기" 딥링크 3개
2. 문제와 접근: 왜 "지금 갈 곳"인가, 데이터 흐름(서울 열린데이터광장 → 서버 캐시
   → 점수화 → 근거 표시) 다이어그램 1장
3. 설계 결정과 트레이드오프 3–5개(예: 규칙 기반 점수 + 근거 표시, 단일
   replica·프로세스 내 캐시와 그 이유, SSR 공개 페이지 + 클라이언트 지도, 불변
   이미지 digest 릴리스)
4. 데이터·출처·고지(§4·§5): 데이터셋별 제공기관·이용허락범위·갱신 주기,
   카카오맵·로그인 고지, "공식 서비스가 아님"
5. 품질 현황(측정일·도구·조건 포함, §5), 알려진 한계·로드맵
6. 링크: GitHub, docs, (PDF 1–2쪽 요약)

**우선순위 메모**

- 쿠키 모달·위치 요청·404·중복 카드는 "평가자가 3초 안에 보는 결함"이라 신규
  기능(welcome 카드, /about)보다 **먼저** 고친다.
- 평가자는 사용자가 아니므로 `/about`이 welcome 카드보다 가치가 크다. welcome
  카드는 일반 방문자용 부가 요소다.
- "서울 지금"은 Seoul Fit의 차별점인데 첫 화면에서 실패 상태로 보인다. 데모
  위치 + 기준 시각 + 근거를 보여 주는 기본 상태가 가장 큰 체감 개선이다.
- Kakao 지도 캡처(스크린샷·OG·README)에는 카카오 로고/저작권이 잘리지 않게
  남긴다.

### Gaps

- Zaraz 대시보드 설정을 볼 수 없어 모달 문구·스타일을 설정만으로 바꿀 수 있는지
  확인하지 못했다(문서는 커스터마이징을 다루지 않음).
- 카카오 저작권 규정은 DevTalk 게시글 수준이며 공식 정책 원문과 "오프라인 출처
  표기 가이드"를 읽지 못했다.
- 로그인 이후 화면, 실제 모바일 기기, `?preset=` 같은 시나리오 딥링크 지원
  여부는 확인하지 못했다.
- NN/g 온보딩 글은 모바일 앱 대상(2020)이며 웹 지도 앱에 대한 적용은 추론이다.

---

## 3) README/저장소 권장 구조

### Takeaway

- 직접 읽어 확인한 한국어 우수 사례의 공통 골격은 **배너·한 줄 가치·"바로가기"
  CTA → 문제/해결 표 → 화면(스크린샷 표 + GIF) → 체험 방법 → 데이터
  원칙·출처·고지 → 아키텍처(Mermaid) → 테스트/성능(측정 조건 포함) → 로컬 실행 →
  한계와 다음 단계 → 팀/라이선스**다. 가장 가까운 선례는 공공데이터 지도 공모전
  출품작 **한갓지도(HanGat_Map)**와 평가자용 코드 지도를 둔 **DarkAudit**이다.
- 여러 저장소가 "README는 서비스 소개 중심으로 짧게, 개발 상세는 docs/로
  분리"하는 개편을 했다. GitHub 공식 문서도 README에는 "개발자가 시작하고
  기여하는 데 필요한 정보"만 두라고 한다.
- Seoul Fit은 재료(Mermaid 아키텍처, 접근성 체크리스트, 불변 릴리스·관측성
  문서)가 이미 있으나 README가 **구버전 서술(Next.js 15), 스크린샷·CTA 없음,
  About의 Website가 옛 배포**여서 첫 화면이 약하다.

### Cited Findings

**GitHub 공식 가이드 [A]**

- README에는 "What the project does / Why the project is useful / How users can
  get started / Where users can get help / Who maintains and contributes"를
  담고, "A README should only contain information necessary for developers to
  get started using and contributing to your project."라고 한다. `.github`,
  루트, `docs` 중 한 곳에 두면 자동 노출되고, 상대 링크·이미지 경로를 권장하며,
  500 KiB 초과는 잘린다. —
  [About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
- 소셜 프리뷰: "at least 640 by 320 pixels (1280 by 640 pixels for best
  display)", PNG/JPG/GIF 1 MB 미만, 공개 저장소만, 미설정 시 "basic information
  about the repository and the owner's avatar"가 나온다. —
  [Social media preview](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview)
- Topics는 최대 20개이며 저장소 메인 페이지에 표시된다. —
  [Topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics)
- Community profile 체크 항목: README, code of conduct, license, contributing,
  security policy, issue templates(`.github/ISSUE_TEMPLATE`). —
  [Community profiles](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/about-community-profiles-for-public-repositories)
- GitHub는 Mermaid를 Markdown에서 네이티브로 렌더링한다(```mermaid). —
  [Creating diagrams](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams)
- 첨부 한도: 이미지·GIF 10 MB, 영상 10 MB(무료 플랜 소유 저장소)/100 MB(유료),
  영상은 mp4·mov·webm(H.264 권장). README 렌더링 여부는 이 문서에 없음. —
  [Attaching files](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files)
- awesome-readme 큐레이션은 "Embedding an animated gif in your README quickly
  demonstrates what your project does and catches the reader's eye.", 아키텍처
  문서는 "Diagrams, source code maps, and discussing invariants and design
  decisions are essential."이라고 정리한다. —
  [matiassingers/awesome-readme](https://github.com/matiassingers/awesome-readme)

**한국어 README 사례(원문 직접 확인) [B]**

- **한갓지도 HanGat_Map**(2026 관광데이터 활용 공모전 출품작, 제주 혼잡 예보
  지도). 원문 헤딩: 한갓지도(배너 이미지·한 줄 가치·서비스/기술 배지) → 이런
  문제를 풉니다 → 핵심 기능 → **화면(스크린샷 6장, 3×2 표)** → **데이터를 다루는
  원칙** → **활용 공공데이터(표: 데이터/제공/쓰임/갱신, "적재 규모(2026-09-20
  기준)")** → 기술 스택 → 아키텍처(Mermaid) → 야간 배치 → 프로젝트 구조 → 로컬
  실행 → 테스트("903건"/"853건"과 실행 명령) → 브랜치 규칙 → 팀(담당·GitHub 표)
  → **고지**. 인상적인 문장: "없는 값을 0으로 채우지 않습니다.", "생성형 AI는
  주어진 후보 안에서 선택과 배열만 하고, 혼잡도·거리·날씨 숫자를 만들지
  않습니다.", "혼잡 정보는 예측 자료이며 실제 혼잡과 다를 수 있습니다.", "본
  서비스는 한국관광공사가 운영하지 않으며, 서비스 소유권은 개발 팀에 있습니다."
  (별 수는 낮음 — 구조 품질 기준으로 선정) —
  [Jeju-Seonbi/HanGat_Map](https://github.com/Jeju-Seonbi/HanGat_Map) (raw
  README 확인)
- **DarkAudit**(sogeumbbang, 2026 공모전 "심사용" README, 385줄·이미지 30장):
  배너 → "서비스 바로가기" 버튼 → "로그인 없이 바로 사용할 수 있고, 준비된 데모
  진단 결과를 바로 볼 수 있습니다" + 데모 딥링크 → 문서 배지(평가 결과, 시스템
  구성도)와 기술 배지(`tests-428_passed` 포함) → 문제/해결 표 →
  NOTE("DarkAudit은 법령 위반을 판정하지 않습니다…") → 실제 화면 → 사용 방법
  STEP 1–6 → 동작 방식(다이어그램) → **성능**(측정 조건 한 줄: 모델·합성 흐름
  22개·110화면·3회 평균·2026-10-02, Precision/Recall/F1 표, "정답은 생성기가
  심은 패턴 기준인 개발용 합성 데이터입니다") → **심사 포인트별 코드 위치(표:
  보고 싶은 것/위치/한 줄 설명)** → 신뢰성과 보안(테스트 수: AI 160·백엔드
  168·프런트 Vitest 101·E2E 84) → **한계와 다음 단계**("평가는 합성 데이터
  기준이며… 업무 효과는 아직 측정 전입니다") → 로컬 실행 → 팀. —
  [sogeumbbang/DarkAudit](https://github.com/sogeumbbang/DarkAudit) (raw README
  확인)
- **Rilog**(우아한테크코스 팀, Next.js 16.3 + Spring Boot): 123줄, 헤딩 = 시스템
  개요(Mermaid) · 저장소 구조 · 기술 스택과 현재 역할 · 로컬 개발 · 검증.
  이미지·배지·라이브 링크는 없음. docs/에 ADR·품질 게이트 문서를 두고 링크한다.
  스택이 Seoul Fit과 가까운 "엔지니어링 중심 README"의 예이자 첫인상 요소가 빠진
  반례. —
  [woowacourse-teams/2026-rilog](https://github.com/woowacourse-teams/2026-rilog)
  (raw README 확인)
- **PoFol Frontend**(Next.js 16): 소개 · 핵심 기능 · 기술 스택 표 ·
  아키텍처(Server Component는 세션 확인 후 백엔드 직접 호출, Client Component는
  axios 인터셉터로 401 재발급, `/api/*` rewrites) · 폴더 구조 · 시작하기 · 환경
  변수 표 · 문서. 스크린샷 없음, 라이브 링크는 About에만. —
  [PoFol-Capstone/Frontend](https://github.com/PoFol-Capstone/Frontend)
  (WebFetch 요약 경유)
- **자취선배**(우아한테크코스 팀): 실행 환경 · 문서(제품/QA/개발·운영) · 저장소
  구조 · 로컬 실행, dev/prod URL 나열. 스크린샷·다이어그램 없음. —
  [woowacourse-teams/2026-jachwi-sunbae](https://github.com/woowacourse-teams/2026-jachwi-sunbae)
  (WebFetch 요약 경유)
- README 개편 PR 제목(본문은 열지 않음): "docs: README를 심사용 한 페이지로
  줄이고 개발·평가 문서를 분리한다"(DarkAudit #18), "docs: README를 서비스 소개
  중심으로 다시 쓰고 개발 정보를 문서로 옮긴다"(Fundit-FE #473), "docs(readme):
  프로젝트 소개용 재구성 — 팀·역할·결과·한계·시연 GIF"(auto-pharmacist #340),
  "시연 GIF 추가, README·PROJECT_DOCS … 갱신"(goodjob #22). —
  [DarkAudit #18](https://github.com/sogeumbbang/DarkAudit/pull/18) ;
  [Fundit-FE #473](https://github.com/KT-Cloud-Tech-Up-team6/Fundit-FE/pull/473)
  ; [auto-pharmacist #340](https://github.com/Jik-Kim/auto-pharmacist/pull/340)
  ; [goodjob #22](https://github.com/sharppink/goodjob/pull/22)
- 영문 사례: Lighthouse 배지와 데스크톱/모바일 점수 표를 README 상단에 둔 개인
  포트폴리오. 섹션 = Lighthouse · Features · Performance & accessibility notes ·
  Tech stack · Run locally · License. —
  [MariosKalantzis/PortfolioV2](https://github.com/MariosKalantzis/PortfolioV2)
- Korean README 작성 가이드(velog)는 제목·로고·소개·배포 주소·시작 가이드·기술
  스택·주요 기능·회고 링크·라이선스 순서를 제안한다(Best-README-Template 기반).
  — [velog mangojang](https://velog.io/@mangojang/github-README-작성)

**공공데이터·지도 고지 요건 [A]**

- 서울 열린데이터광장: "이용제한없음을 제외하고 어느 유형이든 출처(발행연도,
  해당 공공기관명과 홈페이지 URL, 저작물 작성자의 성명이 표시된 경우에는 그
  성명도 포함)는 반드시 표시하여야 함". 표기 예시 "본 저작물은 서울특별시에서
  ○○○○년 작성하여 공공누리 제○유형으로 개방한 '저작물명(작성자:○○○)'를
  이용하였으며, 해당 저작물은 서울시 열린데이터광장 누리집(홈페이지)
  'data.seoul.go.kr'에서 무료로 다운받으실 수 있습니다." 제1유형은 출처표시 +
  상업적 이용·변경 가능, 제2/4유형은 비상업적만, 제3/4유형은 변경 금지.
  데이터마다 조건이 다르므로 각 데이터셋 상세 화면에서 확인해야 하고, 공공누리가
  없는 자료는 사전 협의가 필요하다. —
  [서울 열린데이터광장 이용허락 안내](https://data.seoul.go.kr/etc/openInfo.do)
- 카카오맵: copyright 문구 표출 필수(DevTalk 답변), 카카오 로그인 버튼은
  `#FEE500` 컨테이너·radius 12px·공식 심볼 필수·심볼 변형/CI 대체 금지. —
  [DevTalk 110301](https://devtalk.kakao.com/t/copyright/110301) ;
  [카카오 로그인 디자인 가이드](https://developers.kakao.com/docs/ko/kakaologin/design-guide)

**Seoul Fit 저장소의 현재 상태(직접 확인)**

- README.md 헤딩: Seoul Fit Frontend / 현재 구성 / 로컬 실행 / 환경 변수 역할 /
  배포 / (저장소 구조·License). "Next.js 15 App Router"라고 쓰지만
  `package.json`은 `next ^16.3.1`. Mermaid 아키텍처 다이어그램은 있음.
  스크린샷·GIF·라이브 CTA 없음(운영 URL은 본문 문장에만). —
  [README.md](file:///home/lsh/dev/side/seoul-fit-fe/README.md) ;
  [package.json](file:///home/lsh/dev/side/seoul-fit-fe/package.json)
- GitHub About: fork는 description "2025 공개SW개발자대회 프론트", Website
  `https://seoul-fit.vercel.app`, topics 없음, ★0. upstream은 topics
  `publicdata`, `seoul`, ★1, MIT. 소셜 프리뷰 이미지 없음(상위 저장소 페이지
  기준). — [gitvssh/seoul-fit-fe](https://github.com/gitvssh/seoul-fit-fe) ;
  [seoul-fit/seoul-fit-fe](https://github.com/seoul-fit/seoul-fit-fe) (GitHub
  API 조회)
- `docs/`에 ACCESSIBILITY_CHECKLIST(검증일 2026-07-25), BACKLOG(트레이드오프
  기록), IMMUTABLE_RELEASE, OBSERVABILITY, PRODUCT_IMPLEMENTATION_PLAN,
  SEO_ANALYTICS_IMPLEMENTATION_PLAN이 있고
  LICENSE(MIT)·CODE_OF_CONDUCT·SECURITY가 있다.
  CONTRIBUTING·ISSUE_TEMPLATE·`docs/decisions`(ADR)는 없다. —
  [docs/](file:///home/lsh/dev/side/seoul-fit-fe/docs)
- 추적된 잔재 파일: `public/{file,globe,next,vercel,window}.svg`(create-next-app
  보일러플레이트), 루트 `test-kakao-map.html`(카카오 지도 키 하드코딩 — 값 기재
  안 함), 루트 `pages/` Router 잔재(D05), 중복 `SideBar`(감사 노트 §5.2). —
  [test-kakao-map.html](file:///home/lsh/dev/side/seoul-fit-fe/test-kakao-map.html)
  ; [public/](file:///home/lsh/dev/side/seoul-fit-fe/public) ;
  [code_audit_shell_pages.md](./code_audit_shell_pages.md)

### Inferences

**권장 README 구조(한국어, 한 화면 + 아래로 깊어지는 순서)**

1. **상단 블록(접기 전)**: 배너 이미지(소셜 프리뷰와 같은 아트, 1280×640) · 한
   줄 가치 제안("지금 서울에서 갈 만한 곳을 근거와 함께 고르는 지도") ·
   `서비스 바로가기` 버튼(정식 URL 1개) · 데모 딥링크 2–3개 · 배지
   3–4개만(서비스, 테스트 수, 품질 측정일 링크) · GIF 1개(10–15초, "서울 지금 →
   상황별 추천 → 활동 계획").
2. **이런 문제를 풉니다** 표(지금의 문제 / Seoul Fit의 해결) 3행.
3. **화면**: 데스크톱 3 + 모바일 3 스크린샷 표(서울 지금, 상황별 추천+근거, 활동
   계획, 장소 상세, 목록, 영어 전환). 카카오 로고·저작권이 잘리지 않게 캡처,
   캡처 날짜 표기.
4. **체험 방법**: 로그인 없이 되는 것/로그인(카카오)이 필요한 것을 표로
   구분(로그아웃 상태 저장은 이미 가능), 로그인 전용 기능은 스크린샷으로 대체.
5. **데이터를 다루는 원칙 + 활용 데이터 표**(데이터 / 제공기관 / 이용허락범위 /
   갱신 주기 / 쓰임) + **고지**(공공누리 출처 문구, 카카오맵·로그인, "서울시가
   운영하는 서비스가 아닌 개인 프로젝트", 추천은 규칙 기반이며 실제 상황과 다를
   수 있음). HanGat_Map의 "없는 값을 0으로 채우지 않습니다"에 해당하는 원칙(예:
   운영시간 불명은 '확인할 수 없어요'로 표기)을 Seoul Fit의 실제 동작에 맞춰
   적는다.
6. **아키텍처**(Mermaid) + **설계 결정과 트레이드오프** 3–5줄과 ADR 링크(단일
   replica·프로세스 내 캐시 이유, SSR 공개 페이지, 불변 이미지 digest, 규칙 기반
   점수).
7. **품질 현황 표**(§5 형식: 지표/값/측정일/도구·조건/한계) + 접근성
   체크리스트·SEO·관측성 문서 링크.
8. **리뷰어를 위한 코드 지도**(DarkAudit 방식 표): 추천 점수화 →
   `src/features/recommendation/`; 서울 지금·혼잡 → `src/entities/congestion/`,
   `lib/seoulApi.ts`, `lib/serverCache.ts`; 공개 SEO 페이지 → `app/places/`,
   `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`; 접근성 →
   `docs/ACCESSIBILITY_CHECKLIST.md`와 해당 테스트; 배포 → `infra/k8s/`,
   `docs/IMMUTABLE_RELEASE.md`; 관측성 → `docs/OBSERVABILITY.md`. (경로는
   저장소에서 존재 확인)
9. **로컬 실행**(현재 내용을 `docs/`로 이동 가능), **한계와 로드맵**(BACKLOG의
   서버 캐시 외부화·멀티 replica·CI 재개를 "알려진 한계"로 옮김),
   라이선스·크레딧.

**저장소 위생 체크(토스 평가 항목과 직결)**

- 보일러플레이트 SVG 5개, `test-kakao-map.html`, Pages Router 잔재, 중복
  `SideBar` 제거(S–M). `test-kakao-map.html`은 키 하드코딩이라 시크릿
  스캐너·리뷰어에게 경고로 보이므로 우선 삭제한다. JS 키는 브라우저 공개용이고
  도메인 제한이 걸려 있어야 하지만 해당 키의 상태는 확인하지 못했다. 키 교체
  여부는 소유자 판단 사항이다.
- README의 스택·버전 표기를 `package.json`과 일치시키고(Next.js 16), About의
  Website를 정식 URL로, description을 제품 설명으로, topics(`nextjs`,
  `typescript`, `kakao-maps`, `open-data`, `seoul`, `accessibility` 등 ≤20개),
  소셜 프리뷰를 설정한다(S).
- CONTRIBUTING·이슈 템플릿은 community profile 체크를 채우는 정도의 낮은
  신호다(S).
- 커밋 메시지는 현재도 서술적이다(최근
  `chore(prod): pin frontend SEO gate image …`). 기존 이력은 고치지 말고 규칙을
  README/CONTRIBUTING에 한 줄로 명시한다. 토스·HN이 모두 커밋 단위·메시지를
  본다.

**README 에셋을 항상 최신으로 유지하는 방법(headless)**

- 로컬 스크립트(`scripts/capture-readme-assets.mjs` 등)가 Playwright를
  `headless`로 실행해 `docs/assets/readme/*.png`를 생성하고, `recordVideo`
  영상은 ffmpeg 2-pass(palettegen → paletteuse)로 GIF화한다. 결정적 캡처를 위해
  viewport·`locale: 'ko-KR'`·`timezoneId: 'Asia/Seoul'`·geolocation 권한과
  좌표를 고정하고(공개 데이터만 사용, 목업을 쓰면 명시), 결과 파일은 커밋한다.
  GIF는 5 MB 안팎으로 유지(첨부 한도 10 MB). —
  [Playwright screenshots](https://playwright.dev/docs/screenshots) ;
  [Playwright videos](https://playwright.dev/docs/videos) ;
  [Playwright emulation](https://playwright.dev/docs/emulation) ;
  [ffmpeg GIF palettegen](https://blog.pkh.me/p/21-high-quality-gif-with-ffmpeg.html)
  ;
  [shot-scraper + GitHub Actions](https://shot-scraper.datasette.io/en/stable/github-actions.html)
- 소유자 정책상 Actions cache·artifact 저장은 기본 0이고 CI는 ARC 전용이므로,
  생성은 로컬 스크립트로 하고 결과 이미지는 저장소에 커밋하는 방식이 정책과
  충돌하지 않는다(CLAUDE.md 정책에 근거한 추론). shot-scraper는 Playwright 기반
  CLI로 정적 캡처에 쓸 수 있으나 Python 의존이 추가된다.

### Gaps

- 이 환경에서 `gh search`가 빈 결과만 반환해 GitHub 내 한국어 README의 인기/품질
  순위를 만들 수 없었다. "우수"는 직접 읽은 구조 품질 기준이며 별 수(0–5)로는
  검증되지 않는다.
- PoFol·자취선배는 WebFetch 요약으로만 확인했다(raw 파일 미검증).
- 네이버·카카오·당근이 README 기준을 공개한 자료는 없다.
- 카카오 "오프라인 출처 표기 가이드" 원문과 카카오맵 공식 운영정책 원문은 읽지
  못했다.

---

## 4) 브랜드·메타 자산 체크리스트

### Takeaway

- 현재 공개 `<head>`에는 `favicon.ico`와 OG/Twitter 태그만 있고, SVG
  아이콘·apple-touch-icon·manifest·브랜드 워드마크가 없다. 헤더 로고(핀
  글리프)와 OG 이미지의 로고("S" 타일)도 서로 다르다. 홈 `<title>`에는
  브랜드명이 없다.
- 최소 세트(favicon.ico 32 + icon.svg + apple-icon 180 + manifest
  192/512/maskable)는 Next.js 파일 컨벤션으로 S 노력에 끝난다. **PWA는
  manifest까지만** 하는 것이 합리적이고 서비스 워커·오프라인·푸시는 평가 신호가
  낮고 노력이 크다.
- OG 이미지는 형식은 정상(1200×630, 66 KB)이나 텍스트 카드라 "무엇을 하는
  제품인지"가 안 보인다. 제품 화면이 들어간 카드가 신호가 크다.

### Cited Findings

- 최소 파비콘 세트: `favicon.ico`(32×32), `icon.svg`,
  `apple-touch-icon.png`(180×180), `manifest.webmanifest`, `icon-192.png`,
  `icon-mask.png`(512, `purpose: "maskable"`, 안전 영역 "central circle of
  409×409"), `icon-512.png`. "Instead of serving dozens of icons, all you need
  is just five icons and one JSON file." Apple 아이콘은 약 20px 여백과 배경색을
  권장. (2026-01-21 갱신 표기) —
  [Evil Martians](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs)
- Next.js 16.4 문서: `favicon.ico`는 `app/` 루트만,
  `icon.(ico|jpg|jpeg|png|svg)`와 `apple-icon.(jpg|jpeg|png)`는 `app/**`, 코드로
  만든 `icon.tsx`/`apple-icon.tsx`는 `ImageResponse` 사용(단 "You cannot
  generate a favicon icon"). —
  [Next.js app-icons](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons)
- `opengraph-image`/`twitter-image`는 파일 또는 코드로 생성, "twitter-image 5MB,
  opengraph-image 8MB를 넘으면 빌드가 실패", `opengraph-image.alt.txt`로 alt
  지정, 기본적으로 정적 최적화·캐시. —
  [Next.js opengraph-image](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- PWA: 설치 조건은 "valid web app manifest"와 HTTPS, "you can trigger install
  prompts without needing offline support", 맞춤 설치 버튼은 iOS Safari
  미지원이라 비권장, 오프라인은 별도(Serwist, 실험적 `useOffline`). —
  [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- GitHub 저장소 소셜 프리뷰는 1280×640 권장, 1 MB 미만. —
  [GitHub docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview)
- 카카오톡 링크 미리보기 썸네일은 이미지 URL을 키로 캐시되어 삭제할 수 없고
  파일명/버전 파라미터를 바꿔 우회한다는 DevTalk 답변이 반복된다(검색 요약
  수준). Seoul Fit의 `og:image` URL에는 이미 콘텐츠 해시
  쿼리(`?842594a636bbce63`)가 붙는다(관찰). —
  [DevTalk scrap 캐시](https://devtalk.kakao.com/t/topic/33298) ;
  [seoulfit.damecasol.com](https://seoulfit.damecasol.com/)
- 현재 자산 상태(직접 확인): `/favicon.ico`만 링크,
  `/icon.svg`·`/apple-touch-icon.png`·`/manifest.webmanifest` 404, OG는 1200×630
  PNG 텍스트 카드(좌상단 "S" 타일 + "Seoul Fit", 제목 "서울 공공시설 지도",
  부제, 도메인), 헤더는 핀 모양 아이콘 타일만(워드마크 없음),
  `public/assets/logo.svg`(881 B) 존재. —
  [seoulfit.damecasol.com](https://seoulfit.damecasol.com/) ;
  [/opengraph-image](https://seoulfit.damecasol.com/opengraph-image)

### Inferences

| #   | 항목                                                                                                                | 현재                                                                | 목표                                                                                        | 노력 | 신호     |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---- | -------- |
| 1   | 로고 단일화 + 워드마크                                                                                              | 헤더 핀 아이콘 vs OG "S" 타일                                       | 마크 1개(핀+지도 모티프), 헤더에 "Seoul Fit" 워드마크, OG·README·파비콘에 동일 사용         | S–M  | 중       |
| 2   | `app/icon.svg` + `favicon.ico`(32)                                                                                  | ico만                                                               | 두 개 모두 제공                                                                             | S    | 중       |
| 3   | `app/apple-icon.png` 180×180                                                                                        | 없음                                                                | 여백 ≈20px + 배경색                                                                         | S    | 낮음~중  |
| 4   | `app/manifest.ts` (name/short_name/description/start_url/display/theme_color/background_color + 192/512 + maskable) | 없음                                                                | 추가(서비스 워커 없이 설치 가능)                                                            | S    | 낮음     |
| 5   | `<title>` 규칙                                                                                                      | 홈에 브랜드 없음                                                    | 전 페이지 "… \| Seoul Fit" 통일                                                             | S    | 중       |
| 6   | OG 이미지                                                                                                           | 텍스트 카드                                                         | 실제 제품 화면(카카오 로고 포함) + 한 줄 가치 + 도메인, 1200×630, 핵심 텍스트는 안쪽 여백에 | S–M  | 중       |
| 7   | GitHub 소셜 프리뷰·About                                                                                            | 없음/옛 URL                                                         | 1280×640 배너 업로드, Website=정식 URL, topics                                              | S    | 중       |
| 8   | 브랜드 404/오류 페이지                                                                                              | 영문 기본 404                                                       | `app/not-found.tsx`(로고·한 줄 안내·홈/목록 링크, ko/en)                                    | S    | 중       |
| 9   | 개인정보 처리방침·이용약관·데이터 출처 페이지                                                                       | `/privacy`, `/terms` 404(소스에서도 "개인정보/privacy" 문구 미발견) | 카카오 로그인과 분석을 쓰는 서비스이므로 짧은 방침 페이지 + 푸터 링크(필요성은 소유자 판단) | S–M  | 중(신뢰) |
| 10  | 서비스 워커·오프라인·푸시                                                                                           | 없음                                                                | 하지 않음                                                                                   | (L)  | 낮음     |
| 11  | `theme-color`, `viewport` 메타                                                                                      | 미확인                                                              | 브랜드 색 지정                                                                              | S    | 낮음     |

- **PWA 판단**: 이 앱은 라이브 도시데이터·카카오 SDK에 의존하므로 오프라인
  가치가 낮다. manifest는 "설치 가능한 정식 앱 느낌 + 브랜드 아이콘"을 싸게
  주지만, 서비스 워커/푸시는 L 노력 대비 평가 신호가 낮다(Next 문서도 설치에
  오프라인이 필요 없다고 명시).
- **OG 만들기 팁**: 정적 PNG(`app/opengraph-image.png` + `.alt.txt`)가 가장
  단순하고, 코드 생성(`ImageResponse`)은 한글 폰트를 직접 임베드해야 한다(현재
  구현은 이미 한글을 렌더링한다). 카카오 지도 화면을 넣을 때는 로고/저작권이
  보이게 한다.
- **링크 소실 방지**: 정식 도메인 하나(`seoulfit.damecasol.com`)만
  이력서·About·README·OG에 쓰고, 옛 Vercel 배포는 내리거나 정식 URL로
  리다이렉트한다(카카오 FAQ의 링크 소실 경고).

### Gaps

- 실제 `favicon.ico`의 픽셀 디자인과 `public/assets/logo.svg`의 사용처는
  확인하지 못했다.
- KakaoTalk·Slack·X에서의 실제 링크 미리보기 렌더링은 확인하지 못했다(캐시
  거동은 검색 요약 수준).
- 개인정보 처리방침의 법적 필요성은 판단하지 않았다(소유자 판단).

---

## 5) 정직하게 보여줄 수 있는 품질 지표와 측정 방법

### Takeaway

- 보여줄 수 있는 것: ① Lighthouse 4개 카테고리(버전·프로필·반복 횟수·throttling
  방식·측정일 명시) ② 접근성(Lighthouse + axe 자동 검사 + 수동 키보드 점검 +
  **알려진 한계** 서술) ③ 테스트(수·스위트·실행 명령) ④ 타입
  엄격도(`strict: true`, type-check 통과) ⑤ 번들 스냅샷(`next analyze`) ⑥
  배포·운영 사실(불변 digest 릴리스, 관측성 문서). 사용자 수·트래픽은 없으므로
  **없다고 쓰는 것**이 정직한 선택이다.
- 이번에 직접 측정한 베이스라인: 데스크톱 91/95/88/100, 모바일(기본 시뮬레이션
  throttling) 성능 45–56, 모바일 무스로틀 100. 같은 URL이 조건에 따라 45~100으로
  보이므로 **단일 숫자를 내세우지 말고 조건과 해석을 같이** 게시해야 한다.
- 신뢰를 깎는 것: 여러 번 중 최고점만 게시, "WCAG 준수" 단언, 목업을
  실데이터처럼 표기, 검증 안 된 사용자·트래픽 수치.

### Cited Findings

**측정 기준·도구 [A]**

- Lighthouse 성능 점수 구간은 0–49(red) · 50–89(orange) · 90–100(green)이고
  "sites should strive to have a good score (90-100)", 100점은 "extremely
  challenging to achieve and not expected". 가중치는 FCP 10%, Speed Index 10%,
  LCP 25%, TBT 30%, CLS 25%. 변동성은 "A lot of the variability … is not due to
  Lighthouse."이므로 점수를 "a distribution of scores, rather than a single
  number"로 보라고 한다. —
  [Chrome Developers: Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)
- Lighthouse 접근성 점수는 "a weighted average of all accessibility audits"(axe
  사용자 영향 기준 가중치 3–10, 각 audit은 pass/fail이라 부분 점수 없음)이고
  수동 audit은 점수에서 제외된다. —
  [Chrome Developers: Lighthouse accessibility scoring](https://developer.chrome.com/docs/lighthouse/accessibility/scoring)
- Deque 연구(2021-03-10, 2,000+ 감사·13,000+ 페이지·약 30만 이슈, Deque 자체
  데이터)는 자동 테스트가 접근성 이슈의 57%(건수 기준, WCAG 성공기준 수 기준
  아님)를 잡는다고 보고한다. 나머지는 수동 확인이 필요하다는 뜻이다. —
  [Deque](https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues/)
- W3C WAI 접근성 성명서 가이드: 최소 내용은 접근성 약속·적용 기준(예: WCAG
  2.2)·문의처이고, 알려진 한계·테스트 환경·지원 브라우저를 덧붙이길 권한다.
  성명서는 "not technical assessments or declarations of conformity"이며 한계는
  사용자 언어로("videos do not have captions") 쓰라고 한다. —
  [W3C WAI](https://www.w3.org/WAI/planning/statements/)
- Core Web Vitals "good" = LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1(75퍼센타일).
  "all of the Core Web Vitals are, first and foremost, field metrics", lab
  측정은 field 측정을 대체하지 못한다. —
  [web.dev](https://web.dev/articles/vitals)
- Lighthouse CI: `npm install -g @lhci/cli`, `lhci autorun`,
  `lighthouserc.js`(`ci.collect.startServerCommand`/`url`,
  `ci.assert.preset: 'lighthouse:recommended'`), 기본 URL당 3회 실행,
  `temporary-public-storage` 업로드는 리포트를 공개 저장하므로 민감하면 피하라고
  한다. —
  [Lighthouse CI getting started](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md)
- Next.js Bundle Analyzer(v16.1+): `npx next analyze`, `--output`은
  `.next/diagnostics/analyze`에 저장해 전후 비교, `--snapshot`/`export`로 JSON
  Lines 추출. —
  [Next.js Optimizing package bundling](https://nextjs.org/docs/app/guides/package-bundling)
- 정직한 표기 선례: DarkAudit는 성능 표 위에 "모델 · 데이터 · 3회 평균 · 날짜"
  한 줄과 "개발용 합성 데이터입니다" 한계 문장을 둔다. HanGat_Map은 테스트 수와
  실행 명령을 함께 적는다. GreatFrontEnd는 "If something is mocked, say it is
  mocked."를 요구한다. — [DarkAudit](https://github.com/sogeumbbang/DarkAudit) ;
  [HanGat_Map](https://github.com/Jeju-Seonbi/HanGat_Map) ;
  [GreatFrontEnd](https://www.greatfrontend.com/blog/how-to-build-frontend-developer-portfolio-with-no-experience)

**Seoul Fit 직접 측정(2026-10-10T16:5x Z, Lighthouse 13.5.0, headless Chrome for
Testing 149, WSL2 개발 머신, 대상 `/`)** —
[seoulfit.damecasol.com](https://seoulfit.damecasol.com/)

| 프로필                                           | Perf | A11y | BP  | SEO | FCP   | LCP   | TBT      | CLS   | SI    |
| ------------------------------------------------ | ---- | ---- | --- | --- | ----- | ----- | -------- | ----- | ----- |
| Mobile 기본(시뮬레이션 throttling) #1            | 56   | 95   | 88  | 100 | 1.2 s | 8.1 s | 790 ms   | 0.028 | 2.6 s |
| Mobile 기본 #2(Perf만)                           | 45   | -    | -   | -   | 1.1 s | 7.5 s | 3,380 ms | 0.013 | 3.6 s |
| Desktop preset                                   | 91   | 95   | 88  | 100 | 0.5 s | 1.9 s | 0 ms     | 0.005 | 1.1 s |
| Mobile, `--throttling-method=provided`(무스로틀) | 100  | -    | -   | -   | 0.6 s | 1.1 s | 0 ms     | 0.004 | 0.8 s |

- 모바일 LCP 요소는 지도 컨테이너 `div#kakaoMap`(412×746). 관측된(비시뮬레이션)
  LCP 분해는 TTFB 373 ms + 리소스 로드 지연 546 ms + 로드 7 ms + 렌더 지연 70 ms
  ≈ 1.0 s로, 시뮬레이션 8.1 s와 크게 다르다. 총 전송량 1,982 KiB, 미사용 JS 추정
  절감 80 KiB, 서드파티는 카카오 SDK(`dapi.kakao.com`, `kakaocdn.net` ≈ 657
  KB)와 Zaraz 스크립트. — 위 URL (Lighthouse JSON 분석)
- 실패한 audit — 접근성: `color-contrast`(공원 132곳/지하철 784곳 토글, 흰 글자
  on `#059669` = 3.76:1, on `#6366f1` = 4.46:1, 12px), `heading-order`(h3 "짧은
  활동 계획"), `label-content-name-mismatch`(aria-label "공원 132곳 숨기기" vs
  보이는 텍스트 "132"), `presentation-role-conflict`(카카오 SDK가 만든
  `<area role="presentation">`). Best Practices: `errors-in-console`(위치 거부
  로그), `image-size-responsive`(카카오 SDK의 투명 gif), `geolocation-on-start`.
  — 위 URL (Lighthouse JSON 분석)
- 저장소 사실: `tsconfig.json`에 `"strict": true`, 테스트 파일의 `it(`/`test(`
  호출 정적 집계 262, 접근성 체크리스트(2026-07-25)는 색 대비 샘플 계산을 AA
  통과로 기록하나 Lighthouse는 위 토글 2개의 대비 미달을 지적한다. 감사 노트는
  `npm run type-check` exit 0, 선택 스위트 42 suites/276 tests 통과,
  `format:check` 실패(44개 파일)를 기록한다. —
  [tsconfig.json](file:///home/lsh/dev/side/seoul-fit-fe/tsconfig.json) ;
  [ACCESSIBILITY_CHECKLIST.md](file:///home/lsh/dev/side/seoul-fit-fe/docs/ACCESSIBILITY_CHECKLIST.md)
  ; [code_audit_shell_pages.md](./code_audit_shell_pages.md)

### Inferences

**신뢰할 만한 목표(제안)**

- Desktop Performance ≥ 90(현재 91 유지) / Accessibility: 위 4건 중 자체 수정
  가능한 3건(대비·heading 순서·accessible name)을 고쳐 100에 근접, 카카오 SDK
  유래 1건은 "서드파티 요소"로 한계에 기록 / Best Practices ≥ 95(콘솔 에러·자동
  위치 요청 제거로 2건 해소) / SEO 100 유지.
- 모바일은 "기본 throttling 점수의 범위(예: 45–56, n=반복 횟수)"를 그대로
  공개하고, 무스로틀 값(100)과 병기하며, "시뮬레이션 LCP는 지도 컨테이너 렌더에
  묶이고 관측 LCP는 약 1초"처럼 **해석을 덧붙인다**. 해석의 근거는 이번 n=1–2
  측정뿐이므로 "가설"로 표기하고, 개선(지도 SDK 지연 로딩, 정적 프리뷰 등)을
  시도했다면 전후 비교를 서사로 쓴다. 반복 횟수는 최소 5회, 중앙값과 범위를
  게시한다.
- 70점대 모바일이 "신뢰할 만한" 이유는 점수가 아니라 **투명성**이다. 90+를
  강박적으로 맞추기보다 설명 가능한 값이 평가자에게 더 읽힌다(토스 프론트엔드
  공고는 "브라우저 렌더링 성능 최적화 경험"을 요건으로 쓰지 특정 점수를 요구하지
  않는다 — [토스 공고](https://toss.im/career/job-detail?job_id=4076141003)).

**게시 형식(예시 컬럼)**: `지표 | 값 | 측정일 | 도구·버전·조건 | 한계/해석`. 예)
"Lighthouse Desktop Performance | 91 | 2026-10-11 | Lighthouse 13.5.0, Chrome
149 headless, preset=desktop, n=5 중앙값 | 단일 머신 lab 측정, field(CrUX)
없음". 상세 JSON/요약은 `docs/quality/lighthouse-YYYY-MM-DD.md`로 커밋하고
README는 요약 표와 링크만 둔다.

**측정 자동화(headless, 직접 실행해 동작 확인한 형태)**

- `CHROME_PATH=<chromium 경로> npx lighthouse <URL> --preset=desktop --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless=new --no-sandbox" --output=json --output-path=out.json`.
  모바일은 `--preset` 생략(기본), 무스로틀 비교는
  `--throttling-method=provided`. 여러 회 반복해 중앙값을 낸다. CI에서 돌릴 때는
  LHCI(`lhci autorun`)를 쓰되 소유자 정책(ARC 전용 러너, Actions
  cache/artifact 0)과 `temporary-public-storage`의 공개 저장을 고려해 로컬
  실행 + 결과 md 커밋이 더 단순하다.
- 접근성: Lighthouse(자동) + axe 계열 자동 검사를 E2E에 주입 + 수동
  키보드/스크린리더 체크(`docs/ACCESSIBILITY_CHECKLIST.md`를 갱신). 게시 문구는
  "WCAG 2.2 AA를 목표로 점검했고, 자동 검사 결과와 알려진 한계는 아래와
  같습니다" 형태로 쓰고 **준수(conformance)를 단언하지 않는다**.
- 번들: `npx next analyze --output` 결과를 날짜와 함께 요약(상위 클라이언트
  청크, 지도 SDK 비중). 줄인 사례가 있으면 전후 비교.
- 테스트: `npm test`의 요약 줄(스위트·테스트 수·시간)과 실행 명령을 그대로
  복사한다. 262는 정적 grep 값이므로 Jest 요약 값으로 교체. 커버리지는 의미 있는
  영역(점수 계산·정규화 등)만 선택적으로.
- 타입: `strict: true`, `npm run type-check` 통과를 한 줄로. `any` 사용 수 같은
  새 지표는 측정 후에만 게시.

**게시하지 말 것**: 최고점만 골라 쓰기, "WCAG 준수/접근성 완벽",
MAU·DAU·방문자·후기·"N명이 사용", 목업 데이터를 라이브처럼 표기, AI 사용 범위를
숨기기(규칙 기반 점수를 "AI 추천"으로 포장 금지; HanGat_Map은 AI의 역할 한계를
문장으로 명시). 서비스는 공모전 이후 실사용자가 없으므로 "포트폴리오 목적
운영"이라고 쓰는 편이 신뢰를 지킨다.

### Gaps

- Lighthouse 수치는 WSL2 개발 머신에서의 소수 회(모바일 시뮬레이션 2회, 데스크톱
  1회, 무스로틀 1회) 측정이며 field/CrUX가 아니다. 트래픽이 적어 CrUX 데이터가
  없을 가능성이 높지만 확인하지 않았다.
- 번들 크기·커버리지는 저장소를 빌드·수정하지 않는다는 제약으로 측정하지 않았다.
  테스트 수는 정적 grep이다.
- LHCI의 `numberOfRuns` 설정 키는 문서 요약에서 확인하지 못했다(공식 문서에서
  재확인 필요).
- SonarQube 품질 게이트 결과를 공개 링크로 보여줄 수 있는지는 확인하지 못했다.

---

## 6) 안티패턴 목록

### Takeaway

- "콘테스트 잔재"로 읽히는 신호는 근거가 많고 대부분 S 노력으로 고쳐진다:
  보일러플레이트 에셋, 구버전 README, 죽은 링크/옛 배포, 기본 404, 콘솔 에러,
  영문·기본 스타일의 동의 모달, 중복 데이터, 틀린 안내 문구, 비공식 브랜드 버튼.
  반면 "과한 장식"이 평가자에게 감점이라는 직접 근거는 약하다(토스는 코드에 대해
  "화려한 기술보다 본질"을 말한다). 따라서 장식은 **절제**를 원칙으로 하고 근거
  강도를 구분해 다룬다.

### Cited Findings

- 쓰지 않는 파일 제거, 가짜 데이터는 명확히 표기된 폴더에, 목업은 목업이라고
  표기, 로딩/빈/오류 상태 구분, 시크릿 창·모바일 폭·새 폴더에서 README 명령
  재현. —
  [GreatFrontEnd](https://www.greatfrontend.com/blog/how-to-build-frontend-developer-portfolio-with-no-experience)
- 튜토리얼·과제류(to-do 앱)는 비선호, 모호한 커밋 메시지("Updated stuff.")
  비선호. — [HN](https://news.ycombinator.com/item?id=43134745)
- 흔한 예제 프로젝트는 차별성이 없다는 반응("React Todo App? I've seen hundreds
  of them already."; 강의 홍보 문구). —
  [인프런 강의](https://www.inflearn.com/en/course/웹-프론트엔드-포트폴리오)
- 스킬 바 비권장("Don't put skill bars on your website!"), 포트폴리오는 전부의
  색인이 아니라 "highlight reel". —
  [Scrimba 팟캐스트 72](https://podcast.scrimba.com/72) ;
  [Josh Comeau](https://joshwcomeau.com/effective-portfolio/)
- "화려한 기술이나 코드 패턴보다는 본질적인 코드의 고민이 드러나는 리포지토리면
  좋아요." —
  [토스 테크](https://toss.tech/article/frontend-apply-without-resume)
- 온보딩: deck-of-cards 비권장, 첫 실행의 기능 홍보형 온보딩 회피, 오버레이는
  "nice-to-have". 빈 상태에서 로딩 중 "No records"를 보이면 신뢰를 해친다. —
  [NN/g Onboarding](https://www.nngroup.com/articles/mobile-app-onboarding/) ;
  [NN/g Empty States](https://www.nngroup.com/articles/empty-state-interface-design/)
- Lighthouse Best Practices가 콘솔 에러와 로드 시 위치 요청을 실패로 처리한다. —
  [geolocation-on-start](https://developer.chrome.com/docs/lighthouse/best-practices/geolocation-on-start)
- Next.js 기본 not-found 화면은 앱 테마를 읽지 않고 OS 색상 모드만
  따른다("provide your own not-found.js"). —
  [Next.js not-found](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)
- 카카오 로그인 버튼은 `#FEE500`·radius 12px·공식 심볼을 지켜야 하고 "심볼 없이
  카카오 로그인 버튼을 구성할 수 없습니다". —
  [카카오 디자인 가이드](https://developers.kakao.com/docs/ko/kakaologin/design-guide)
- AI 시대: 포트폴리오가 "AI가 이미 한 일의 증거"가 될 수 있으므로 결정 설명이
  신호(SocialTalent), 일부 매니저는 개인 프로젝트를 아예 안 본다는 일화와 그
  반박(Reddit 미러). — [SocialTalent](https://www.socialtalent.com/?p=96405) ;
  [Reddit 미러](https://reddit.sentinel-team.org/posts/1ps4yet/snapshots/2025-12-26T18%3A31%3A31.46825Z)

**Seoul Fit에서 직접 확인한 해당 항목** | 안티패턴 | Seoul Fit 현황(관찰) |
근거/교차 참조 | |---|---|---| | 보일러플레이트 에셋 |
`public/{file,globe,next,vercel,window}.svg` 5개 추적 중 |
[public/](file:///home/lsh/dev/side/seoul-fit-fe/public) | | 테스트
잔재·하드코딩 키 | 루트 `test-kakao-map.html`에 지도 JS 키 하드코딩(값 미기재) |
[test-kakao-map.html](file:///home/lsh/dev/side/seoul-fit-fe/test-kakao-map.html)
| | 구버전·불일치 README | "Next.js 15" vs `next ^16.3.1`, 스크린샷 없음 |
[README.md](file:///home/lsh/dev/side/seoul-fit-fe/README.md) ;
[package.json](file:///home/lsh/dev/side/seoul-fit-fe/package.json) | | 죽은/옛
링크 | About Website가 옛 Vercel 배포("Seoul Fit Map") |
[seoul-fit.vercel.app](https://seoul-fit.vercel.app/) | | 기본 404 | 영문 "This
page could not be found." |
[404 예시](https://seoulfit.damecasol.com/this-page-does-not-exist) ; 감사 D09 |
| 콘솔 에러 | 위치 거부 시 error 2건, Lighthouse BP 실패 |
[seoulfit.damecasol.com](https://seoulfit.damecasol.com/) | | 영문·기본 스타일
동의 모달 | "analytics / Anonymous page and feature usage analytics.", 기본 파란
버튼, 전면 차단 | [seoulfit.damecasol.com](https://seoulfit.damecasol.com/) | |
중복 데이터 노출 | `/places/park`에서 같은 장소가 2번씩, 홈 추천에 "시청역" 연속
2건 | [/places/park](https://seoulfit.damecasol.com/places/park) | | 틀린 안내
문구 | "왼쪽 메뉴에서 로그인해 주세요"(실제는 오른쪽) | 감사 D12 | | 브랜드
가이드 위반 | 카카오 로그인 버튼 `#facc15`, 일반 말풍선 아이콘 | 감사 D25 ;
[가이드](https://developers.kakao.com/docs/ko/kakaologin/design-guide) | |
브랜드 부재 | 헤더 워드마크 없음, 홈 title에 브랜드 없음, 로고 2종 | §4 | |
실패처럼 보이는 첫 상태 | "서울 지금"이 주황 오류 문구 + "기준 시각 미확인" | §2
O3 | | 모바일 첫 화면 | 패널이 지도를 거의 덮음 | 감사 D02 | | 접근성 단언과
불일치 | 체크리스트는 대비 통과, Lighthouse는 대비 2건 실패 | §5 |

### Inferences

- **콘테스트 잔재 점검 목록(검색 가능한 것부터)**: `public/` 기본 SVG, 루트 임시
  HTML/스크립트, 사용되지 않는 중복 컴포넌트·Pages Router 폴더, 하드코딩
  키(시크릿 스캐너), README의 버전·URL 불일치, About/Website/topics, 소셜 프리뷰
  미설정, 기본 404/오류 화면, 콘솔 에러/경고, 영문 잔여 문구("Anonymous page…",
  "This page could not be found."), TODO/placeholder 문구(해당 검색은 감사
  노트가 다룸), 동명·중복 항목.
- **과한 장식의 기준(근거 약함, 절제 원칙)**: 3D·무한 스크롤 애니메이션·자동
  재생 히어로 영상·패럴랙스, 스킬 바/퍼센트, 의미 없는 통계 카운터("N명 사용
  중"), 가짜 후기/로고 벽, 뱃지 과다, 모든 버튼의 hover scale, 온보딩 말풍선
  투어, 모달 3중첩(동의+환영+알림). 이들은 직접 근거가 약하지만 평가 기준(토스:
  본질, NN/g: 오버레이는 nice-to-have)과 시간 비용 때문에 우선순위를 낮춘다.
  Felt처럼 장식이 제품 정체성(좌표 HUD)과 맞닿아 있으면 예외로 볼 수 있다.
- **가짜 지표 금지**: 사용자·트래픽·후기·성능 수치를 지어내면 면접의
  꼬리질문에서 가장 쉽게 무너진다. 후기성 일화는 면접이 제출 서류 내용을 토대로
  진행되고 꼬리질문이 많다고 전한다 [C]. —
  [카카오 공채 후기(인프런 게시글)](https://www.inflearn.com/community/questions/1688670/%EC%B9%B4%EC%B9%B4%EC%98%A4-%EA%B3%B5%EC%B1%84-%ED%95%A9%EA%B2%A9-%EA%B3%B5%EB%B6%80-%EB%B0%A9%EB%B2%95)
  ;
  [토스 면접 후기(개인 블로그)](https://gooinjob.com/%ED%86%A0%EC%8A%A4-%EB%A9%B4%EC%A0%91-%ED%95%A9%EA%B2%A9-%ED%9B%84%EA%B8%B0-%EC%97%B0%EB%B4%89/)

### Gaps

- "과한 장식이 감점"이라는 직접적인 평가자 증언은 찾지 못했다(위 목록은 추론).
- 면접 현장의 서류 기반 꼬리질문 경향은 후기성 일화에 의존한다(잡플래닛/커뮤니티
  요약, 1차 확인 못 함).
- 하드코딩 키의 실제 위험도(도메인 제한 여부)는 확인하지 못했다.

---

## 7) 우선순위 체크리스트 (High-signal first, 노력 S/M/L)

### Takeaway

- 순서 원칙: **① 평가자가 3초 안에 보는 결함 제거 → ② 평가자의
  입구(README·About·URL·PDF) 정비 → ③ 설계·품질 서사(ADR·측정 표·/about) → ④
  브랜드·메타 → ⑤ 장식(마지막 또는 생략)**. 가짜 지표는 어떤 단계에서도 쓰지
  않는다.
- 규모 추정(노력 정의는 문서 상단): Tier A ≈ 4–6일(대부분 S), Tier B ≈ 3–5일,
  Tier C는 생략 가능. 평가자 입구별 최소 세트는 아래 "입구별 매핑" 참조.

### Cited Findings

- 이 절의 항목은 §1–§6에 인용된 자료에서 파생된 권고이며 신규 인용은 없다.
  "근거" 열은 해당 절·관찰 ID(O1–O10)·감사 노트 결함 ID를 가리킨다.

### Inferences

**Tier A — 높은 신호(평가자가 실제로 가중하는 것). 먼저 한다**

| #   | 항목                                                                                                                                 | 노력 | 근거                                                              | 완료 기준                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ---- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| A1  | 쿠키 동의 UI 정리: 전면 모달 → 하단 가로 배너, 한국어 목적명·설명, 브랜드 스타일(Zaraz 설정에서 불가하면 대체 방안 검토)             | S    | §2 O1, Strava 배너 대비                                           | 첫 화면에서 지도가 가려지지 않고 영문 문구 없음, 동의 전 분석 미실행 유지 |
| A2  | 위치 권한: 로드 시 자동 요청 제거 → "내 위치" 버튼에서만, 거부는 error가 아닌 정상 경로로 처리, 기본 데모 위치(예: 시청/광화문) 명시 | S–M  | §2 O3·O4, Lighthouse `geolocation-on-start`                       | 콘솔 error 0, BP audit 2건 해소                                           |
| A3  | "서울 지금" 기본 상태 설계: 오류 톤 제거, 기준 시각·샘플 지점·근거 표기                                                              | M    | §2 O3, NN/g 빈 상태 3원칙                                         | 위치 없음 상태 캡처가 "작동 중"으로 읽힘                                  |
| A4  | 눈에 띄는 결함 수정: `/places` 중복 카드, "왼쪽 메뉴" 문구+CTA, 홈 추천 동명 항목 구분, 카카오 로그인 버튼 가이드 준수               | S–M  | §2 O6·O7, 감사 D12·D25                                            | 해당 화면에서 재현 불가                                                   |
| A5  | 브랜드 404/오류 페이지(`app/not-found.tsx`, ko/en)                                                                                   | S    | O5, 감사 D09, Next 문서                                           | 안내+홈 링크, 404 상태 코드 유지                                          |
| A6  | README 전면 개편(§3 구조) + 스크린샷 6 + GIF 1 + 품질 표 + 데이터 출처·고지 + 리뷰어 코드 지도                                       | M    | 토스(README·디렉토리·TS), 요즘IT, 알체라, DarkAudit/HanGat 선례   | 접기 전 화면에 URL·GIF·한 줄 가치, 스택/버전이 `package.json`과 일치      |
| A7  | GitHub About 정리: Website=정식 URL, 설명 한 줄, topics ≤20, 소셜 프리뷰 1280×640, 옛 Vercel 배포 내리기/리다이렉트                  | S    | 카카오 FAQ(링크 소실), O10                                        | About 클릭 시 정식 URL                                                    |
| A8  | 저장소 위생: 보일러플레이트 SVG·`test-kakao-map.html`·Pages Router 잔재·중복 컴포넌트 제거                                           | S–M  | 토스(디렉토리·모듈화), GreatFrontEnd, §3                          | `git ls-files`에 잔재 없음, 시크릿 스캔 경고 0                            |
| A9  | `/about` 케이스 스터디(한/영): 문제 → 결정·트레이드오프 → 품질 → 한계 → 링크                                                         | M    | 토스 공고("문제를 주도적으로 정의"), 요즘IT, 알체라, SocialTalent | 한 번의 스크롤로 읽힘, 허구 수치 없음                                     |
| A10 | 품질 측정 표 + 접근성 현황(성명서형) + Lighthouse 4건 audit 수정                                                                     | M    | §5                                                                | 날짜·도구·조건 포함 표, 자체 수정 3건 완료                                |
| A11 | ADR 3–5개(`docs/decisions/`): 단일 replica·프로세스 내 캐시, 규칙 기반 점수, SSR 공개 페이지+클라이언트 지도, 불변 digest 릴리스     | M    | 알체라(트레이드오프·대안), SocialTalent, BACKLOG 선례             | 각 ADR에 대안·결과·재검토 조건                                            |
| A12 | 안정 URL + 1–2쪽 PDF(국문, 링크 포함)                                                                                                | S    | 당근 FAQ, 카카오 FAQ                                              | PDF 속 링크(서비스·GitHub·/about)가 동작                                  |

**Tier B — 중간 신호(시간이 되면)**

| #   | 항목                                                                             | 노력 | 근거                                    |
| --- | -------------------------------------------------------------------------------- | ---- | --------------------------------------- |
| B1  | Welcome 카드(닫기·기억) + 상시 "?"                                               | S–M  | §2 OSM·Strava, NN/g                     |
| B2  | 시나리오 딥링크·"Try these" 칩(검색창 아래 3–5개)                                | S–M  | §2, NN/g 학습 단서                      |
| B3  | 브랜드 세트: 로고 단일화·헤더 워드마크·`icon.svg`·apple-icon·manifest·title 규칙 | S–M  | §4                                      |
| B4  | OG 이미지를 제품 화면 카드로 교체                                                | S–M  | §4                                      |
| B5  | README 에셋 생성 스크립트(Playwright headless + ffmpeg GIF)                      | M    | §3                                      |
| B6  | 개인정보 처리방침·이용약관·데이터 출처 페이지 + 푸터 링크                        | S–M  | §4 #9                                   |
| B7  | 모바일 첫 화면 구성(패널 높이·바텀시트)                                          | M    | 감사 D02, GreatFrontEnd(모바일 폭 확인) |
| B8  | 번들 스냅샷(`next analyze`) + 지도 SDK 지연 로딩 실험 → 전후 서사                | M    | §5                                      |
| B9  | CONTRIBUTING·이슈 템플릿(community profile)                                      | S    | §3                                      |

**Tier C — 낮은 신호(마지막 또는 생략)**

| #   | 항목                                       | 노력 | 이유                                                       |
| --- | ------------------------------------------ | ---- | ---------------------------------------------------------- |
| C1  | 서비스 워커·오프라인·푸시                  | L    | 라이브 데이터 의존, Next 문서도 설치에 오프라인 불필요(§4) |
| C2  | 3D·패럴랙스·자동 재생 영상·장식 애니메이션 | M–L  | 직접 근거 약함, 토스·NN/g 기조와 반대(§6)                  |
| C3  | 스킬 바·뱃지 과다·통계 카운터              | S    | Josh Comeau 비권장, 허구 지표 위험                         |
| C4  | 장소별 동적 OG 이미지·추가 JSON-LD         | M    | 이미 SEO 기반 존재, 평가 신호 낮음                         |
| C5  | 정교한 로고 시스템·브랜드 가이드 문서      | M    | 마크 1개와 워드마크면 충분                                 |
| C6  | 추가 언어                                  | L    | ko/en 이미 충족                                            |

**하지 말 것(허구 요구 방지)**: 사용자/트래픽/후기 수치 작성, 여러 번 측정 중
최고점만 게시, "WCAG 준수·접근성 완벽" 단언, 목업·샘플 데이터를 라이브처럼
표기(표기 필수), 규칙 기반 추천을 "AI 추천"으로 포장, 공공누리 출처·카카오 고지
생략.

**입구별 최소 세트**

- 토스형(저장소만 본다): A6, A8, A11, A10(README 품질 표), 커밋 규칙 명시 — 코드
  구조·TS 엄격성·README·제품 완성도 신호를 직접 맞춘다.
- 카카오·당근형(PDF + URL): A12, A7, A1–A5, A9 — 링크가 살아 있고 첫 3초가
  깨끗해야 한다.
- 면접 대비: A9, A11, A10, B8 — 결정·트레이드오프·측정 한계를 말로 설명할 수
  있는 근거 문서.

**3일 실행 제안**

- Day 1(S 위주): A1, A2, A4(일부), A5, A7, A8, B3의 아이콘/title 부분, A12 초안.
- Day 2: A6 README 개편 + B5 에셋 생성, A10 측정 표·audit 수정, A3.
- Day 3: A9 `/about`, A11 ADR, B4 OG, B1·B2(여유 시).

### Gaps

- 노력 추정은 코드 규모(`src`·`app`·`lib`의 테스트 제외 TS/TSX 246개 파일,
  32,289줄)와 관찰된 구조에서 어림한 값이며 실제 구현은 확인하지 않았다.
- Zaraz 설정 가능 범위, 시나리오 딥링크 지원 여부, 위치 없음 상태에서 실데이터를
  보여줄 수 있는 도시데이터 대체 경로 등은 구현 확인이 필요하다.

---

## 8) 출처

### Takeaway

- 1차(회사·공식 문서) 자료는 토스 테크 글 1건과 토스 공고, 카카오·당근 FAQ,
  우아한형제들 합류여정, Next.js·GitHub·Chrome·web.dev·W3C 문서, 서울
  열린데이터광장·카카오 개발자 문서다. 평가자 관점의 나머지는 실무자 글(B)과
  일화(C)이므로 단정적 표현은 피하고 등급과 함께 인용하는 것이 안전하다.

### Cited Findings

**[A] 회사·공식 1차 자료**

- 토스 프론트엔드(박서진, 2025-04-08) —
  [토스 프론트엔드에 이력서 없이 리포지토리 링크로 지원하세요](https://toss.tech/article/frontend-apply-without-resume)
  (WebFetch 2회 일치)
- 토스 Frontend Developer 공고 이력서 가이드 —
  [toss.im/career/job-detail?job_id=4076141003](https://toss.im/career/job-detail?job_id=4076141003)
- 토스 Frontend Fundamentals —
  [frontend-fundamentals.com/code-quality/code](https://frontend-fundamentals.com/code-quality/code/)
- 카카오 채용 FAQ — [careers.kakao.com/faq](https://careers.kakao.com/faq)
  (headless 렌더링으로 직접 확인)
- 당근 채용 FAQ(지원 관련) —
  [careers.daangn.com/faq/지원-관련](https://careers.daangn.com/faq/%EC%A7%80%EC%9B%90-%EA%B4%80%EB%A0%A8/)
  (headless 렌더링으로 직접 확인)
- 우아한형제들 합류여정 —
  [career.woowahan.com/woowa-recruit-info](https://career.woowahan.com/woowa-recruit-info)
- GitHub Docs:
  [About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
  ·
  [Social preview](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview)
  ·
  [Topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics)
  ·
  [Community profiles](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/about-community-profiles-for-public-repositories)
  ·
  [Diagrams](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams)
  ·
  [Attaching files](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files)
- Next.js 16.x Docs:
  [PWA](https://nextjs.org/docs/app/guides/progressive-web-apps) ·
  [icons](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons)
  ·
  [opengraph-image](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
  ·
  [not-found](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)
  ·
  [package bundling / analyze](https://nextjs.org/docs/app/guides/package-bundling)
- Chrome/web.dev:
  [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)
  ·
  [accessibility scoring](https://developer.chrome.com/docs/lighthouse/accessibility/scoring)
  ·
  [geolocation-on-start](https://developer.chrome.com/docs/lighthouse/best-practices/geolocation-on-start)
  · [Core Web Vitals](https://web.dev/articles/vitals) ·
  [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md)
- W3C WAI Accessibility Statements —
  [w3.org/WAI/planning/statements](https://www.w3.org/WAI/planning/statements/)
- Playwright Docs: [screenshots](https://playwright.dev/docs/screenshots) ·
  [videos](https://playwright.dev/docs/videos) ·
  [emulation](https://playwright.dev/docs/emulation)
- Cloudflare Zaraz Consent —
  [developers.cloudflare.com/zaraz/consent-management](https://developers.cloudflare.com/zaraz/consent-management/)
- 서울 열린데이터광장 이용허락 안내 —
  [data.seoul.go.kr/etc/openInfo.do](https://data.seoul.go.kr/etc/openInfo.do) ;
  서울시 실시간 도시데이터 —
  [data.seoul.go.kr/SeoulRtd](https://data.seoul.go.kr/SeoulRtd/)
- 카카오 로그인 디자인 가이드 —
  [developers.kakao.com/docs/ko/kakaologin/design-guide](https://developers.kakao.com/docs/ko/kakaologin/design-guide)
- NN/g:
  [Mobile-App Onboarding (Kendrick, 2020-06-21)](https://www.nngroup.com/articles/mobile-app-onboarding/)
  ·
  [Designing Empty States (Kaplan, 2021-09-19)](https://www.nngroup.com/articles/empty-state-interface-design/)
  (등급은 전문 리서치 기관 글)

**[B] 실무자·플랫폼·벤더 글**

- 요즘IT 한날(2024-07-24)
  [뽑히는 개발자 포트폴리오는 어떻게 만드나요?](https://yozm.wishket.com/magazine/detail/2686/)
  ; 알체라(2025-12-21)
  [개발자 포트폴리오의 중요성](https://www.alchera.ai/resource/blog/developer-portfolio)
  ; 인프런 블로그(2022-06-10)
  [이력서 작성 TIP](https://www.inflearn.com/blogs/2119) ; 인프런 강의
  소개(2025)
  [웹 프론트엔드 포트폴리오](https://www.inflearn.com/en/course/웹-프론트엔드-포트폴리오)
  ; 코멘토 Q&A(2026-07-20, 익명)
  [포트폴리오 관련 질문](https://comento.kr/job-questions/모든회사/sw개발/개발직군_신입%20공채%20지원%20시%20포트폴리오%20관련%20질문%20있습니다-632217)
- GreatFrontEnd(2026-06-17)
  [How to Build a Frontend Developer Portfolio With No Experience](https://www.greatfrontend.com/blog/how-to-build-frontend-developer-portfolio-with-no-experience)
  (WebFetch 요약 경유) ; Josh Comeau
  [Effective Portfolio](https://joshwcomeau.com/effective-portfolio/) ·
  [Scrimba 팟캐스트 72](https://podcast.scrimba.com/72) ;
  SocialTalent(2026-08-23)
  [The Junior Job Is Not Gone…](https://www.socialtalent.com/?p=96405)
- Evil Martians
  [How to Favicon](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs)
  ; Deque
  [57% 연구(2021-03-10)](https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues/)
  ; pkh.me
  [ffmpeg GIF](https://blog.pkh.me/p/21-high-quality-gif-with-ffmpeg.html) ;
  shot-scraper
  [GitHub Actions](https://shot-scraper.datasette.io/en/stable/github-actions.html)
  ; awesome-readme
  [matiassingers/awesome-readme](https://github.com/matiassingers/awesome-readme)
- 한국어 README 사례(원문 확인):
  [Jeju-Seonbi/HanGat_Map](https://github.com/Jeju-Seonbi/HanGat_Map) ·
  [sogeumbbang/DarkAudit](https://github.com/sogeumbbang/DarkAudit) ·
  [woowacourse-teams/2026-rilog](https://github.com/woowacourse-teams/2026-rilog)
  ; 요약 경유:
  [PoFol-Capstone/Frontend](https://github.com/PoFol-Capstone/Frontend) ·
  [woowacourse-teams/2026-jachwi-sunbae](https://github.com/woowacourse-teams/2026-jachwi-sunbae)
  ; 영문: [immich-app/immich](https://github.com/immich-app/immich) ·
  [MariosKalantzis/PortfolioV2](https://github.com/MariosKalantzis/PortfolioV2)
- 신뢰 낮음(반례 예시로만):
  [devplaybook](https://devplaybook.cc/blog/developer-portfolio-checklist-20-things-hiring-managers)
  · [hakia](https://www.hakia.com/skills/building-portfolio/)

**[C] 일화·커뮤니티**

- [Ask HN 43134745(2025-02-22)](https://news.ycombinator.com/item?id=43134745)
  (미러 [hn.svelte.dev](https://hn.svelte.dev/item/43134745)에서 본문 확인) ;
  [Reddit 미러 스냅샷](https://reddit.sentinel-team.org/posts/1ps4yet/snapshots/2025-12-26T18%3A31%3A31.46825Z)
  ; [카카오 DevTalk 110301](https://devtalk.kakao.com/t/copyright/110301) ·
  [128939](https://devtalk.kakao.com/t/topic/128939) ;
  [카카오 공채 후기](https://www.inflearn.com/community/questions/1688670/%EC%B9%B4%EC%B9%B4%EC%98%A4-%EA%B3%B5%EC%B1%84-%ED%95%A9%EA%B2%A9-%EA%B3%B5%EB%B6%80-%EB%B0%A9%EB%B2%95)
  ;
  [토스 면접 후기](https://gooinjob.com/%ED%86%A0%EC%8A%A4-%EB%A9%B4%EC%A0%91-%ED%95%A9%EA%B2%A9-%ED%9B%84%EA%B8%B0-%EC%97%B0%EB%B4%89/)

**직접 관찰·측정(재현 가능)**

- 공개 URL headless 관찰·Lighthouse 13.5.0 측정(2026-10-10T16:5x Z):
  [seoulfit.damecasol.com](https://seoulfit.damecasol.com/) ·
  [/places/park](https://seoulfit.damecasol.com/places/park) ·
  [/opengraph-image](https://seoulfit.damecasol.com/opengraph-image) ·
  [옛 배포](https://seoul-fit.vercel.app/). 참고 제품:
  [OSM](https://www.openstreetmap.org/) ·
  [Strava Heatmap](https://www.strava.com/maps/global-heatmap) ·
  [kepler.gl](https://kepler.gl/demo) · [Citymapper](https://citymapper.com/) ·
  [AllTrails](https://www.alltrails.com/) · [Windy](https://www.windy.com/) ·
  [Felt](https://felt.com/) · [earth.nullschool](https://earth.nullschool.net/).
- 로컬 캡처·JSON(세션 스크래치패드): `scratchpad/shots/*.png`,
  `scratchpad/lh_out/{mobile,mobile2,desktop,mobile_provided}.json`, 스크립트
  `scratchpad/scripts/*.cjs`(headless 전용).
- 저장소 로컬 파일:
  [README.md](file:///home/lsh/dev/side/seoul-fit-fe/README.md) ·
  [package.json](file:///home/lsh/dev/side/seoul-fit-fe/package.json) ·
  [tsconfig.json](file:///home/lsh/dev/side/seoul-fit-fe/tsconfig.json) ·
  [docs/](file:///home/lsh/dev/side/seoul-fit-fe/docs)

### Inferences

- 근거 강도 순서: 토스 글·카카오/당근 FAQ·공식 문서(A) > 실무자 글(B) > 일화(C).
  노트의 "권장"은 A/B 근거를 우선하고 C는 반론·반례로만 썼다.
- 직접 측정·관찰은 단일 시점·소수 회·단일 머신이므로 "2026-10-11 기준
  스냅샷"으로만 인용해야 한다.

### Gaps

- 인용하지 못한 것: 네이버 채용 FAQ 본문(렌더링해도 비어 있음), 토스 프론트엔드
  챕터 면접관 토크 본문, Medium 일부 글(403), Reddit r/webdev(검색 도구 차단),
  카카오맵 공식 운영정책 원문·오프라인 출처 표기 가이드 원문,
  `@axe-core/playwright` 문서(503).
- Kent C. Dodds·Addy Osmani의 포트폴리오/채용 관련 글은 찾지 못했다.
