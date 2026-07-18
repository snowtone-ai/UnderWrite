import type { FindingV1 } from "@/lib/domain";
import { getAiProvider } from "@/lib/env";

export interface AIProvider {
  analyzeImages(imageBase64List: string[], instructions: string): Promise<FindingV1[]>;
  generateText(prompt: string): Promise<string>;
  readonly modelId: string;
}

export async function getAIProvider(): Promise<AIProvider> {
  const provider = getAiProvider();
  if (provider === "gemini") {
    const { GeminiProvider } = await import("./providers/gemini");
    return new GeminiProvider();
  }
  throw new Error(`AI provider "${provider}" not yet implemented. Add a case here.`);
}
