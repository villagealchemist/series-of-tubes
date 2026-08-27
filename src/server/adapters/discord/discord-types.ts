export interface DiscordAllowedMentions {
  readonly parse: readonly string[];
}

export interface DiscordInteractionResponseData {
  readonly content?: string;
  readonly flags?: number;
  readonly allowed_mentions?: DiscordAllowedMentions;
}

export interface DiscordInteractionResponse {
  readonly type: number;
  readonly data?: DiscordInteractionResponseData;
}

export interface DiscordInteractionPlan {
  readonly response: DiscordInteractionResponse;
  readonly afterResponse?: () => Promise<void>;
}

export interface DiscordMessage {
  readonly id: string;
  readonly content: string;
  readonly timestamp: string;
  readonly authorLabel: string;
  readonly attachmentNames: readonly string[];
}
