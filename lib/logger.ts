import pino from "pino";
import { after } from "next/server";

const isDev = process.env.NODE_ENV !== "production";
const ENV_NAME = process.env.NODE_ENV ?? "development";
const ENV_LABEL = `${ENV_NAME === "production" ? "🟢" : "🧪"} ${ENV_NAME.toUpperCase()}`;

const pinoLogger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  base: { env: ENV_NAME },
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:mm:ss.l",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});

type Level = "info" | "warn" | "error";

const TOPIC_ENV: Record<Level, string | undefined> = {
  info: process.env.TELEGRAM_TOPIC_INFO_ID,
  warn: process.env.TELEGRAM_TOPIC_WARN_ID,
  error: process.env.TELEGRAM_TOPIC_ERROR_ID,
};

const LEVEL_ICON: Record<Level, string> = {
  info: "ℹ️",
  warn: "⚠️",
  error: "🔴",
};

const TELEGRAM_MESSAGE_LIMIT = 3500;

function toMeta(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined) return undefined;
  if (value instanceof Error) return { err: value };
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }
  return { meta: value };
}

// pino's default JSON.stringify drops Error message/stack (non-enumerable),
// so errors are unwrapped explicitly here instead of relying on the replacer alone.
function safeStringify(meta: Record<string, unknown>): string {
  const seen = new Set<unknown>();
  try {
    return JSON.stringify(
      meta,
      (_key, value) => {
        if (value instanceof Error) {
          return { message: value.message, stack: value.stack };
        }
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) return "[Circular]";
          seen.add(value);
        }
        return value;
      },
      2,
    );
  } catch {
    return String(meta);
  }
}

function formatTelegramMessage(
  level: Level,
  tag: string,
  message: string,
  meta?: Record<string, unknown>,
): string {
  const lines = [ENV_LABEL, `${LEVEL_ICON[level]} ${tag}`, message];
  if (meta && Object.keys(meta).length > 0) {
    lines.push(safeStringify(meta));
  }
  lines.push(new Date().toISOString());

  const text = lines.join("\n");
  return text.length > TELEGRAM_MESSAGE_LIMIT
    ? `${text.slice(0, TELEGRAM_MESSAGE_LIMIT)}\n… (truncated)`
    : text;
}

async function sendTelegramAlert(
  level: Level,
  tag: string,
  message: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;
  if (!token || !chatId) return;

  const topicId = TOPIC_ENV[level];
  const text = formatTelegramMessage(level, tag, message, meta);

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      ...(topicId ? { message_thread_id: Number(topicId) } : {}),
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram sendMessage failed: ${res.status} ${body}`);
  }
}

function dispatchAlert(
  level: Level,
  tag: string,
  message: string,
  meta?: Record<string, unknown>,
) {
  const send = () =>
    sendTelegramAlert(level, tag, message, meta).catch((err) => {
      // Log via the raw pino instance, not `logger` — never re-trigger an
      // alert about a failed alert.
      pinoLogger.error({ err }, "[logger] failed to deliver Telegram alert");
    });

  try {
    // Guarantees delivery even after the response is sent (works on both
    // serverless and self-hosted — see next/dist/docs/.../after.md).
    after(send);
  } catch {
    // Called outside a request scope (e.g. a script/cron) — best effort.
    void send();
  }
}

function log(level: Level, tag: string, message: string, meta?: unknown) {
  const metaObj = toMeta(meta);
  pinoLogger[level]({ tag, ...metaObj }, message);
  dispatchAlert(level, tag, message, metaObj);
}

export const logger = {
  info: (tag: string, message: string, meta?: unknown) =>
    log("info", tag, message, meta),
  warn: (tag: string, message: string, meta?: unknown) =>
    log("warn", tag, message, meta),
  error: (tag: string, message: string, meta?: unknown) =>
    log("error", tag, message, meta),
};
