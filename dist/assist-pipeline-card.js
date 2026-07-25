const c = "assist-pipeline-card", d = "hacs-assist-pipeline-card", m = "0.1.2", u = "Assist", _ = "mdi:comment-processing-outline";
class f extends HTMLElement {
  constructor() {
    super(...arguments), this._config = {
      name: u,
      icon: _,
      pipeline_id: "last_used",
      start_listening: !1,
      appearance: "chat",
      placeholder: "Ask Assist"
    }, this._loading = !1, this._processing = !1, this._conversationId = null, this._messages = [
      {
        who: "hass",
        text: "How can I assist?"
      }
    ];
  }
  setConfig(e) {
    if (e.appearance && !["card", "button", "chat"].includes(e.appearance))
      throw new Error("appearance must be 'chat', 'card', or 'button'");
    this._config = {
      name: e.name ?? u,
      icon: e.icon ?? _,
      pipeline_id: e.pipeline_id ?? "last_used",
      start_listening: e.start_listening ?? !1,
      appearance: e.appearance ?? "chat",
      placeholder: e.placeholder ?? "Ask Assist"
    }, this._render();
  }
  set hass(e) {
    this._hass = e, e && this._config.appearance === "chat" && this._loadPipeline();
  }
  get hass() {
    return this._hass;
  }
  getCardSize() {
    return this._config.appearance === "chat" ? 5 : 1;
  }
  getGridOptions() {
    return {
      rows: this._config.appearance === "chat" ? 5 : 1,
      columns: this._config.appearance === "chat" ? 6 : 3,
      min_rows: 1,
      min_columns: 3
    };
  }
  static getStubConfig() {
    return {
      name: "Assist",
      pipeline_id: "last_used",
      appearance: "chat"
    };
  }
  async _loadPipeline() {
    if (!(!this.hass || this._loading)) {
      this._loading = !0, this._render();
      try {
        const e = await this.hass.callWS({
          type: "assist_pipeline/pipeline/list"
        });
        this._preferredPipeline = e.preferred_pipeline ?? void 0;
        const i = this._resolvePipelineId(e.pipelines);
        this._pipeline = await this.hass.callWS({
          type: "assist_pipeline/pipeline/get",
          pipeline_id: i
        }), this._lastUsedPipeline = this._pipeline.id;
      } catch (e) {
        this._messages = [
          {
            who: "hass",
            text: `Could not load Assist pipeline: ${g(e)}`,
            error: !0
          }
        ];
      } finally {
        this._loading = !1, this._render();
      }
    }
  }
  _resolvePipelineId(e) {
    var n, t;
    if (this._config.pipeline_id === "preferred")
      return this._preferredPipeline;
    if (this._config.pipeline_id === "last_used")
      return this._lastUsedPipeline ?? this._preferredPipeline ?? ((n = e[0]) == null ? void 0 : n.id);
    const i = e.find(
      (o) => o.id === this._config.pipeline_id
    );
    return (i == null ? void 0 : i.id) ?? this._preferredPipeline ?? ((t = e[0]) == null ? void 0 : t.id);
  }
  _render() {
    var o, s;
    const e = this.shadowRoot ?? this.attachShadow({ mode: "open" }), i = this._config.appearance === "button", n = ["button", "card"].includes(this._config.appearance);
    e.innerHTML = `
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
          min-height: ${i ? "48px" : "72px"};
          padding: ${i ? "0" : "16px"};
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
      ${n ? i ? this._buttonTemplate() : `<ha-card>${this._buttonTemplate()}</ha-card>` : this._chatTemplate()}
    `, (o = e.querySelector(".open-button")) == null || o.addEventListener("click", () => {
      this._openAssistDialog();
    }), (s = e.querySelector("form")) == null || s.addEventListener("submit", (p) => {
      p.preventDefault();
      const l = e.querySelector("input"), h = l == null ? void 0 : l.value.trim();
      h && (l.value = "", this._sendMessage(h));
    });
    const t = e.querySelector(".messages");
    t && (t.scrollTop = t.scrollHeight);
  }
  _buttonTemplate() {
    return `
      <div class="button-content">
        <button class="open-button" type="button" aria-label="${r(
      this._config.name
    )}">
          <ha-icon icon="${r(this._config.icon)}"></ha-icon>
          <span class="label">${r(this._config.name)}</span>
        </button>
      </div>
    `;
  }
  _chatTemplate() {
    var e;
    return `
      <ha-card>
        <div class="chat">
          <div class="header">
            <ha-icon icon="${r(this._config.icon)}"></ha-icon>
            <div class="title">${r(this._config.name)}</div>
            <div class="pipeline">${r(
      this._loading ? "Loading..." : ((e = this._pipeline) == null ? void 0 : e.name) ?? "No pipeline"
    )}</div>
          </div>
          <div class="messages">
            ${this._messages.map(
      (i) => `
                  <div class="message ${i.who}${i.error ? " error" : ""}">
                    ${r(i.text)}
                  </div>
                `
    ).join("")}
          </div>
          <form>
            <input
              type="text"
              autocomplete="off"
              placeholder="${r(this._config.placeholder)}"
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
  async _sendMessage(e) {
    if (!this.hass || this._processing || (this._pipeline || await this._loadPipeline(), !this._pipeline))
      return;
    this._processing = !0;
    const i = { who: "hass", text: "...", pending: !0 };
    this._messages = [...this._messages, { who: "user", text: e }, i], this._render();
    let n;
    try {
      n = await this.hass.connection.subscribeMessage(
        (t) => {
          this._processPipelineEvent(t, i, () => {
            n == null || n();
          });
        },
        {
          type: "assist_pipeline/run",
          start_stage: "intent",
          end_stage: "intent",
          input: { text: e },
          pipeline: this._pipeline.id,
          conversation_id: this._conversationId
        }
      );
    } catch (t) {
      i.text = `Error starting Assist: ${g(t)}`, i.error = !0, i.pending = !1, this._processing = !1, this._render();
    }
  }
  _processPipelineEvent(e, i, n) {
    var t, o;
    if (e.type === "intent-progress") {
      const s = e.data.chat_log_delta;
      (s == null ? void 0 : s.role) === "assistant" && s.content && (i.text = i.pending ? s.content : `${i.text}${s.content}`, i.pending = !1, this._render());
      return;
    }
    if (e.type === "intent-end") {
      const s = e.data.intent_output;
      this._conversationId = s.conversation_id;
      const p = (o = (t = s.response.speech) == null ? void 0 : t.plain) == null ? void 0 : o.speech;
      p ? i.text = p : i.pending && (i.text = ""), i.error = s.response.response_type === "error", i.pending = !1, this._processing = !1, n(), this._render();
      return;
    }
    e.type === "error" && (i.text = e.data.message, i.error = !0, i.pending = !1, this._processing = !1, n(), this._render());
  }
  _openAssistDialog() {
    const e = new Event("hass-action", {
      bubbles: !0,
      composed: !0
    });
    e.detail = {
      config: {
        tap_action: {
          action: "assist",
          pipeline_id: this._config.pipeline_id,
          start_listening: this._config.start_listening
        }
      },
      action: "tap"
    }, this.dispatchEvent(e);
  }
}
class x extends f {
}
const r = (a) => a.replace(/[&<>"']/g, (e) => {
  switch (e) {
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
      return e;
  }
}), g = (a) => a instanceof Error ? a.message : typeof a == "string" ? a : "unknown error";
customElements.get(c) || customElements.define(c, f);
customElements.get(d) || customElements.define(d, x);
window.customCards = window.customCards ?? [];
window.customCards.push(
  {
    type: `custom:${c}`,
    name: "Assist Pipeline Card",
    description: "Chat with Home Assistant Assist from a dashboard card."
  },
  {
    type: `custom:${d}`,
    name: "Assist Pipeline Card",
    description: "Alias for Assist Pipeline Card."
  }
);
console.info(
  `%cAssist Pipeline Card v${m} loaded`,
  "color: #03a9f4; font-weight: 700;",
  {
    elements: [`custom:${c}`, `custom:${d}`]
  }
);
export {
  f as AssistPipelineCard
};
//# sourceMappingURL=hacs-assist-pipeline-card.js.map
