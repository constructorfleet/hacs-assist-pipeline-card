const CARD_TAG = "assist-pipeline-card";
const HACS_CARD_TAG = "hacs-assist-pipeline-card";
const CARD_VERSION = "0.1.2";
const DEFAULT_NAME = "Assist";
const DEFAULT_ICON = "mdi:comment-processing-outline";

type Appearance = "card" | "button" | "chat";
type PipelineId = "last_used" | "preferred" | string;

export interface AssistPipelineCardConfig {
  type?: string;
  name?: string;
  icon?: string;
  pipeline_id?: PipelineId;
  start_listening?: boolean;
  appearance?: Appearance;
  placeholder?: string;
}

interface AssistPipeline {
  id: string;
  name: string;
  stt_engine: string | null;
  tts_engine: string | null;
}

interface IntentOutput {
  conversation_id: string | null;
  continue_conversation: boolean;
  response: {
    response_type: string;
    speech?: {
      plain?: {
        speech?: string;
      };
    } | null;
  };
}

type PipelineRunEvent =
  | {
      type: "intent-progress";
      data: {
        chat_log_delta?: {
          role?: "assistant" | "tool_result";
          content?: string;
          thinking_content?: string;
          tool_call_id?: string;
          tool_result?: unknown;
        };
      };
    }
  | {
      type: "intent-end";
      data: {
        intent_output: IntentOutput;
      };
    }
  | {
      type: "error";
      data: {
        message: string;
      };
    };

interface HomeAssistantLike {
  callWS<T = unknown>(message: Record<string, unknown>): Promise<T>;
  connection: {
    subscribeMessage<T>(
      callback: (message: T) => void,
      message: Record<string, unknown>
    ): Promise<() => void>;
  };
}

interface ChatMessage {
  who: "user" | "hass";
  text: string;
  pending?: boolean;
  error?: boolean;
}

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}

export class AssistPipelineCard extends HTMLElement {
  private _config: Required<Omit<AssistPipelineCardConfig, "type">> = {
    name: DEFAULT_NAME,
    icon: DEFAULT_ICON,
    pipeline_id: "last_used",
    start_listening: false,
    appearance: "chat",
    placeholder: "Ask Assist",
  };

  private _pipeline?: AssistPipeline;
  private _preferredPipeline?: string;
  private _lastUsedPipeline?: string;
  private _loading = false;
  private _processing = false;
  private _conversationId: string | null = null;
  private _messages: ChatMessage[] = [
    {
      who: "hass",
      text: "How can I assist?",
    },
  ];

  public setConfig(config: AssistPipelineCardConfig): void {
    if (
      config.appearance &&
      !["card", "button", "chat"].includes(config.appearance)
    ) {
      throw new Error("appearance must be 'chat', 'card', or 'button'");
    }

    this._config = {
      name: config.name ?? DEFAULT_NAME,
      icon: config.icon ?? DEFAULT_ICON,
      pipeline_id: config.pipeline_id ?? "last_used",
      start_listening: config.start_listening ?? false,
      appearance: config.appearance ?? "chat",
      placeholder: config.placeholder ?? "Ask Assist",
    };
    this._render();
  }

  public set hass(value: HomeAssistantLike | undefined) {
    this._hass = value;
    if (value && this._config.appearance === "chat") {
      void this._loadPipeline();
    }
  }

  public get hass(): HomeAssistantLike | undefined {
    return this._hass;
  }

  private _hass?: HomeAssistantLike;

  public getCardSize(): number {
    return this._config.appearance === "chat" ? 5 : 1;
  }

  public getGridOptions(): {
    rows: number;
    columns: number;
    min_rows: number;
    min_columns: number;
  } {
    return {
      rows: this._config.appearance === "chat" ? 5 : 1,
      columns: this._config.appearance === "chat" ? 6 : 3,
      min_rows: 1,
      min_columns: 3,
    };
  }

  public static getStubConfig(): AssistPipelineCardConfig {
    return {
      name: "Assist",
      pipeline_id: "last_used",
      appearance: "chat",
    };
  }

  private async _loadPipeline(): Promise<void> {
    if (!this.hass || this._loading) {
      return;
    }

    this._loading = true;
    this._render();

    try {
      const list = await this.hass.callWS<{
        pipelines: AssistPipeline[];
        preferred_pipeline: string | null;
      }>({
        type: "assist_pipeline/pipeline/list",
      });
      this._preferredPipeline = list.preferred_pipeline ?? undefined;
      const pipelineId = this._resolvePipelineId(list.pipelines);
      this._pipeline = await this.hass.callWS<AssistPipeline>({
        type: "assist_pipeline/pipeline/get",
        pipeline_id: pipelineId,
      });
      this._lastUsedPipeline = this._pipeline.id;
    } catch (error) {
      this._messages = [
        {
          who: "hass",
          text: `Could not load Assist pipeline: ${errorMessage(error)}`,
          error: true,
        },
      ];
    } finally {
      this._loading = false;
      this._render();
    }
  }

