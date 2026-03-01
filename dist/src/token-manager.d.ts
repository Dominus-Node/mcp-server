export declare class TokenManager {
    private accessToken;
    private refreshTokenValue;
    private refreshPromise;
    private apiUrl;
    private apiKey;
    constructor(apiUrl: string);
    initialize(apiKey: string): Promise<void>;
    isExpired(token: string): boolean;
    getValidToken(): Promise<string>;
    private lastRefreshAttempt;
    private static readonly MIN_REFRESH_INTERVAL_MS;
    forceRefresh(): Promise<string>;
    /** Store tokens from external auth flow (e.g., registration, wallet auth in bootstrap mode) */
    setTokens(accessToken: string, refreshToken: string): void;
    clear(): void;
}
//# sourceMappingURL=token-manager.d.ts.map