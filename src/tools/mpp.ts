import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { HttpClient } from "../http-client.js";

const MPP_TOPUP_MAX = 5;
const MPP_TOPUP_WINDOW_MS = 3_600_000;
const mppTopupTimestamps: number[] = [];

function checkMppTopupLimit(): boolean {
  const now = Date.now();
  while (mppTopupTimestamps.length > 0 && now - mppTopupTimestamps[0] > MPP_TOPUP_WINDOW_MS) {
    mppTopupTimestamps.shift();
  }
  if (mppTopupTimestamps.length > 100) mppTopupTimestamps.length = 100;
  if (mppTopupTimestamps.length >= MPP_TOPUP_MAX) return false;
  mppTopupTimestamps.push(now);
  return true;
}

const MPP_SESSION_MAX = 10;
const MPP_SESSION_WINDOW_MS = 3_600_000;
const mppSessionTimestamps: number[] = [];

function checkMppSessionLimit(): boolean {
  const now = Date.now();
  while (mppSessionTimestamps.length > 0 && now - mppSessionTimestamps[0] > MPP_SESSION_WINDOW_MS) {
    mppSessionTimestamps.shift();
  }
  if (mppSessionTimestamps.length > 100) mppSessionTimestamps.length = 100;
  if (mppSessionTimestamps.length >= MPP_SESSION_MAX) return false;
  mppSessionTimestamps.push(now);
  return true;
}

function scrubCredentials(msg: string): string {
  return msg.replace(/dn_(?:live|test|proxy)_[A-Za-z0-9_.-]+/g, "[REDACTED]");
}

