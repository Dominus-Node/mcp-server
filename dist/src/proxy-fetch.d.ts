import type { McpConfig } from "./config.js";
export interface ProxyFetchOptions {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    country?: string;
    state?: string;
    city?: string;
    timeoutMs?: number;
}
export interface ProxyFetchResult {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    bodyTruncated: boolean;
    byteCount: number;
}
export declare function validateUrl(url: string): URL;
export declare function proxyFetch(config: McpConfig, opts: ProxyFetchOptions): Promise<ProxyFetchResult>;
//# sourceMappingURL=proxy-fetch.d.ts.map