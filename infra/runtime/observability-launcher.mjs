import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const MAX_LINE_BYTES = 65_536;
export const MAX_SUPPRESSED_LINES_PER_WINDOW = 1_024;
export const SUPPRESSION_WINDOW_MS = 1_000;

const IDENTITY_KEYS = [
  'deployment_environment_name',
  'service_instance_id',
  'service_name',
  'service_namespace',
  'service_version',
  'workload_name',
];
const BASE_KEYS = [
  '@timestamp',
  'event_action',
  'event_name',
  'event_outcome',
  'log_category',
  'log_schema',
  'message',
  'severity_text',
  'span_id',
  'trace_id',
  ...IDENTITY_KEYS,
];
const ACCESS_KEYS = new Set([
  ...BASE_KEYS,
  'duration_ms',
  'http_method',
  'http_route',
  'http_status_code',
]);
const APPLICATION_REQUIRED_KEYS = new Set(BASE_KEYS);
const APPLICATION_OPTIONAL_KEYS = new Set(['error_type', 'operation']);
const SUPPRESSION_KEYS = new Set([
  ...BASE_KEYS,
  'suppressed_stderr_line_count',
  'suppressed_stdout_line_count',
  'suppression_count_capped',
]);
const APPLICATION_EVENTS = new Set([
  'external.api.request',
  'service.cache.initialize',
  'service.cache.operation',
]);
const APPLICATION_TRANSITIONS = new Set([
  'external.api.request|complete|failure',
  'external.api.request|complete|success',
  'external.api.request|retry|failure',
  'external.api.request|start|success',
  'service.cache.initialize|complete|failure',
  'service.cache.initialize|complete|success',
  'service.cache.initialize|start|success',
  'service.cache.operation|refresh|failure',
  'service.cache.operation|refresh|success',
  'service.cache.operation|schedule|success',
  'service.cache.operation|stop|success',
]);
const OPERATIONS = new Set(['bike', 'cache', 'scheduler', 'subway']);
const METHODS = new Set(['DELETE', 'GET', 'HEAD', 'OPTIONS', 'OTHER', 'PATCH', 'POST', 'PUT']);
const ROUTES = new Set([
  '/',
  '/_asset',
  '/_invalid',
  '/_metadata',
  '/_next/*',
  '/_unmatched',
  '/api/:resource',
  '/api/parks/:scope',
  '/api/search/data/:indexId',
  '/api/search/index',
  '/api/subway/arrival',
  '/assets/*',
  '/auth/:action',
  '/home',
  '/places',
  '/places/:category',
  '/places/:category/:id',
  '/profile',
]);
const ERROR_TYPES = new Set(['Error', 'NonErrorThrow']);
const RFC3339_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(?:[Zz]|([+-])(\d{2}):(\d{2}))$/;

function byteLength(value) {
  return Buffer.byteLength(value, 'utf8');
}

function isBoundedString(value, maxBytes = 256) {
  return typeof value === 'string' && value.length > 0 && byteLength(value) <= maxBytes;
}

export function isRfc3339Timestamp(value) {
  if (!isBoundedString(value, 35)) return false;
  const match = RFC3339_PATTERN.exec(value);
  if (match === null) return false;
  const [
    ,
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText,
    ,
    ,
    zoneHour,
    zoneMinute,
  ] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const maximumDay = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  return (
    maximumDay !== undefined &&
    day >= 1 &&
    day <= maximumDay &&
    hour <= 23 &&
    minute <= 59 &&
    second <= 60 &&
    (zoneHour === undefined || (Number(zoneHour) <= 23 && Number(zoneMinute) <= 59))
  );
}

function parseJsonObject(line) {
  if (!isBoundedString(line, MAX_LINE_BYTES)) return undefined;
  let document;
  try {
    document = JSON.parse(line);
  } catch {
    return undefined;
  }
  if (document === null || Array.isArray(document) || typeof document !== 'object') {
    return undefined;
  }
  return document;
}

function hasExactKeys(document, requiredKeys, optionalKeys = new Set()) {
  const keys = Object.keys(document);
  return (
    [...requiredKeys].every(key => Object.hasOwn(document, key)) &&
    keys.every(key => requiredKeys.has(key) || optionalKeys.has(key))
  );
}

function hasExactIdentity(document, identity) {
  return Object.entries(identity).every(
    ([key, value]) => isBoundedString(value, 128) && document[key] === value
  );
}

function hasSafeBase(document, identity) {
  return (
    hasExactIdentity(document, identity) &&
    document.log_schema === 'http_access_json_v1' &&
    document.trace_id === '' &&
    document.span_id === '' &&
    isRfc3339Timestamp(document['@timestamp'])
  );
}

function expectedAccessSeverity(status) {
  if (status >= 500) return 'ERROR';
  if (status >= 400) return 'WARN';
  return 'INFO';
}

