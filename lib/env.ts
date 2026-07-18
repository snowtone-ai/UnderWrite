// Central, typed access to environment variables.
// The single place that reads process.env for cross-cutting config.

export type AiProvider = "gemini" | "claude" | "openai";

const AI_PROVIDERS: readonly AiProvider[] = ["gemini", "claude", "openai"];

/** Returns the selected AI provider, defaulting to "gemini". Throws on unknown values. */
export function getAiProvider(): AiProvider {
  const value = process.env.AI_PROVIDER ?? "gemini";
  if ((AI_PROVIDERS as readonly string[]).includes(value)) {
    return value as AiProvider;
  }
  throw new Error(
    `Unsupported AI_PROVIDER: "${value}". Expected one of: ${AI_PROVIDERS.join(", ")}.`,
  );
}

/** Reads a required env var, throwing a clear error if missing. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
