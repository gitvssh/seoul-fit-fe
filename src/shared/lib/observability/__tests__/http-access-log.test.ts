/** @jest-environment node */

import { createServer, request } from 'node:http';
import type { AddressInfo } from 'node:net';

import { registerHttpAccessLogging, writeRuntimeEvent } from '../http-access-log';

const DEPLOYED_ENV: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  KUBERNETES_SERVICE_HOST: '10.43.0.1',
  DEPLOYMENT_ENVIRONMENT_NAME: 'dev',
  OTEL_SERVICE_NAME: 'seoul-fit-frontend',
  OTEL_SERVICE_NAMESPACE: 'seoul-fit',
  OTEL_SERVICE_VERSION: 'sha256:0123456789abcdef',
  OTEL_SERVICE_INSTANCE_ID: 'pod-uid-0123456789',
  K8S_WORKLOAD_NAME: 'seoul-fit-fe',
};

describe('HTTP access log contract', () => {
  it('emits one safe JSON line for an actual request', async () => {
    const lines: string[] = [];
    const cleanup = registerHttpAccessLogging({
      env: DEPLOYED_ENV,
      write: line => lines.push(line),
    });
    const server = createServer((incoming, response) => {
      incoming.resume();
      incoming.on('end', () => {
        response.statusCode = 201;
        response.end('response-body-secret');
      });
    });

    try {
      await listen(server);
      const { port } = server.address() as AddressInfo;
      await sendRequest(port, {
        path: '/api/search/data/path-secret?token=query-secret#fragment-secret',
        auth: 'userinfo-secret:password-secret',
        headers: {
          authorization: 'Bearer header-secret',
          'x-api-key': 'api-key-header-secret',
        },
        body: 'request-body-secret',
      });
      await new Promise(resolve => setImmediate(resolve));

      expect(lines).toHaveLength(1);
      const event = JSON.parse(lines[0]);
      expect(event).toMatchObject({
        message: 'HTTP request completed',
        severity_text: 'INFO',
        log_schema: 'http_access_json_v1',
        log_category: 'access',
        service_name: 'seoul-fit-frontend',
        service_namespace: 'seoul-fit',
        service_version: 'sha256:0123456789abcdef',
        service_instance_id: 'pod-uid-0123456789',
        deployment_environment_name: 'dev',
        workload_name: 'seoul-fit-fe',
        event_name: 'http.server.request',
        event_action: 'serve',
        event_outcome: 'success',
        http_method: 'POST',
        http_route: '/api/search/data/:indexId',
        http_status_code: 201,
      });
      expect(event['@timestamp']).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(event.duration_ms).toEqual(expect.any(Number));

      const exported = lines.join('');
      expect(exported).not.toContain('path-secret');
      expect(exported).not.toContain('query-secret');
      expect(exported).not.toContain('fragment-secret');
      expect(exported).not.toContain('userinfo-secret');
      expect(exported).not.toContain('password-secret');
      expect(exported).not.toContain('header-secret');
      expect(exported).not.toContain('api-key-header-secret');
      expect(exported).not.toContain('request-body-secret');
      expect(exported).not.toContain('response-body-secret');
    } finally {
      cleanup();
      await close(server);
    }
  });

  it('suppresses Kubernetes probe noise without exporting its headers', async () => {
    const lines: string[] = [];
    const cleanup = registerHttpAccessLogging({
      env: DEPLOYED_ENV,
      write: line => lines.push(line),
    });
    const server = createServer((_incoming, response) => response.end('ok'));

    try {
      await listen(server);
      const { port } = server.address() as AddressInfo;
      await sendRequest(port, {
        path: '/',
        headers: { 'user-agent': 'kube-probe/1.34 probe-header-secret' },
      });
      await new Promise(resolve => setImmediate(resolve));

      expect(lines).toEqual([]);
    } finally {
      cleanup();
      await close(server);
    }
  });

  it('fails closed for every ambiguous in-cluster identity', () => {
    const identityFields = [
      'DEPLOYMENT_ENVIRONMENT_NAME',
      'OTEL_SERVICE_NAME',
      'OTEL_SERVICE_NAMESPACE',
      'OTEL_SERVICE_VERSION',
      'OTEL_SERVICE_INSTANCE_ID',
    ] as const;
    const invalidValues = [
      '',
      '  ',
      'development',
      'local',
      'none',
      'null',
      'placeholder',
      'test',
      'unknown',
      'unset',
      'unknown_service:node',
    ];

    for (const field of identityFields) {
      for (const invalidValue of invalidValues) {
        expect(() =>
          registerHttpAccessLogging({
            env: { ...DEPLOYED_ENV, [field]: invalidValue },
            write: () => undefined,
          })
        ).toThrow('must identify the deployed workload');
      }
    }
  });

  it('keeps local and test processes usable without Kubernetes metadata', () => {
    for (const deploymentEnvironment of ['local', 'test'] as const) {
      expect(() => {
        const cleanup = registerHttpAccessLogging({
          env: {
            NODE_ENV: 'test',
            DEPLOYMENT_ENVIRONMENT_NAME: deploymentEnvironment,
          },
          write: () => undefined,
        });
        cleanup();
      }).not.toThrow();
    }
  });
});

