import { Requester } from './http_req';
import { IOptions } from './options';
interface IRemoteConfig {
    project_id: number | null;
    updated_at: number;
    poll_sec: number;
    config_route: string;
    settings: IRemoteConfigSetting[];
}
interface IRemoteConfigSetting {
    name: string;
    enabled: boolean;
    endpoint: string;
}
type Entries<T> = {
    [K in keyof T]: [K, T[K]];
}[keyof T][];
export declare class RemoteSettings {
    _opt: IOptions;
    _requester: Requester;
    _data: SettingsData;
    _origErrorNotifications: boolean | undefined;
    _origPerformanceStats: boolean | undefined;
    constructor(opt: IOptions);
    poll(): any;
    _doRequest(): void;
    _requestParams(opt: IOptions): any;
    _pollUrl(opt: IOptions): string;
    _processErrorNotifications(data: SettingsData): void;
    _processPerformanceStats(data: SettingsData): void;
    _entries<T>(obj: T): Entries<T>;
}
export declare class SettingsData {
    _projectId: number;
    _data: IRemoteConfig;
    constructor(projectId: number, data: IRemoteConfig);
    merge(other: IRemoteConfig): void;
    configRoute(remoteConfigHost: string): string;
    errorNotifications(): boolean;
    performanceStats(): boolean;
    errorHost(): string | null;
    apmHost(): string | null;
    _findSetting(name: string): IRemoteConfigSetting | null;
}
export {};
