import { subscribe, unsubscribe, type ChannelListener } from 'node:diagnostics_channel';
import type { IncomingMessage, ServerResponse } from 'node:http';

const LOG_SCHEMA = 'http_access_json_v1';
const DEFAULT_SERVICE_NAME = 'seoul-fit-frontend';
const DEFAULT_SERVICE_NAMESPACE = 'seoul-fit';
const INVALID_IDENTITY = new Set([
  '',
  'development',
  'local',
  'none',
  'null',
  'placeholder',
  'test',
  'unknown',
  'unset',
]);

const ROUTE_TEMPLATES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\/$/, '/'],
  [/^\/(?:favicon\.ico|robots\.txt|sitemap\.xml)$/, '/_metadata'],
  [/^\/(?:file|globe|next|vercel|window)\.svg$/, '/_asset'],
  [/^\/assets(?:\/.*)?$/, '/assets/*'],
  [/^\/_next(?:\/.*)?$/, '/_next/*'],
  [/^\/home\/?$/, '/home'],
  [/^\/profile\/?$/, '/profile'],
  [/^\/auth\/(?:callback|error)\/?$/, '/auth/:action'],
  [/^\/places\/?$/, '/places'],
  [/^\/places\/[^/]+\/?$/, '/places/:category'],
  [/^\/places\/[^/]+\/[^/]+\/?$/, '/places/:category/:id'],
  [/^\/api\/search\/data\/[^/]+\/?$/, '/api/search/data/:indexId'],
  [
    /^\/api\/(?:bike-stations|congestion|cooling-shelter|cultural-events|cultural-reservations|cultural-spaces|init|libraries|nearby-pois|park|restaurants|subway|weather)\/?$/,
    '/api/:resource',
  ],
  [/^\/api\/parks\/(?:all|nearby)\/?$/, '/api/parks/:scope'],
  [/^\/api\/search\/index\/?$/, '/api/search/index'],
  [/^\/api\/subway\/arrival\/?$/, '/api/subway/arrival'],
];

interface HttpServerEvent {
  request: IncomingMessage;
  response: ServerResponse;
}

interface ObservabilityIdentity {
  serviceName: string;
  serviceNamespace: string;
  serviceVersion: string;
  serviceInstanceId: string;
  deploymentEnvironmentName: string;
  workloadName: string;
}

interface RegisterOptions {
  env?: NodeJS.ProcessEnv;
  now?: () => Date;
  monotonicNow?: () => bigint;
  write?: (line: string) => void;
}

interface RuntimeWriteOptions {
  env?: NodeJS.ProcessEnv;
  now?: () => Date;
  write?: (line: string) => void;
}

type RuntimeOperation = 'bike' | 'cache' | 'scheduler' | 'subway';

type RuntimeEventOptions = RuntimeWriteOptions & {
  eventName: 'external.api.request' | 'service.cache.initialize' | 'service.cache.operation';
  eventAction: 'complete' | 'refresh' | 'retry' | 'schedule' | 'start' | 'stop';
  eventOutcome: 'failure' | 'success';
  operation?: RuntimeOperation;
  error?: unknown;
};

let registered = false;

export function writeRuntimeEvent(options: RuntimeEventOptions): void {
  const identity = resolveIdentity(options.env ?? process.env);
  const write = options.write ?? (line => process.stdout.write(line));
  const failed = options.eventOutcome === 'failure';
  const event: Record<string, string> = {
    '@timestamp': (options.now ?? (() => new Date()))().toISOString(),
    message: failed
      ? 'Runtime cache initialization failed'
      : options.eventAction === 'start'
        ? 'Runtime cache initialization started'
        : 'Runtime cache initialization completed',
    severity_text: failed ? 'ERROR' : 'INFO',
    log_schema: LOG_SCHEMA,
    log_category: 'application',
    service_name: identity.serviceName,
    service_namespace: identity.serviceNamespace,
    service_version: identity.serviceVersion,
    service_instance_id: identity.serviceInstanceId,
    deployment_environment_name: identity.deploymentEnvironmentName,
    workload_name: identity.workloadName,
    event_name: options.eventName,
    event_action: options.eventAction,
    event_outcome: options.eventOutcome,
  };
  if (options.error !== undefined) {
    event.error_type = options.error instanceof Error ? 'Error' : 'NonErrorThrow';
  }
  if (options.operation !== undefined) {
    event.operation = options.operation;
  }
  write(`${JSON.stringify(event)}\n`);
}

