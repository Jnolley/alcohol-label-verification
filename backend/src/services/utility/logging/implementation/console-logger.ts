import { ILogger } from '../interface/logger.interface';
import config from '../../../../config';

export class ConsoleLogger implements ILogger {
  private readonly logLevels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private shouldLog(level: string): boolean {
    if (!config.logging.enabled) {
      return false;
    }

    const currentLevel = this.logLevels[config.logging.level as keyof typeof this.logLevels] || 1;
    const messageLevel = this.logLevels[level.toLowerCase() as keyof typeof this.logLevels] || 1;

    return messageLevel >= currentLevel;
  }

  private formatLog(level: string, message: string, meta?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const logObject: any = {
      timestamp,
      level,
      message,
    };

    if (meta && Object.keys(meta).length > 0) {
      logObject.meta = meta;
    }

    return JSON.stringify(logObject, null, 2);
  }

  info(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('info')) {
      console.log(this.formatLog('INFO', message, meta));
    }
  }

  warn(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatLog('WARN', message, meta));
    }
  }

  error(message: string, error?: Error, meta?: Record<string, any>): void {
    if (this.shouldLog('error')) {
      const errorMeta = {
        ...meta,
        error: error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : undefined,
      };
      console.error(this.formatLog('ERROR', message, errorMeta));
    }
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatLog('DEBUG', message, meta));
    }
  }
}