/**
 * @fileoverview 중앙화된 로깅 시스템
 * @description 개발/프로덕션 환경별 로깅 제어
 * @author Seoul Fit Team
 * @since 2.0.0
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  enableTimestamp?: boolean;
  enableColors?: boolean;
  remoteLogging?: boolean;
}

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
  timestamp: Date;
  error?: Error;
}

/**
 * 로거 클래스
 * 환경별로 다른 로깅 전략 적용
 */
export class Logger {
  private static globalConfig: LoggerConfig = {
    level: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
    prefix: '[Seoul Fit]',
    enableTimestamp: true,
    enableColors: process.env.NODE_ENV !== 'production',
    remoteLogging: process.env.NODE_ENV === 'production',
  };

  private static logBuffer: LogEntry[] = [];
  private static readonly MAX_BUFFER_SIZE = 100;

  constructor(private readonly context: string) {}

  /**
   * 전역 설정 변경
   */
  static configure(config: Partial<LoggerConfig>): void {
    Logger.globalConfig = { ...Logger.globalConfig, ...config };
  }

  /**
   * 디버그 레벨 로그
   * 개발 환경에서만 출력
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * 정보 레벨 로그
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * 경고 레벨 로그
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * 에러 레벨 로그
   */
  error(message: string, error?: Error | any, data?: any): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.log(LogLevel.ERROR, message, data, errorObj);
  }

  /**
   * 성능 측정 로그
   */
  time(label: string): void {
    if (Logger.globalConfig.level <= LogLevel.DEBUG) {
      console.time(`${this.getPrefix()}${label}`);
    }
  }

  timeEnd(label: string): void {
    if (Logger.globalConfig.level <= LogLevel.DEBUG) {
      console.timeEnd(`${this.getPrefix()}${label}`);
    }
  }

  /**
   * 그룹 로깅
   */
  group(label: string): void {
    if (Logger.globalConfig.level <= LogLevel.DEBUG) {
      console.group(`${this.getPrefix()}${label}`);
    }
  }

  groupEnd(): void {
    if (Logger.globalConfig.level <= LogLevel.DEBUG) {
      console.groupEnd();
    }
  }

  /**
   * 테이블 형태로 로깅
   */
  table(data: any): void {
    if (Logger.globalConfig.level <= LogLevel.DEBUG) {
      console.table(data);
    }
  }

  /**
   * 내부 로깅 메소드
   */
  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    if (level < Logger.globalConfig.level) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      context: this.context,
      message,
      data,
      timestamp: new Date(),
      error,
    };

    // 버퍼에 저장
    this.addToBuffer(logEntry);

    // 콘솔 출력
    this.logToConsole(logEntry);

    // 원격 로깅 (프로덕션)
    if (Logger.globalConfig.remoteLogging && level >= LogLevel.WARN) {
      this.logToRemote(logEntry);
    }
  }

  /**
   * 로그 버퍼 관리
   */
  private addToBuffer(entry: LogEntry): void {
    Logger.logBuffer.push(entry);
    if (Logger.logBuffer.length > Logger.MAX_BUFFER_SIZE) {
      Logger.logBuffer.shift();
    }
  }

  /**
   * 콘솔 출력
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = this.getPrefix();
    const timestamp = Logger.globalConfig.enableTimestamp
      ? `[${entry.timestamp.toISOString()}] `
      : '';
    const fullPrefix = `${timestamp}${prefix}[${entry.context}]`;

    const style = this.getLogStyle(entry.level);
    const logMethod = this.getConsoleMethod(entry.level);

    if (Logger.globalConfig.enableColors && typeof window !== 'undefined') {
      logMethod(`%c${fullPrefix} ${entry.message}`, style, entry.data || '');
    } else {
      logMethod(`${fullPrefix} ${entry.message}`, entry.data || '');
    }

    if (entry.error) {
      console.error(entry.error);
    }
  }

  /**
   * 원격 서버로 로그 전송
   */
  private async logToRemote(entry: LogEntry): Promise<void> {
    try {
      // 실제 구현 시 로깅 서비스 엔드포인트로 전송
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...entry,
      //     userAgent: navigator.userAgent,
      //     url: window.location.href,
      //   }),
      // });
    } catch (error) {
      // 로깅 실패는 조용히 처리
    }
  }

  /**
   * 접두사 가져오기
   */
  private getPrefix(): string {
    return Logger.globalConfig.prefix || '';
  }

  /**
   * 로그 레벨별 스타일
   */
  private getLogStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: 'color: #888; font-weight: normal;',
      [LogLevel.INFO]: 'color: #2196F3; font-weight: normal;',
      [LogLevel.WARN]: 'color: #FF9800; font-weight: bold;',
      [LogLevel.ERROR]: 'color: #F44336; font-weight: bold;',
      [LogLevel.NONE]: '',
    };
    return styles[level];
  }

  /**
   * 로그 레벨별 콘솔 메소드
   */
  private getConsoleMethod(level: LogLevel): typeof console.log {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * 로그 버퍼 내보내기 (디버깅용)
   */
  static exportLogs(): LogEntry[] {
    return [...Logger.logBuffer];
  }

  /**
   * 로그 버퍼 초기화
   */
  static clearLogs(): void {
    Logger.logBuffer = [];
  }
}

/**
 * 싱글톤 로거 인스턴스 생성 헬퍼
 */
export const createLogger = (context: string): Logger => {
  return new Logger(context);
};

/**
 * 기본 로거 인스턴스
 */
export const logger = createLogger('App');

/**
 * 개발 환경 전용 로거
 * 프로덕션에서는 아무것도 출력하지 않음
 */
export const devLogger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(...args);
    }
  },
};
