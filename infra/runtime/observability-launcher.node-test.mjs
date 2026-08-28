import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

import {
  createOutputGate,
  createSuppressionCoalescer,
  isRfc3339Timestamp,
  isSafeNormalizedOutputLine,
  isSafeStructuredLine,
  normalizeStructuredLine,
} from './observability-launcher.mjs';

const IDENTITY = {
  deployment_environment_name: 'dev',
  service_instance_id: 'review-pod-uid',
  service_name: 'seoul-fit-frontend',
  service_namespace: 'seoul-fit',
  service_version: 'sha256:review-only',
  workload_name: 'seoul-fit-fe',
};

function accessDocument(overrides = {}) {
  return {
    '@timestamp': '2026-08-29T00:00:00.000Z',
    message: 'HTTP request completed',
    severity_text: 'INFO',
    log_schema: 'http_access_json_v1',
    log_category: 'access',
    ...IDENTITY,
    event_name: 'http.server.request',
    event_action: 'serve',
    event_outcome: 'success',
    http_method: 'GET',
    http_route: '/',
    http_status_code: 200,
    duration_ms: 1.25,
    ...overrides,
  };
}

function applicationDocument(overrides = {}) {
  return {
    '@timestamp': '2026-08-29T00:00:00.000Z',
    message: 'Runtime cache initialization completed',
    severity_text: 'INFO',
    log_schema: 'http_access_json_v1',
    log_category: 'application',
    ...IDENTITY,
    event_name: 'service.cache.initialize',
    event_action: 'complete',
    event_outcome: 'success',
    ...overrides,
  };
}

function suppressionDocument(overrides = {}) {
  return {
    '@timestamp': '2026-08-29T00:00:00.000Z',
    message: 'Unstructured runtime output suppressed',
    severity_text: 'WARN',
    log_schema: 'http_access_json_v1',
    log_category: 'application',
    ...IDENTITY,
    event_name: 'runtime.unstructured.output',
    event_action: 'suppress',
    event_outcome: 'unknown',
    suppressed_stdout_line_count: 1,
    suppressed_stderr_line_count: 0,
    suppression_count_capped: false,
    ...overrides,
  };
}

test('accepts the standard WARN severity safely for an exact 4xx record', () => {
  const line = JSON.stringify(
    accessDocument({
      severity_text: 'WARN',
      event_outcome: 'failure',
      http_route: '/_unmatched',
      http_status_code: 404,
    })
  );

  assert.equal(isSafeStructuredLine(line, IDENTITY), true);
});

test('rejects category-inapplicable fields, unsafe routes, and inconsistent values', () => {
  const cases = [
    applicationDocument({ http_route: 'sentinel-sensitive-value' }),
    accessDocument({ operation: 'cache' }),
    accessDocument({ http_route: '/users/sentinel-sensitive-value' }),
    accessDocument({ severity_text: 'WARNING', http_status_code: 404, event_outcome: 'failure' }),
    accessDocument({ event_outcome: 'failure' }),
    applicationDocument({ error_type: 'sentinel-sensitive-value' }),
  ];

  for (const document of cases) {
    assert.equal(isSafeStructuredLine(JSON.stringify(document), IDENTITY), false);
  }
});

test('enforces exact per-category types and numeric bounds', () => {
  const unsafeStructured = [
    accessDocument({ duration_ms: -1 }),
    accessDocument({ duration_ms: 86_400_000.001 }),
    accessDocument({ duration_ms: '1' }),
    accessDocument({ http_status_code: 99 }),
    accessDocument({ http_status_code: 600 }),
    accessDocument({ http_status_code: 200.5 }),
    accessDocument({ http_method: 'get' }),
    applicationDocument({ operation: 'sentinel-sensitive-value' }),
  ];
  for (const document of unsafeStructured) {
    assert.equal(isSafeStructuredLine(JSON.stringify(document), IDENTITY), false);
  }

  const unsafeNormalized = [
    suppressionDocument({ suppressed_stdout_line_count: '1' }),
    suppressionDocument({ suppressed_stdout_line_count: 1_025 }),
    suppressionDocument({ unexpected: 'sentinel-sensitive-value' }),
    suppressionDocument({ severity_text: 'WARNING' }),
  ];
  for (const document of unsafeNormalized) {
    assert.equal(isSafeNormalizedOutputLine(JSON.stringify(document), IDENTITY), false);
  }
});

