import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AssistPipelineCard,
  type AssistPipelineCardConfig,
} from "../src/assist-pipeline-card";

interface TestHass {
  callWS<T = unknown>(message: Record<string, unknown>): Promise<T>;
  connection: {
    subscribeMessage<T>(
      callback: (message: T) => void,
      message: Record<string, unknown>
    ): Promise<() => void>;
  };
}

const pipelines = [
  {
    id: "preferred-pipeline",
    name: "Preferred",
    stt_engine: null,
    tts_engine: null,
  },
  {
    id: "other-pipeline",
    name: "Other",
    stt_engine: null,
    tts_engine: null,
  },
];

const createHass = () => {
  let pipelineCallback:
    | ((message: {
        type: string;
        data: Record<string, unknown>;
      }) => void)
    | undefined;
  const unsubscribe = vi.fn();
  const callWS = vi.fn(async <T,>(message: Record<string, unknown>) => {
    if (message.type === "assist_pipeline/pipeline/list") {
      return {
        pipelines,
        preferred_pipeline: "preferred-pipeline",
      } as T;
    }
    if (message.type === "assist_pipeline/pipeline/get") {
      return pipelines.find((pipeline) => pipeline.id === message.pipeline_id) as T;
    }
    throw new Error(`Unexpected WS message: ${message.type}`);
  });
  const subscribeMessage = vi.fn(async <T,>(
    callback: (message: T) => void,
    message: Record<string, unknown>
  ) => {
    pipelineCallback = callback as (message: {
      type: string;
      data: Record<string, unknown>;
    }) => void;
    expect(message).toMatchObject({
      type: "assist_pipeline/run",
      start_stage: "intent",
      end_stage: "intent",
      input: { text: "Turn on the lights" },
      pipeline: "preferred-pipeline",
      conversation_id: null,
    });
    return unsubscribe;
  });

  const hass: TestHass = {
    callWS: callWS as unknown as TestHass["callWS"],
    connection: {
      subscribeMessage:
        subscribeMessage as unknown as TestHass["connection"]["subscribeMessage"],
    },
  };

  return {
    hass,
    emitPipelineEvent: (message: {
      type: string;
      data: Record<string, unknown>;
    }) => pipelineCallback?.(message),
    unsubscribe,
    callWS,
    subscribeMessage,
  };
};

const createCard = async (config: AssistPipelineCardConfig = {}) => {
  const card = new AssistPipelineCard();
  document.body.appendChild(card);
  card.setConfig(config);
  const harness = createHass();
  card.hass = harness.hass;
  await Promise.resolve();
  await Promise.resolve();
  return { card, ...harness };
};

describe("AssistPipelineCard", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders an embedded chat by default", async () => {
    const { card } = await createCard();

    expect(card.shadowRoot?.querySelector(".chat")).not.toBeNull();
    expect(card.shadowRoot?.querySelector(".pipeline")?.textContent).toContain(
      "Preferred"
    );
    expect(card.getCardSize()).toBe(5);
  });

  it("registers both dashboard element names", () => {
    expect(customElements.get("assist-pipeline-card")).toBe(AssistPipelineCard);
    expect(customElements.get("hacs-assist-pipeline-card")).toBeDefined();
  });

  it("registers custom card picker metadata for both names", () => {
    expect(window.customCards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "custom:assist-pipeline-card" }),
        expect.objectContaining({ type: "custom:hacs-assist-pipeline-card" }),
      ])
    );
  });

  it("sends text through the Assist pipeline websocket and renders the reply", async () => {
    const { card, emitPipelineEvent, unsubscribe, subscribeMessage } =
      await createCard();
    const form = card.shadowRoot?.querySelector("form");
    const input = card.shadowRoot?.querySelector("input");
    input!.value = "Turn on the lights";

    form?.dispatchEvent(new SubmitEvent("submit", { bubbles: true }));
    await Promise.resolve();

    expect(subscribeMessage).toHaveBeenCalledTimes(1);

    emitPipelineEvent({
      type: "intent-progress",
      data: {
        chat_log_delta: {
          role: "assistant",
          content: "Turning them on",
        },
      },
    });

    expect(card.shadowRoot?.querySelector(".messages")?.textContent).toContain(
      "Turning them on"
    );

    emitPipelineEvent({
      type: "intent-end",
      data: {
        intent_output: {
          conversation_id: "abc123",
          continue_conversation: true,
          response: {
            response_type: "action_done",
            speech: {
              plain: {
                speech: "Done",
              },
            },
          },
        },
      },
    });

    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(card.shadowRoot?.querySelector(".messages")?.textContent).toContain(
      "Done"
    );
  });

  it("keeps the native Assist dialog action available for button mode", async () => {
    const { card } = await createCard({
      appearance: "button",
      pipeline_id: "preferred",
    });
    let detail: unknown;
    card.addEventListener("hass-action", (event) => {
      detail = (event as CustomEvent).detail;
    });

    card.shadowRoot?.querySelector("button")?.click();

    expect(detail).toEqual({
      config: {
        tap_action: {
          action: "assist",
          pipeline_id: "preferred",
          start_listening: false,
        },
      },
      action: "tap",
    });
  });

  it("rejects unknown appearances", () => {
    const card = new AssistPipelineCard();

    expect(() =>
      card.setConfig({ appearance: "giant" as AssistPipelineCardConfig["appearance"] })
    ).toThrow("appearance must be 'chat', 'card', or 'button'");
  });
});