function isSafeAccessDocument(document, identity) {
  if (!hasExactKeys(document, ACCESS_KEYS) || !hasSafeBase(document, identity)) return false;
  if (
    document.log_category !== 'access' ||
    document.message !== 'HTTP request completed' ||
    document.event_name !== 'http.server.request' ||
    document.event_action !== 'serve' ||
    !METHODS.has(document.http_method) ||
    !ROUTES.has(document.http_route) ||
    !Number.isInteger(document.http_status_code) ||
    document.http_status_code < 100 ||
    document.http_status_code > 599 ||
    !Number.isFinite(document.duration_ms) ||
    document.duration_ms < 0 ||
    document.duration_ms > 86_400_000
  ) {
    return false;
  }
  const failed = document.http_status_code >= 400;
  return (
    document.severity_text === expectedAccessSeverity(document.http_status_code) &&
    document.event_outcome === (failed ? 'failure' : 'success')
  );
}

function lifecycleMessage(document) {
  if (document.event_outcome === 'failure') return 'Runtime cache initialization failed';
  if (document.event_action === 'start') return 'Runtime cache initialization started';
  return 'Runtime cache initialization completed';
}

function isSafeApplicationDocument(document, identity) {
  if (
    !hasExactKeys(document, APPLICATION_REQUIRED_KEYS, APPLICATION_OPTIONAL_KEYS) ||
    !hasSafeBase(document, identity)
  ) {
    return false;
  }
  const transition = `${document.event_name}|${document.event_action}|${document.event_outcome}`;
  if (
    document.log_category !== 'application' ||
    !APPLICATION_EVENTS.has(document.event_name) ||
    !APPLICATION_TRANSITIONS.has(transition) ||
    document.message !== lifecycleMessage(document) ||
    document.severity_text !== (document.event_outcome === 'failure' ? 'ERROR' : 'INFO')
  ) {
    return false;
  }
  const operationRequired = document.event_name !== 'service.cache.initialize';
  if (
    (operationRequired && !OPERATIONS.has(document.operation)) ||
    (!operationRequired && document.operation !== undefined && !OPERATIONS.has(document.operation))
  ) {
    return false;
  }
  return (
    (document.error_type === undefined ||
      (document.event_outcome === 'failure' && ERROR_TYPES.has(document.error_type))) &&
    !(document.event_outcome === 'success' && document.error_type !== undefined)
  );
}

function isSafeSuppressionDocument(document, identity) {
  if (!hasExactKeys(document, SUPPRESSION_KEYS) || !hasSafeBase(document, identity)) return false;
  const stdoutCount = document.suppressed_stdout_line_count;
  const stderrCount = document.suppressed_stderr_line_count;
  if (
    !Number.isInteger(stdoutCount) ||
    !Number.isInteger(stderrCount) ||
    stdoutCount < 0 ||
    stderrCount < 0 ||
    stdoutCount > MAX_SUPPRESSED_LINES_PER_WINDOW ||
    stderrCount > MAX_SUPPRESSED_LINES_PER_WINDOW ||
    stdoutCount + stderrCount === 0 ||
    typeof document.suppression_count_capped !== 'boolean'
  ) {
    return false;
  }
  const failed = stderrCount > 0;
  return (
    document.message === 'Unstructured runtime output suppressed' &&
    document.log_category === 'application' &&
    document.event_name === 'runtime.unstructured.output' &&
    document.event_action === 'suppress' &&
    document.severity_text === (failed ? 'ERROR' : 'WARN') &&
    document.event_outcome === (failed ? 'failure' : 'unknown')
  );
}

function parseSafeStructuredDocument(line, identity) {
  const document = parseJsonObject(line);
  if (document === undefined) return undefined;
  const safe =
    document.log_category === 'access'
      ? isSafeAccessDocument(document, identity)
      : isSafeApplicationDocument(document, identity);
  return safe ? document : undefined;
}

export function normalizeStructuredLine(line, identity) {
  const document = parseSafeStructuredDocument(line, identity);
  return document === undefined ? undefined : JSON.stringify(document);
}

export function isSafeStructuredLine(line, identity) {
  return parseSafeStructuredDocument(line, identity) !== undefined;
}

export function isSafeNormalizedOutputLine(line, identity) {
  const document = parseJsonObject(line);
  if (document === undefined) return false;
  const safe =
    (document.log_category === 'access'
      ? isSafeAccessDocument(document, identity)
      : isSafeApplicationDocument(document, identity)) ||
    isSafeSuppressionDocument(document, identity);
  return safe && line === JSON.stringify(document);
}

export function createOutputGate(output) {
  const inputs = new Set();
  const drainHandlers = [];
  let blocked = false;

  function handleDrain() {
    blocked = false;
    for (const handler of drainHandlers) {
      handler();
      if (blocked) return;
    }
    for (const input of inputs) input.resume();
  }

  return {
    isBlocked: () => blocked,
    onDrain(handler) {
      drainHandlers.push(handler);
    },
    trackInput(input) {
      inputs.add(input);
      if (blocked) input.pause();
    },
    writeLine(line) {
      if (blocked) return false;
      const accepted = output.write(`${line}\n`);
      if (!accepted) {
        blocked = true;
        for (const input of inputs) input.pause();
        output.once('drain', handleDrain);
      }
      return accepted;
    },
  };
}

