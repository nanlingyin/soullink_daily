export type PersonaInput = {
  name: string;
  standingImageUrl?: string | null;
  personaText: string;
  speakingStyle?: string | null;
  personalityTags?: string | null;
  worldSetting?: string | null;
  relationshipSetting?: string | null;
  visualPrompt?: string | null;
  negativePrompt?: string | null;
  schedulePreference?: string | null;
};

export type CompiledPersona = {
  botName: string;
  text: string;
  visualPrompt: string;
  negativePrompt: string;
  speakingStyle: string;
};

export type GeneratedScheduleItem = {
  time: string;
  title: string;
  scene: string;
  mood: string;
  post_style?: string;
  image_prompt_hint?: string;
};

export type GeneratedPostContent = {
  caption: string;
  image_prompt: string;
  emotion: string;
  comment_reply_style: string;
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};
