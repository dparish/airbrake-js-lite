export interface IHttpRequest {
    method: string;
    url: string;
    body?: string;
    timeout?: number;
    headers?: any;
}
export interface IHttpResponse {
    json: any;
}
export type Requester = (req: IHttpRequest) => Promise<IHttpResponse>;
export declare let errors: {
    unauthorized: Error;
    ipRateLimited: Error;
};
