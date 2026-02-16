import type { TokenManager } from "./token-manager.js";
export interface HttpRequestOptions {
    method: string;
    path: string;
    body?: unknown;
    headers?: Record<string, string>;
    requiresAuth?: boolean;
}
export declare class HttpClient {
    private baseUrl;
    private tokenManager;
    private rateLimiter;
    constructor(baseUrl: string, tokenManager: TokenManager);
    request<T>(opts: HttpRequestOptions): Promise<T>;
    get<T>(path: string, requiresAuth?: boolean): Promise<T>;
    post<T>(path: string, body?: unknown, requiresAuth?: boolean): Promise<T>;
    delete<T>(path: string): Promise<T>;
}
//# sourceMappingURL=http-client.d.ts.map