export function registerMppTools(server: McpServer, httpClient: HttpClient): void {
  // ── dominusnode_mpp_info ──────────────────────────────────────────
  server.tool(
    "dominusnode_mpp_info",
    "Get MPP (Micropayment Protocol) info including supported methods, fee structure, and session limits. Use this to understand available MPP payment channels before opening a session.",
    {},
    async () => {
      try {
        const data = await httpClient.get<{
          protocol: string;
          version: string;
          methods: string[];
          minDepositCents: number;
          maxDepositCents: number;
          feePercent: number;
        }>("/api/mpp/info");

        const text = [
          `MPP Protocol Info`,
          ``,
          `Protocol: ${data.protocol}`,
          `Version: ${data.version}`,
          `Methods: ${Array.isArray(data.methods) ? data.methods.join(", ") : String(data.methods)}`,
          `Min Deposit: $${(data.minDepositCents / 100).toFixed(2)}`,
          `Max Deposit: $${(data.maxDepositCents / 100).toFixed(2)}`,
          `Fee: ${data.feePercent}%`,
        ].join("\n");

        return { content: [{ type: "text", text }] };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: `MPP info error: ${scrubCredentials(err instanceof Error ? err.message : String(err))}` }],
        };
      }
    },
  );

  // ── dominusnode_mpp_challenge ─────────────────────────────────────
  server.tool(
    "dominusnode_mpp_challenge",
    "Get an MPP payment challenge for keyless proxy access. Agents without an API key can request a challenge, pay it via the specified method, and use the resulting credential to access the proxy without needing to register or hold an API key. Choose dc (datacenter $3/GB) or residential ($5/GB).",
    {
      pool_type: z.enum(["dc", "residential"]).describe("Proxy pool type (dc = datacenter $3/GB, residential = $5/GB)"),
    },
    async (args) => {
      try {
        const data = await httpClient.post<{
          challengeId: string;
          methods: string[];
          amount: number;
          currency: string;
          expiresAt: string;
        }>(
          "/api/mpp/challenge",
          { poolType: args.pool_type },
          false,
        );

        const text = [
          `MPP Payment Challenge`,
          ``,
          `Challenge ID: ${data.challengeId}`,
          `Methods: ${Array.isArray(data.methods) ? data.methods.join(", ") : String(data.methods)}`,
          `Amount: ${data.amount} ${data.currency}`,
          `Expires At: ${data.expiresAt}`,
          ``,
          `Pay this challenge to receive a proxy credential.`,
          `No API key or account registration required.`,
        ].join("\n");

        return { content: [{ type: "text", text }] };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: `MPP challenge error: ${scrubCredentials(err instanceof Error ? err.message : String(err))}` }],
        };
      }
    },
  );

  // ── dominusnode_pay_mpp ───────────────────────────────────────────
  server.tool(
    "dominusnode_pay_mpp",
    "Top up your Dominus Node wallet via the MPP (Micropayment Protocol). Creates an MPP payment channel for the specified amount. After the channel is funded, your wallet is credited automatically.",
    {
      amount_cents: z.number().int().min(500).max(100000).describe("Amount in cents to add to wallet (min 500 = $5.00, max 100000 = $1,000.00)"),
    },
    async (args) => {
      try {
        if (!checkMppTopupLimit()) {
          return {
            isError: true,
            content: [{ type: "text", text: "Rate limit exceeded: maximum 5 MPP top-up requests per hour. Please wait before creating another." }],
          };
        }
        const data = await httpClient.post<{
          channelId: string;
          amountCents: number;
          status: string;
        }>(
          "/api/mpp/topup",
          { amountCents: args.amount_cents },
        );

        const text = [
          `MPP Top-Up Created`,
          ``,
          `Channel ID: ${data.channelId}`,
          `Amount: $${(data.amountCents / 100).toFixed(2)}`,
          `Status: ${data.status}`,
          ``,
          `Your wallet will be credited once the payment channel is funded.`,
        ].join("\n");

        return { content: [{ type: "text", text }] };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: `MPP payment error: ${scrubCredentials(err instanceof Error ? err.message : String(err))}` }],
        };
      }
    },
  );

  // ── dominusnode_mpp_session_open ──────────────────────────────────
  server.tool(
    "dominusnode_mpp_session_open",
    "Open a pay-as-you-go MPP session. Deposits are held in escrow and released as bandwidth is consumed. Choose a payment method (tempo, stripe_spt, or lightning) and pool type (dc at $3/GB or residential at $5/GB).",
    {
      max_deposit_cents: z.number().int().min(100).max(1000000).describe("Maximum deposit in cents for the session escrow"),
      method: z.enum(["tempo", "stripe_spt", "lightning"]).describe("Payment method for the session (tempo, stripe_spt, or lightning)"),
      pool_type: z.enum(["dc", "residential"]).describe("Proxy pool type (dc = datacenter $3/GB, residential = $5/GB)"),
    },
    async (args) => {
      try {
        if (!checkMppSessionLimit()) {
          return {
            isError: true,
            content: [{ type: "text", text: "Rate limit exceeded: maximum 10 MPP session opens per hour. Please wait before opening another." }],
          };
        }
        const data = await httpClient.post<{
          channelId: string;
          maxDepositCents: number;
          method: string;
          poolType: string;
          status: string;
        }>(
          "/api/mpp/session/open",
          {
            maxDepositCents: args.max_deposit_cents,
            method: args.method,
            poolType: args.pool_type,
          },
        );

        const text = [
          `MPP Session Opened`,
          ``,
          `Channel ID: ${data.channelId}`,
          `Max Deposit: $${(data.maxDepositCents / 100).toFixed(2)}`,
          `Method: ${data.method}`,
          `Pool: ${data.poolType}`,
          `Status: ${data.status}`,
          ``,
          `Session is active. Bandwidth will be metered and billed from the escrow deposit.`,
          `Use dominusnode_mpp_session_close with the channel ID to settle and close.`,
        ].join("\n");

        return { content: [{ type: "text", text }] };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: `MPP session open error: ${scrubCredentials(err instanceof Error ? err.message : String(err))}` }],
        };
      }
    },
  );

  // ── dominusnode_mpp_session_close ─────────────────────────────────
  server.tool(
    "dominusnode_mpp_session_close",
    "Close an active MPP pay-as-you-go session. Settles the payment channel, returns any unused escrow deposit to your wallet, and finalizes bandwidth billing.",
    {
      channel_id: z.string().min(1).max(200).describe("Channel ID of the MPP session to close"),
    },
    async (args) => {
      try {
        const data = await httpClient.post<{
          channelId: string;
          usedCents: number;
          refundedCents: number;
          status: string;
        }>(
          "/api/mpp/session/close",
          { channelId: args.channel_id },
        );

        const text = [
          `MPP Session Closed`,
          ``,
          `Channel ID: ${data.channelId}`,
          `Used: $${(data.usedCents / 100).toFixed(2)}`,
          `Refunded: $${(data.refundedCents / 100).toFixed(2)}`,
          `Status: ${data.status}`,
        ].join("\n");

        return { content: [{ type: "text", text }] };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: `MPP session close error: ${scrubCredentials(err instanceof Error ? err.message : String(err))}` }],
        };
      }
    },
  );
}