  private _resolvePipelineId(pipelines: AssistPipeline[]): string | undefined {
    if (this._config.pipeline_id === "preferred") {
      return this._preferredPipeline;
    }

    if (this._config.pipeline_id === "last_used") {
      return this._lastUsedPipeline ?? this._preferredPipeline ?? pipelines[0]?.id;
    }

    const configuredPipeline = pipelines.find(
      (pipeline) => pipeline.id === this._config.pipeline_id
    );
    return configuredPipeline?.id ?? this._preferredPipeline ?? pipelines[0]?.id;
  }

  private _render(): void {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    const buttonOnly = this._config.appearance === "button";
    const openOnly = ["button", "card"].includes(this._config.appearance);

    root.innerHTML = `
      <style>
        :host {
          display: block;
        }

        ha-card {
          display: block;
          overflow: hidden;
        }

        .button-content {
          align-items: center;
          display: flex;
          gap: 12px;
          min-height: ${buttonOnly ? "48px" : "72px"};
          padding: ${buttonOnly ? "0" : "16px"};
        }

        .open-button,
        .send-button {
          align-items: center;
          background: var(--primary-color);
          border: 0;
          border-radius: 8px;
          color: var(--text-primary-color);
          cursor: pointer;
          display: inline-flex;
          font: inherit;
          font-weight: 500;
          justify-content: center;
          min-height: 44px;
          min-width: 44px;
          padding: 0 14px;
        }

        .open-button {
          flex: 1;
          gap: 10px;
          min-width: 0;
        }

        button:disabled {
          cursor: wait;
          opacity: 0.6;
        }

        button:focus-visible,
        input:focus-visible {
          outline: 2px solid var(--accent-color);
          outline-offset: 2px;
        }

        ha-icon {
          --mdc-icon-size: 22px;
          flex: 0 0 auto;
        }

        .label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chat {
          display: flex;
          flex-direction: column;
          height: 360px;
          min-height: 220px;
        }

        .header {
          align-items: center;
          border-bottom: 1px solid var(--divider-color);
          display: flex;
          gap: 10px;
          min-height: 48px;
          padding: 0 16px;
        }

        .title {
          flex: 1;
          font-weight: 500;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pipeline {
          color: var(--secondary-text-color);
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .messages {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 8px;
          min-height: 0;
          overflow-y: auto;
          padding: 12px 16px;
        }

        .message {
          border-radius: 12px;
          box-sizing: border-box;
          line-height: 1.35;
          max-width: 88%;
          overflow-wrap: anywhere;
          padding: 8px 10px;
          white-space: pre-wrap;
        }

        .message.user {
          align-self: flex-end;
          background: var(--primary-color);
          border-bottom-right-radius: 2px;
          color: var(--text-primary-color);
        }

        .message.hass {
          align-self: flex-start;
          background: var(--secondary-background-color);
          border-bottom-left-radius: 2px;
          color: var(--primary-text-color);
        }

        .message.error {
          background: var(--error-color);
          color: var(--text-primary-color);
        }

        form {
          align-items: center;
          border-top: 1px solid var(--divider-color);
          display: flex;
          gap: 8px;
          padding: 10px 12px;
        }

        input {
          background: var(--card-background-color);
          border: 1px solid var(--divider-color);
          border-radius: 8px;
          box-sizing: border-box;
          color: var(--primary-text-color);
          flex: 1;
          font: inherit;
          min-height: 44px;
          min-width: 0;
          padding: 0 12px;
        }
      </style>
      ${
        openOnly
          ? buttonOnly
            ? this._buttonTemplate()
            : `<ha-card>${this._buttonTemplate()}</ha-card>`
          : this._chatTemplate()
      }
    `;

    root.querySelector(".open-button")?.addEventListener("click", () => {
      this._openAssistDialog();
    });

    root.querySelector("form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = root.querySelector("input");
      const text = input?.value.trim();
      if (!text) {
        return;
      }
      input!.value = "";
      void this._sendMessage(text);
    });

