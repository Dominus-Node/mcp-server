export function registerSessionsTools(server, httpClient) {
    server.tool("dominusnode_get_active_sessions", "Get all active proxy sessions. Sessions are created automatically per dominusnode_fetch call and settled on completion — no manual start/end needed.", {}, async () => {
        try {
            const data = await httpClient.get("/api/sessions/active");
            const sessions = data.sessions ?? [];
            if (sessions.length === 0) {
                return { content: [{ type: "text", text: "No active proxy sessions.\n\nNote: Sessions are managed automatically. Each dominusnode_fetch call creates and settles a session. For sticky sessions (same exit IP), use the same session parameter in the proxy username format." }] };
            }
            const lines = sessions.map((s) => `${s.id} | Status: ${s.status} | Since: ${s.startedAt}`);
            lines.unshift(`Active Sessions (${sessions.length}):`);
            return { content: [{ type: "text", text: lines.join("\n") }] };
        }
        catch (err) {
            return {
                isError: true,
                content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
            };
        }
    });
}
//# sourceMappingURL=sessions.js.map