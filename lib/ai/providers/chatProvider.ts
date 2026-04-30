import type { ChatMessage } from "@/lib/ai/types";

type ChatOptions = {
  temperature?: number;
  responseFormat?: "json_object";
};

export async function callChatModel(messages: ChatMessage[], options: ChatOptions = {}) {
  const mockMode = process.env.AI_MOCK_MODE !== "false";
  const apiKey = process.env.CHAT_API_KEY;

  if (mockMode || !apiKey) {
    return null;
  }

  const baseUrl = (process.env.CHAT_API_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.CHAT_MODEL || "gpt-4o-mini";

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.8,
        ...(options.responseFormat ? { response_format: { type: options.responseFormat } } : {})
      })
    });

    if (!response.ok) {
      console.warn("Chat model request failed", await response.text());
      return null;
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content as string | null;
  } catch (error) {
    console.warn("Chat model request error", error);
    return null;
  }
}