export function registerHttpAccessLogging(options: RegisterOptions = {}): () => void {
  const env = options.env ?? process.env;
  const identity = resolveIdentity(env);
  if (registered) {
    return () => undefined;
  }

  const now = options.now ?? (() => new Date());
  const monotonicNow = options.monotonicNow ?? process.hrtime.bigint;
  const write = options.write ?? (line => process.stdout.write(line));
  const requests = new WeakMap<ServerResponse, IncomingMessage>();
  const startedAt = new WeakMap<ServerResponse, bigint>();
  const requestStart = 'http.server.request.start';
  const responseFinish = 'http.server.response.finish';

  const onRequestStart: ChannelListener = message => {
    if (!isHttpServerEvent(message)) {
      return;
    }
    requests.set(message.response, message.request);
    startedAt.set(message.response, monotonicNow());
  };
  const onResponseFinish: ChannelListener = message => {
    if (!isHttpServerEvent(message)) {
      return;
    }
    const request = requests.get(message.response) ?? message.request;
    const start = startedAt.get(message.response);
    requests.delete(message.response);
    startedAt.delete(message.response);

    if (start === undefined || isKubernetesProbe(request)) {
      return;
    }

    const status = message.response.statusCode;
    const durationMs = Math.max(0, Number(monotonicNow() - start) / 1_000_000);
    const accessEvent = {
      '@timestamp': now().toISOString(),
      message: 'HTTP request completed',
      severity_text: severity(status),
      log_schema: LOG_SCHEMA,
      log_category: 'access',
      service_name: identity.serviceName,
      service_namespace: identity.serviceNamespace,
      service_version: identity.serviceVersion,
      service_instance_id: identity.serviceInstanceId,
      deployment_environment_name: identity.deploymentEnvironmentName,
      workload_name: identity.workloadName,
      event_name: 'http.server.request',
      event_action: 'serve',
      event_outcome: status < 400 ? 'success' : 'failure',
      http_method: boundedMethod(request.method),
      http_route: boundedRoute(request.url),
      http_status_code: status,
      duration_ms: Number(durationMs.toFixed(3)),
    };
    write(`${JSON.stringify(accessEvent)}\n`);
  };

  subscribe(requestStart, onRequestStart);
  subscribe(responseFinish, onResponseFinish);
  registered = true;

  return () => {
    unsubscribe(requestStart, onRequestStart);
    unsubscribe(responseFinish, onResponseFinish);
    registered = false;
  };
}

function resolveIdentity(env: NodeJS.ProcessEnv): ObservabilityIdentity {
  const inKubernetes = Boolean(env.KUBERNETES_SERVICE_HOST?.trim());
  const deploymentEnvironment = env.DEPLOYMENT_ENVIRONMENT_NAME?.trim() || 'local';
  const explicitlyLocal = ['local', 'test'].includes(deploymentEnvironment.toLowerCase());

  if (!inKubernetes && explicitlyLocal) {
    return {
      serviceName: env.OTEL_SERVICE_NAME?.trim() || DEFAULT_SERVICE_NAME,
      serviceNamespace: env.OTEL_SERVICE_NAMESPACE?.trim() || DEFAULT_SERVICE_NAMESPACE,
      serviceVersion: env.OTEL_SERVICE_VERSION?.trim() || 'development',
      serviceInstanceId: env.OTEL_SERVICE_INSTANCE_ID?.trim() || 'standalone',
      deploymentEnvironmentName: deploymentEnvironment,
      workloadName: env.K8S_WORKLOAD_NAME?.trim() || 'seoul-fit-fe',
    };
  }

  return {
    serviceName: requireIdentity('service.name', env.OTEL_SERVICE_NAME),
    serviceNamespace: requireIdentity('service.namespace', env.OTEL_SERVICE_NAMESPACE),
    serviceVersion: requireIdentity('service.version', env.OTEL_SERVICE_VERSION),
    serviceInstanceId: requireIdentity('service.instance.id', env.OTEL_SERVICE_INSTANCE_ID),
    deploymentEnvironmentName: requireIdentity(
      'deployment.environment.name',
      env.DEPLOYMENT_ENVIRONMENT_NAME
    ),
    workloadName: env.K8S_WORKLOAD_NAME?.trim() || 'seoul-fit-fe',
  };
}

function requireIdentity(name: string, value: string | undefined): string {
  const candidate = value?.trim() ?? '';
  const normalized = candidate.toLowerCase();
  if (INVALID_IDENTITY.has(normalized) || normalized.startsWith('unknown_service:')) {
    throw new Error(`${name} must identify the deployed workload`);
  }
  return candidate;
}

function boundedMethod(method: string | undefined): string {
  const normalized = method?.toUpperCase() ?? 'UNKNOWN';
  return /^(?:DELETE|GET|HEAD|OPTIONS|PATCH|POST|PUT)$/.test(normalized) ? normalized : 'OTHER';
}

function boundedRoute(rawUrl: string | undefined): string {
  let pathname: string;
  try {
    pathname = new URL(rawUrl ?? '/', 'http://localhost').pathname;
  } catch {
    return '/_invalid';
  }
  return ROUTE_TEMPLATES.find(([pattern]) => pattern.test(pathname))?.[1] ?? '/_unmatched';
}

function severity(status: number): 'ERROR' | 'INFO' | 'WARN' {
  if (status >= 500) {
    return 'ERROR';
  }
  if (status >= 400) {
    return 'WARN';
  }
  return 'INFO';
}

function isKubernetesProbe(request: IncomingMessage): boolean {
  const userAgent = request.headers['user-agent'];
  return typeof userAgent === 'string' && userAgent.startsWith('kube-probe/');
}

function isHttpServerEvent(message: unknown): message is HttpServerEvent {
  if (typeof message !== 'object' || message === null) {
    return false;
  }
  const event = message as Partial<HttpServerEvent>;
  return event.request !== undefined && event.response !== undefined;
}
