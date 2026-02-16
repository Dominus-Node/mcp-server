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
    forceRefresh(): Promise<string>;
    clear(): void;
}
//# sourceMappingURL=token-manager.d.ts.map