    const messages = root.querySelector(".messages");
    if (messages) {
      messages.scrollTop = messages.scrollHeight;
    }
  }

  private _buttonTemplate(): string {
    return `
      <div class="button-content">
        <button class="open-button" type="button" aria-label="${escapeHtml(
          this._config.name
        )}">
          <ha-icon icon="${escapeHtml(this._config.icon)}"></ha-icon>
          <span class="label">${escapeHtml(this._config.name)}</span>
        </button>
      </div>
    `;
  }

  private _chatTemplate(): string {
    return `
      <ha-card>
        <div class="chat">
          <div class="header">
            <ha-icon icon="${escapeHtml(this._config.icon)}"></ha-icon>
            <div class="title">${escapeHtml(this._config.name)}</div>
            <div class="pipeline">${escapeHtml(
              this._loading ? "Loading..." : this._pipeline?.name ?? "No pipeline"
            )}</div>
          </div>
          <div class="messages">
            ${this._messages
              .map(
                (message) => `
                  <div class="message ${message.who}${message.error ? " error" : ""}">
                    ${escapeHtml(message.text)}
                  </div>
                `
              )
              .join("")}
          </div>
          <form>
            <input
              type="text"
              autocomplete="off"
              placeholder="${escapeHtml(this._config.placeholder)}"
              ${this._processing || this._loading || !this._pipeline ? "disabled" : ""}
            />
            <button
              class="send-button"
              type="submit"
              aria-label="Send"
              ${this._processing || this._loading || !this._pipeline ? "disabled" : ""}
            >
              Send
            </button>
          </form>
        </div>
      </ha-card>
    `;
  }

  private async _sendMessage(text: string): Promise<void> {
    if (!this.hass || this._processing) {
      return;
    }

    if (!this._pipeline) {
      await this._loadPipeline();
    }

    if (!this._pipeline) {
      return;
    }

    this._processing = true;
    const reply: ChatMessage = { who: "hass", text: "...", pending: true };
    this._messages = [...this._messages, { who: "user", text }, reply];
    this._render();

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = await this.hass.connection.subscribeMessage<PipelineRunEvent>(
        (event) => {
          this._processPipelineEvent(event, reply, () => {
            unsubscribe?.();
          });
        },
        {
          type: "assist_pipeline/run",
          start_stage: "intent",
          end_stage: "intent",
          input: { text },
          pipeline: this._pipeline.id,
          conversation_id: this._conversationId,
        }
      );
    } catch (error) {
      reply.text = `Error starting Assist: ${errorMessage(error)}`;
      reply.error = true;
      reply.pending = false;
      this._processing = false;
      this._render();
    }
  }

  private _processPipelineEvent(
    event: PipelineRunEvent,
    reply: ChatMessage,
    unsubscribe: () => void
  ): void {
    if (event.type === "intent-progress") {
      const delta = event.data.chat_log_delta;
      if (delta?.role === "assistant" && delta.content) {
        reply.text = reply.pending ? delta.content : `${reply.text}${delta.content}`;
        reply.pending = false;
        this._render();
      }
      return;
    }

    if (event.type === "intent-end") {
      const output = event.data.intent_output;
      this._conversationId = output.conversation_id;
      const speech = output.response.speech?.plain?.speech;
      if (speech) {
        reply.text = speech;
      } else if (reply.pending) {
        reply.text = "";
      }
      reply.error = output.response.response_type === "error";
      reply.pending = false;
      this._processing = false;
      unsubscribe();
      this._render();
      return;
    }

    if (event.type === "error") {
      reply.text = event.data.message;
      reply.error = true;
      reply.pending = false;
      this._processing = false;
      unsubscribe();
      this._render();
    }
  }

  private _openAssistDialog(): void {
    const event = new Event("hass-action", {
      bubbles: true,
      composed: true,
    }) as Event & {
      detail?: {
        config: Record<string, unknown>;
        action: "tap";
      };
    };

    event.detail = {
      config: {
        tap_action: {
          action: "assist",
          pipeline_id: this._config.pipeline_id,
          start_listening: this._config.start_listening,
        },
      },
      action: "tap",
    };

    this.dispatchEvent(event);
  }
}

class HacsAssistPipelineCard extends AssistPipelineCard {}

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "unknown error";
};

if (!customElements.get(CARD_TAG)) {
  customElements.define(CARD_TAG, AssistPipelineCard);
}

if (!customElements.get(HACS_CARD_TAG)) {
  customElements.define(HACS_CARD_TAG, HacsAssistPipelineCard);
}

window.customCards = window.customCards ?? [];
window.customCards.push(
  {
    type: `custom:${CARD_TAG}`,
    name: "Assist Pipeline Card",
    description: "Chat with Home Assistant Assist from a dashboard card.",
  },
  {
    type: `custom:${HACS_CARD_TAG}`,
    name: "Assist Pipeline Card",
    description: "Alias for Assist Pipeline Card.",
  }
);

console.info(
  `%cAssist Pipeline Card v${CARD_VERSION} loaded`,
  "color: #03a9f4; font-weight: 700;",
  {
    elements: [`custom:${CARD_TAG}`, `custom:${HACS_CARD_TAG}`],
  }
);
