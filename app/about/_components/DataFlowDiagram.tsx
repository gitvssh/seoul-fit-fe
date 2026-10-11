import { ArrowDown, ArrowRight } from 'lucide-react';

interface Node {
  title: string;
  lines: string[];
}

const NODES: Node[] = [
  { title: '브라우저', lines: ['React 19 앱 셸', 'Kakao 지도 SDK', '위치는 버튼으로만 요청'] },
  {
    title: 'Next.js 16',
    lines: [
      'Route Handlers + 프로세스 내 캐시',
      '따릉이 1분·지하철 시작 시 갱신',
      '/places SSR, sitemap, OG',
    ],
  },
  {
    title: '서울 열린데이터광장 · Spring Boot',
    lines: [
      '실시간 도시데이터·따릉이·지하철 (직접 조회)',
      '장소 카탈로그·검색 인덱스·사용자·알림 (백엔드)',
      '백엔드 일 배치가 원천을 적재',
    ],
  },
  {
    title: 'PostgreSQL',
    lines: ['공원·도서관·문화·음식점·쉼터', 'POI 검색 인덱스', '사용자 저장·생활권·알림 규칙'],
  },
];

/** Request path from the browser to the data stores, as a responsive grid (no SVG so it reads in both themes). */
export function DataFlowDiagram() {
  return (
    <ol
      className='grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch'
      aria-label='데이터 흐름'
    >
      {NODES.map((node, index) => (
        <li key={node.title} className='contents'>
          <div className='rounded-lg border border-border bg-card p-4 shadow-float-sm'>
            <p className='text-label text-primary tabular-nums'>{index + 1}</p>
            <h3 className='mt-1 text-body font-semibold text-foreground'>{node.title}</h3>
            <ul className='mt-2 space-y-1 text-body-sm text-muted-foreground'>
              {node.lines.map(line => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          {index < NODES.length - 1 && (
            <div
              className='flex items-center justify-center text-muted-foreground'
              aria-hidden='true'
            >
              <ArrowDown className='size-5 lg:hidden' />
              <ArrowRight className='hidden size-5 lg:block' />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
