import { BaseNotifier } from './base_notifier';
import { windowFilter } from './filter/window';
import { instrumentConsole } from './instrumentation/console';
import { instrumentDOM } from './instrumentation/dom';
import { instrumentFetch } from './instrumentation/fetch';
import { instrumentLocation } from './instrumentation/location';
import { instrumentXHR } from './instrumentation/xhr';
import { instrumentUnhandledrejection } from './instrumentation/unhandledrejection';
import { INotice } from './notice';
import { IInstrumentationOptions, IOptions } from './options';

interface ITodo {
  err: any;
  resolve: (notice: INotice) => void;
  reject: (err: Error) => void;
}

export class Notifier extends BaseNotifier {
  protected offline = false;
  protected todo: ITodo[] = [];

  _ignoreWindowError = 0;
  _ignoreNextXHR = 0;

  constructor(opt: IOptions) {
    super(opt);

    if (typeof window === 'undefined') {
      return;
    }

    this.addFilter(windowFilter);

    if (window.addEventListener) {
      this.onOnline = this.onOnline.bind(this);
      window.addEventListener('online', this.onOnline);
      this.onOffline = this.onOffline.bind(this);
      window.addEventListener('offline', this.onOffline);

      this._onClose.push(() => {
        window.removeEventListener('online', this.onOnline);
        window.removeEventListener('offline', this.onOffline);
      });
    }

    this._instrument(opt.instrumentation);
  }

  _instrument(opt: IInstrumentationOptions = {}) {
    if (opt.console === undefined) {
      opt.console = !isDevEnv(this._opt.environment);
    }

    if (enabled(opt.onerror)) {
      // tslint:disable-next-line:no-this-assignment
      let self = this;
      let oldHandler = window.onerror;
      window.onerror = function abOnerror() {
        if (oldHandler) {
          // @ts-ignore
          oldHandler.apply(this, arguments);
        }
        // @ts-ignore
        self.onerror.apply(self, arguments);
      };
    }

    instrumentDOM(this);
    if (enabled(opt.fetch) && typeof fetch === 'function') {
      instrumentFetch(this);
    }
    if (enabled(opt.history) && typeof history === 'object') {
      instrumentLocation(this);
    }
    if (enabled(opt.console) && typeof console === 'object') {
      instrumentConsole(this);
    }
    if (enabled(opt.xhr) && typeof XMLHttpRequest !== 'undefined') {
      instrumentXHR(this);
    }
    if (
      enabled(opt.unhandledrejection) &&
      typeof addEventListener === 'function'
    ) {
      instrumentUnhandledrejection(this);
    }
  }

  public notify(err: any): Promise<INotice> {
    if (this.offline) {
      return new Promise((resolve, reject) => {
        this.todo.push({
          err,
          resolve,
          reject,
        });
        while (this.todo.length > 100) {
          let j = this.todo.shift();
          if (j === undefined) {
            break;
          }
          j.resolve({
            error: new Error('airbrake: offline queue is too large'),
          });
        }
      });
    }

    return super.notify(err);
  }

  protected onOnline(): void {
    this.offline = false;

    for (let j of this.todo) {
      this.notify(j.err).then((notice) => {
        j.resolve(notice);
      });
    }
    this.todo = [];
  }

  protected onOffline(): void {
    this.offline = true;
  }

  onerror(
    message: string,
    filename?: string,
    line?: number,
    column?: number,
    err?: Error
  ): void {
    if (this._ignoreWindowError > 0) {
      return;
    }

    if (err) {
      this.notify({
        error: err,
        context: {
          windowError: true,
        },
      });
      return;
    }

    // Ignore errors without file or line.
    if (!filename || !line) {
      return;
    }

    this.notify({
      error: {
        message,
        fileName: filename,
        lineNumber: line,
        columnNumber: column,
        noStack: true,
      },
      context: {
        windowError: true,
      },
    });
  }

  _ignoreNextWindowError(): void {
    this._ignoreWindowError++;
    setTimeout(() => this._ignoreWindowError--);
  }
}

function isDevEnv(env: any): boolean {
  return env && env.startsWith && env.startsWith('dev');
}

function enabled(v: undefined | boolean): boolean {
  return v === undefined || v === true;
}
