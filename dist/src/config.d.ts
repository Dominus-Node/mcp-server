export interface McpConfig {
    apiKey: string | null;
    apiUrl: string;
    proxyHost: string;
    httpProxyPort: number;
    socks5ProxyPort: number;
    fetchTimeoutMs: number;
    fetchMaxResponseBytes: number;
    mcpAgentSecret: string;
}
export declare class ConfigError extends Error {
    constructor(message: string);
}
export declare function parseConfig(env?: Record<string, string | undefined>): McpConfig;
//# sourceMappingURL=config.d.ts.map