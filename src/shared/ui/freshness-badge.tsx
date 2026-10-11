'use client';

import * as React from 'react';
import { Badge } from '@/shared/ui/badge';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import {
  formatRelativeTime,
  getFreshness,
  getFreshnessBadgeVariant,
  parseTimestamp,
  type FreshnessStatus,
  type FreshnessThresholds,
  type TimestampInput,
} from '@/shared/lib/freshness';
import { cn } from '@/shared/lib/utils';

export interface FreshnessBadgeProps {
  /** 원천 데이터의 기준 시각. 없거나 해석할 수 없으면 `unknown` */
  timestamp?: TimestampInput;
  /** 수집기가 이미 판정한 신선도가 있으면 그 값을 우선한다 */
  status?: FreshnessStatus;
  /** 테스트·SSR에서 기준 시각을 고정할 때 */
  now?: Date;
  /** 원천별 임계값(예: `DAILY_FRESHNESS_THRESHOLDS`) */
  thresholds?: Partial<FreshnessThresholds>;
  /** "3분 전" 같은 상대 시각을 라벨 옆에 붙일지 */
  showRelativeTime?: boolean;
  className?: string;
}

/**
 * 신선도 배지: `freshness.*` 라벨 + `<time dateTime>` 상대 시각.
 * live→live, recent→success, stale→warning, unknown→muted 변형을 쓴다.
 */
export function FreshnessBadge({
  timestamp,
  status,
  now,
  thresholds,
  showRelativeTime = true,
  className,
}: FreshnessBadgeProps) {
  const { locale, t } = useI18n();
  const reference = now ?? new Date();
  const parsed = parseTimestamp(timestamp);
  const resolved = status ?? getFreshness(parsed, reference, thresholds);
  const relative = parsed && showRelativeTime ? formatRelativeTime(parsed, locale, reference) : '';

  return (
    <Badge
      variant={getFreshnessBadgeVariant(resolved)}
      className={cn('tabular-nums', className)}
      data-freshness={resolved}
    >
      {t(`freshness.${resolved}` as MessageKey)}
      {parsed ? (
        <time dateTime={parsed.toISOString()} suppressHydrationWarning>
          {relative ? ` · ${relative}` : null}
        </time>
      ) : null}
    </Badge>
  );
}