describe('runtime lifecycle log contract', () => {
  it('emits a bounded cache lifecycle event with deployed identity', () => {
    const lines: string[] = [];

    writeRuntimeEvent({
      eventName: 'service.cache.initialize',
      eventAction: 'complete',
      eventOutcome: 'success',
      env: DEPLOYED_ENV,
      now: () => new Date('2026-08-29T00:00:00.000Z'),
      write: line => lines.push(line),
    });

    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toEqual({
      '@timestamp': '2026-08-29T00:00:00.000Z',
      message: 'Runtime cache initialization completed',
      severity_text: 'INFO',
      log_schema: 'http_access_json_v1',
      log_category: 'application',
      service_name: 'seoul-fit-frontend',
      service_namespace: 'seoul-fit',
      service_version: 'sha256:0123456789abcdef',
      service_instance_id: 'pod-uid-0123456789',
      deployment_environment_name: 'dev',
      workload_name: 'seoul-fit-fe',
      event_name: 'service.cache.initialize',
      event_action: 'complete',
      event_outcome: 'success',
    });
  });

  it('never serializes a thrown value, message, or stack', () => {
    const lines: string[] = [];
    const error = new Error('runtime-message-secret');
    error.stack = 'runtime-stack-secret';

    writeRuntimeEvent({
      eventName: 'service.cache.initialize',
      eventAction: 'complete',
      eventOutcome: 'failure',
      error,
      env: DEPLOYED_ENV,
      write: line => lines.push(line),
    });

    expect(JSON.parse(lines[0])).toMatchObject({
      severity_text: 'ERROR',
      event_name: 'service.cache.initialize',
      event_outcome: 'failure',
      error_type: 'Error',
    });
    expect(lines[0]).not.toContain('runtime-message-secret');
    expect(lines[0]).not.toContain('runtime-stack-secret');
  });

  it('covers the bounded start, operation, and non-Error variants', () => {
    const lines: string[] = [];

    writeRuntimeEvent({
      eventName: 'external.api.request',
      eventAction: 'start',
      eventOutcome: 'success',
      operation: 'bike',
      env: DEPLOYED_ENV,
      write: line => lines.push(line),
    });
    writeRuntimeEvent({
      eventName: 'external.api.request',
      eventAction: 'complete',
      eventOutcome: 'failure',
      error: 'non-error-secret',
      env: DEPLOYED_ENV,
      write: line => lines.push(line),
    });

    expect(JSON.parse(lines[0])).toMatchObject({
      message: 'Runtime cache initialization started',
      event_action: 'start',
      operation: 'bike',
    });
    expect(JSON.parse(lines[1])).toMatchObject({
      message: 'Runtime cache initialization failed',
      error_type: 'NonErrorThrow',
    });
    expect(lines.join('')).not.toContain('non-error-secret');
  });
});

interface RequestOptions {
  path: string;
  auth?: string;
  headers?: Record<string, string>;
  body?: string;
}

async function sendRequest(port: number, options: RequestOptions): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const outgoing = request(
      {
        hostname: '127.0.0.1',
        port,
        path: options.path,
        method: options.body === undefined ? 'GET' : 'POST',
        auth: options.auth,
        headers: options.headers,
      },
      response => {
        response.resume();
        response.on('end', resolve);
      }
    );
    outgoing.on('error', reject);
    if (options.body !== undefined) {
      outgoing.write(options.body);
    }
    outgoing.end();
  });
}

async function listen(server: ReturnType<typeof createServer>): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
}

async function close(server: ReturnType<typeof createServer>): Promise<void> {
  if (!server.listening) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    server.close(error => (error === undefined ? resolve() : reject(error)));
  });
}