test('canonicalizes accepted JSON so duplicate-key values can never be forwarded', () => {
  const safeFields = JSON.stringify(accessDocument()).slice(1);
  const line = `{"message":"sentinel-sensitive-value",${safeFields}`;
  const normalized = normalizeStructuredLine(line, IDENTITY);

  assert.equal(isSafeStructuredLine(line, IDENTITY), true);
  assert.notEqual(normalized, undefined);
  assert.equal(isSafeNormalizedOutputLine(line, IDENTITY), false);
  assert.equal(isSafeNormalizedOutputLine(normalized, IDENTITY), true);
  assert.equal(normalized.includes('sentinel-sensitive-value'), false);
  assert.deepEqual(JSON.parse(normalized), accessDocument());
});

test('requires a real bounded RFC3339 timestamp', () => {
  assert.equal(isRfc3339Timestamp('2026-08-29T00:00:00.123Z'), true);
  assert.equal(isRfc3339Timestamp('2026-08-29T09:00:00+09:00'), true);
  assert.equal(isRfc3339Timestamp('2024-02-29T00:00:00Z'), true);
  assert.equal(isRfc3339Timestamp('2025-02-29T00:00:00Z'), false);
  assert.equal(isRfc3339Timestamp('2026-02-30T00:00:00Z'), false);
  assert.equal(isRfc3339Timestamp('2026-13-01T00:00:00Z'), false);
  assert.equal(isRfc3339Timestamp('2026-08-29T24:00:00Z'), false);
  assert.equal(isRfc3339Timestamp('2026-08-29T00:00:00+24:00'), false);
  assert.equal(isRfc3339Timestamp('sentinel-sensitive-value'), false);
  assert.equal(
    isSafeStructuredLine(
      JSON.stringify(accessDocument({ '@timestamp': 'sentinel-sensitive-value' })),
      IDENTITY
    ),
    false
  );
});

test('pauses every child stream on stdout backpressure and resumes only after drain', () => {
  class FakeOutput extends EventEmitter {
    accepted = false;
    writes = [];

    write(value) {
      this.writes.push(value);
      return this.accepted;
    }
  }

  const output = new FakeOutput();
  const inputs = [
    {
      pauses: 0,
      resumes: 0,
      pause() {
        this.pauses += 1;
      },
      resume() {
        this.resumes += 1;
      },
    },
    {
      pauses: 0,
      resumes: 0,
      pause() {
        this.pauses += 1;
      },
      resume() {
        this.resumes += 1;
      },
    },
  ];
  const gate = createOutputGate(output);
  for (const input of inputs) gate.trackInput(input);

  assert.equal(gate.writeLine('bounded'), false);
  assert.equal(gate.isBlocked(), true);
  assert.deepEqual(
    inputs.map(input => input.pauses),
    [1, 1]
  );
  assert.deepEqual(
    inputs.map(input => input.resumes),
    [0, 0]
  );

  output.accepted = true;
  output.emit('drain');
  assert.equal(gate.isBlocked(), false);
  assert.deepEqual(
    inputs.map(input => input.resumes),
    [1, 1]
  );
});

test('coalesces invalid lines into one capped, content-free event per window', () => {
  class FakeOutput extends EventEmitter {
    writes = [];

    write(value) {
      this.writes.push(value);
      return true;
    }
  }

  const output = new FakeOutput();
  const gate = createOutputGate(output);
  let timerCallback;
  let timerCalls = 0;
  const coalescer = createSuppressionCoalescer({
    identity: IDENTITY,
    gate,
    maxCount: 3,
    now: () => new Date('2026-08-29T00:00:00.000Z'),
    setTimer(callback) {
      timerCalls += 1;
      timerCallback = callback;
      return 1;
    },
    clearTimer() {},
    windowMs: 10,
  });

  for (let index = 0; index < 100; index += 1) coalescer.record('stdout');
  for (let index = 0; index < 2; index += 1) coalescer.record('stderr');
  assert.equal(output.writes.length, 0);
  assert.equal(timerCalls, 1);

  timerCallback();
  assert.equal(output.writes.length, 1);
  const line = output.writes[0].trim();
  const document = JSON.parse(line);
  assert.equal(document.suppressed_stdout_line_count, 3);
  assert.equal(document.suppressed_stderr_line_count, 2);
  assert.equal(document.suppression_count_capped, true);
  assert.equal(line.includes('sentinel-sensitive-value'), false);
  assert.equal(isSafeNormalizedOutputLine(line, IDENTITY), true);
});
