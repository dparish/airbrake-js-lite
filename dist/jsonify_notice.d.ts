import { INotice } from './notice';
export declare function jsonifyNotice(notice: INotice, { maxLength, keysBlocklist, keysAllowlist }?: {
    maxLength?: number | undefined;
    keysBlocklist?: never[] | undefined;
    keysAllowlist?: never[] | undefined;
}): string;
interface ITruncatorOptions {
    level?: number;
    keysBlocklist?: any[];
    keysAllowlist?: any[];
}
export declare function truncate(value: any, opts?: ITruncatorOptions): any;
export {};
