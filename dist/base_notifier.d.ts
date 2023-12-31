import { IFuncWrapper } from './func_wrapper';
import { INotice } from './notice';
import { Scope } from './scope';
import { Processor } from './processor/processor';
import { Filter } from './filter/filter';
import { Requester } from './http_req';
import { IOptions } from './options';
import { QueriesStats } from './queries';
import { QueueMetric, QueuesStats } from './queues';
import { RouteMetric, RoutesBreakdowns, RoutesStats } from './routes';
import { PerformanceFilter } from './filter/performance_filter';
export declare class BaseNotifier {
    routes: Routes;
    queues: Queues;
    queries: QueriesStats;
    _opt: IOptions;
    _url: string;
    _processor: Processor;
    _requester: Requester;
    _filters: Filter[];
    _performanceFilters: PerformanceFilter[];
    _scope: Scope;
    _onClose: (() => void)[];
    constructor(opt: IOptions);
    close(): void;
    scope(): Scope;
    setActiveScope(scope: Scope): void;
    addFilter(filter: Filter): void;
    addPerformanceFilter(performanceFilter: PerformanceFilter): void;
    notify(err: any): Promise<INotice>;
    private handleFalseyError;
    private newNotice;
    _sendNotice(notice: INotice): Promise<INotice>;
    wrap(fn: any, props?: string[]): IFuncWrapper;
    _wrapArguments(args: any[]): any[];
    _ignoreNextWindowError(): void;
    call(fn: any, ..._args: any[]): any;
}
declare class Routes {
    _notifier: BaseNotifier;
    _routes: RoutesStats;
    _breakdowns: RoutesBreakdowns;
    _opt: IOptions;
    constructor(notifier: BaseNotifier);
    start(method?: string, route?: string, statusCode?: number, contentType?: string): RouteMetric;
    notify(req: RouteMetric): void;
}
declare class Queues {
    _notifier: BaseNotifier;
    _queues: QueuesStats;
    _opt: IOptions;
    constructor(notifier: BaseNotifier);
    start(queue: string): QueueMetric;
    notify(q: QueueMetric): void;
}
export {};
