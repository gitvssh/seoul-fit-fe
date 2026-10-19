import test from 'node:test';
import assert from 'node:assert/strict';
import { isDataModule } from './validate_sonar_scope.mjs';

test('translation and content declarations may contain static data and URL references', () => {
  assert.equal(
    isDataModule(
      'import { BASE } from "./site"; export const content = { title: "서울", url: `${BASE}/docs`, sizes: [10, -20], nested: { ready: true } } as const;'
    ),
    true
  );
});

for (const source of [
  'export const content = loadContent();',
  'export const content = { get title() { return "서울"; } };',
  'export const content = { title: () => "서울" };',
  'export const content = { title() { return "서울"; } };',
  'export const content = new Content();',
  'export const content = true ? "서울" : "Seoul";',
  'export function title() { return "서울"; }',
  'export let content = "서울";',
  'run(); export const content = "서울";',
  'export const = ;',
]) {
  test(`executable or invalid source cannot inherit data-only scope: ${source}`, () => {
    assert.equal(isDataModule(source), false);
  });
}
