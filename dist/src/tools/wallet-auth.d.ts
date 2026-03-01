import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HttpClient } from "../http-client.js";
/** @internal Exported for testing only — clears rate limit state */
export declare function _resetWalletAuthLimits(): void;
export declare function registerWalletAuthTools(server: McpServer, httpClient: HttpClient): void;
//# sourceMappingURL=wallet-auth.d.ts.map