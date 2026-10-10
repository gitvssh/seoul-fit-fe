/**
 * UI 문구 사전. 도메인별 파일(messages/*.ts)을 합친다.
 * 키는 `영역.이름` 형식이고 한국어 사전이 키의 정본이다. 영어 사전은 같은 키를 모두 가져야 한다.
 */
import * as common from './messages/common';
import * as search from './messages/search';
import * as map from './messages/map';
import * as explorer from './messages/explorer';
import * as facility from './messages/facility';
import * as category from './messages/category';
import * as recommendation from './messages/recommendation';
import * as activity from './messages/activity';
import * as engagement from './messages/engagement';
import * as pages from './messages/pages';
import * as shell from './messages/shell';

export const koMessages = {
  ...common.ko,
  ...search.ko,
  ...map.ko,
  ...explorer.ko,
  ...facility.ko,
  ...category.ko,
  ...recommendation.ko,
  ...activity.ko,
  ...engagement.ko,
  ...pages.ko,
  ...shell.ko,
} as const;

export type MessageKey = keyof typeof koMessages;

export const enMessages: Record<MessageKey, string> = {
  ...common.en,
  ...search.en,
  ...map.en,
  ...explorer.en,
  ...facility.en,
  ...category.en,
  ...recommendation.en,
  ...activity.en,
  ...engagement.en,
  ...pages.en,
  ...shell.en,
};
