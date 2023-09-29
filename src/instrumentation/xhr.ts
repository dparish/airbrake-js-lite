import { Notifier } from '../notifier';

interface IXMLHttpRequestWithState extends XMLHttpRequest {
  __state: any;
}

export function instrumentXHR(notifier: Notifier): void {
  function recordReq(req: IXMLHttpRequestWithState): void {
    const state = req.__state;
    state.statusCode = req.status;
    state.duration = new Date().getTime() - state.date.getTime();
    notifier.scope().pushHistory(state);
  }

  const oldOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function abOpen(
    method: string,
    url: string,
    _async?: boolean,
    _user?: string,
    _password?: string
  ): void {
    if (notifier._ignoreNextXHR === 0) {
      // @ts-ignore
      this.__state = {
        type: 'xhr',
        method,
        url,
      };
    }
    // @ts-ignore
    oldOpen.apply(this, arguments);
  };

  const oldSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function abSend(_data?: any): void {
    let oldFn = this.onreadystatechange;
    this.onreadystatechange = function (_ev: Event): any {
      // @ts-ignore
      if (this.readyState === 4 && this.__state) {
        // @ts-ignore
        recordReq(this);
      }
      if (oldFn) {
        // @ts-ignore
        return oldFn.apply(this, arguments);
      }
    };

    // @ts-ignore
    if (this.__state) {
      (this as IXMLHttpRequestWithState).__state.date = new Date();
    }
    // @ts-ignore
    return oldSend.apply(this, arguments);
  };
}