export function createSuppressionCoalescer({
  identity,
  gate,
  maxCount = MAX_SUPPRESSED_LINES_PER_WINDOW,
  now = () => new Date(),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  windowMs = SUPPRESSION_WINDOW_MS,
}) {
  let stdoutCount = 0;
  let stderrCount = 0;
  let countCapped = false;
  let timer;
  let due = false;

  function increment(streamName) {
    if (streamName === 'stderr') {
      if (stderrCount < maxCount) stderrCount += 1;
      else countCapped = true;
    } else if (stdoutCount < maxCount) {
      stdoutCount += 1;
    } else {
      countCapped = true;
    }
  }

  function flushIfDue() {
    if (!due || gate.isBlocked() || stdoutCount + stderrCount === 0) return false;
    const failed = stderrCount > 0;
    const document = {
      '@timestamp': now().toISOString(),
      message: 'Unstructured runtime output suppressed',
      severity_text: failed ? 'ERROR' : 'WARN',
      log_schema: 'http_access_json_v1',
      log_category: 'application',
      trace_id: '',
      span_id: '',
      ...identity,
      event_name: 'runtime.unstructured.output',
      event_action: 'suppress',
      event_outcome: failed ? 'failure' : 'unknown',
      suppressed_stdout_line_count: stdoutCount,
      suppressed_stderr_line_count: stderrCount,
      suppression_count_capped: countCapped,
    };
    stdoutCount = 0;
    stderrCount = 0;
    countCapped = false;
    due = false;
    gate.writeLine(JSON.stringify(document));
    return true;
  }

  function makeDue() {
    timer = undefined;
    due = true;
    flushIfDue();
  }

  return {
    record(streamName) {
      increment(streamName);
      if (timer === undefined && !due) timer = setTimer(makeDue, windowMs);
    },
    flushIfDue,
    flushNow() {
      if (timer !== undefined) clearTimer(timer);
      timer = undefined;
      due = true;
      return flushIfDue();
    },
  };
}

function pipeBoundedLines(readable, streamName, { coalescer, gate, identity }) {
  readable.setEncoding('utf8');
  let pending = '';
  let ended = false;

  function forwardLine(line) {
    const normalized = normalizeStructuredLine(line, identity);
    if (normalized !== undefined) return gate.writeLine(normalized);
    if (line.length > 0) coalescer.record(streamName);
    return true;
  }

  function processPending() {
    while (!gate.isBlocked()) {
      const newline = pending.indexOf('\n');
      if (newline < 0) break;
      const line = pending.slice(0, newline).replace(/\r$/, '');
      pending = pending.slice(newline + 1);
      if (!forwardLine(line)) return;
    }
    if (!gate.isBlocked() && byteLength(pending) > MAX_LINE_BYTES) {
      coalescer.record(streamName);
      pending = '';
    }
    if (!gate.isBlocked() && ended && pending.length > 0) {
      const line = pending.replace(/\r$/, '');
      pending = '';
      forwardLine(line);
    }
  }

  gate.trackInput(readable);
  gate.onDrain(processPending);
  readable.on('data', chunk => {
    pending += chunk;
    processPending();
  });
  readable.on('end', () => {
    ended = true;
    processPending();
  });
}

function runtimeIdentity(env) {
  return {
    deployment_environment_name: env.DEPLOYMENT_ENVIRONMENT_NAME,
    service_instance_id: env.OTEL_SERVICE_INSTANCE_ID,
    service_name: env.OTEL_SERVICE_NAME,
    service_namespace: env.OTEL_SERVICE_NAMESPACE,
    service_version: env.OTEL_SERVICE_VERSION,
    workload_name: env.K8S_WORKLOAD_NAME,
  };
}

export function runLauncher({
  argv = process.argv.slice(2),
  env = process.env,
  output = process.stdout,
} = {}) {
  const identity = runtimeIdentity(env);
  const gate = createOutputGate(output);
  const coalescer = createSuppressionCoalescer({ identity, gate });
  gate.onDrain(coalescer.flushIfDue);

  const [command, ...args] = argv;
  if (!command) {
    coalescer.record('stderr');
    coalescer.flushNow();
    process.exitCode = 64;
    return undefined;
  }

  const child = spawn(command, args, {
    env,
    stdio: ['inherit', 'pipe', 'pipe'],
  });
  pipeBoundedLines(child.stdout, 'stdout', { coalescer, gate, identity });
  pipeBoundedLines(child.stderr, 'stderr', { coalescer, gate, identity });

  const signalHandlers = new Map();
  for (const signal of ['SIGINT', 'SIGTERM']) {
    const handler = () => child.kill(signal);
    signalHandlers.set(signal, handler);
    process.once(signal, handler);
  }

  child.once('error', () => {
    coalescer.record('stderr');
    coalescer.flushNow();
    process.exitCode = 127;
  });
  child.once('close', (code, signal) => {
    for (const [registeredSignal, handler] of signalHandlers) {
      process.removeListener(registeredSignal, handler);
    }
    process.exitCode = Number.isInteger(code) ? code : signal ? 1 : 0;
  });
  return child;
}

const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) runLauncher();
