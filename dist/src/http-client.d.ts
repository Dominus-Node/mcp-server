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
    private mcpAgentSecret;
    constructor(baseUrl: string, tokenManager: TokenManager, mcpAgentSecret?: string);
    request<T>(opts: HttpRequestOptions): Promise<T>;
    /** Store tokens from an external auth flow (e.g., registration in bootstrap mode) */
    storeTokens(accessToken: string, refreshToken: string): void;
    get<T>(path: string, requiresAuth?: boolean): Promise<T>;
    post<T>(path: string, body?: unknown, requiresAuth?: boolean): Promise<T>;
    patch<T>(path: string, body?: unknown): Promise<T>;
    delete<T>(path: string): Promise<T>;
}
//# sourceMappingURL=http-client.d.ts.map