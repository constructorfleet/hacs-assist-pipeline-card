const f = "assist-pipeline-card", m = "hacs-assist-pipeline-card", y = "0.1.7", x = "Assist", b = "mdi:comment-processing-outline";
class w extends HTMLElement {
  constructor() {
    super(...arguments), this._config = {
      name: x,
      icon: b,
      pipeline_id: "last_used",
      start_listening: !1,
      appearance: "chat",
      placeholder: "Ask Assist",
      show_pipeline_selector: !0,
      input_mode: "text"
    }, this._pipelines = [], this._loading = !1, this._processing = !1, this._conversationId = null, this._messages = [
      {
        who: "hass",
        text: "How can I assist?"
      }
    ];
  }
  setConfig(e) {
    if (e.appearance && !["card", "button", "chat"].includes(e.appearance))
      throw new Error("appearance must be 'chat', 'card', or 'button'");
    if (e.input_mode && !["text", "audio"].includes(e.input_mode))
      throw new Error("input_mode must be 'text' or 'audio'");
    const i = this._config;
    this._config = {
      name: e.name ?? x,
      icon: e.icon ?? b,
      pipeline_id: e.pipeline_id ?? "last_used",
      start_listening: e.start_listening ?? !1,
      appearance: e.appearance ?? "chat",
      placeholder: e.placeholder ?? "Ask Assist",
      show_pipeline_selector: e.show_pipeline_selector ?? !0,
      input_mode: e.input_mode ?? "text"
    }, (i.appearance !== this._config.appearance || i.pipeline_id !== this._config.pipeline_id) && (this._pipeline = void 0, this._pipelineLoadKey = void 0), this._render(), this._ensurePipelineLoaded();
  }
  set hass(e) {
    this._hass = e, this._ensurePipelineLoaded();
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
  static getConfigElement() {
    return document.createElement("assist-pipeline-card-editor");
  }
  _ensurePipelineLoaded() {
    if (!this.hass || this._config.appearance !== "chat")
      return;
    const e = String(this._config.pipeline_id);
    this._loading || this._pipelineLoadKey === e || (this._pipelineLoadKey = e, this._loadPipeline(e));
  }
  async _loadPipeline(e) {
    if (this.hass) {
      this._loading = !0, this._render();
      try {
        const i = await this.hass.callWS({
          type: "assist_pipeline/pipeline/list"
        });
        this._pipelines = i.pipelines, this._preferredPipeline = i.preferred_pipeline ?? void 0;
        const s = this._resolvePipelineId(i.pipelines), t = await this.hass.callWS({
          type: "assist_pipeline/pipeline/get",
          pipeline_id: s
        });
        if (e !== String(this._config.pipeline_id))
          return;
        this._pipeline = t, this._lastUsedPipeline = this._pipeline.id;
      } catch (i) {
        this._messages = [
          {
            who: "hass",
            text: `Could not load Assist pipeline: ${v(i)}`,
            error: !0
          }
        ];
      } finally {
        this._loading = !1, this._render();
      }
    }
  }
  _resolvePipelineId(e) {
    var s, t;
    if (this._config.pipeline_id === "preferred")
      return this._preferredPipeline;
    if (this._config.pipeline_id === "last_used")
      return this._lastUsedPipeline ?? this._preferredPipeline ?? ((s = e[0]) == null ? void 0 : s.id);
    const i = e.find(
      (l) => l.id === this._config.pipeline_id
    );
    return (i == null ? void 0 : i.id) ?? this._preferredPipeline ?? ((t = e[0]) == null ? void 0 : t.id);
  }
  _render() {
    var l, n, c, u;
    const e = this.shadowRoot ?? this.attachShadow({ mode: "open" }), i = this._config.appearance === "button", s = ["button", "card"].includes(this._config.appearance);
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
          align-items: center;
          color: var(--secondary-text-color);
          display: flex;
          font-size: 12px;
          justify-content: flex-end;
          min-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        select.pipeline-select {
          appearance: none;
          background: transparent;
          border: 0;
          color: var(--secondary-text-color);
          font: inherit;
          max-width: 120px;
          min-width: 0;
          overflow: hidden;
          padding: 0;
          text-align: right;
          text-overflow: ellipsis;
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
          max-width: min(88%, 560px);
          overflow-wrap: anywhere;
          padding: 8px 10px;
          text-align: left;
          white-space: pre-wrap;
          width: fit-content;
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

        .voice-row {
          border-top: 1px solid var(--divider-color);
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

        .voice-button {
          background: var(--primary-color);
          border: 0;
          border-radius: 8px;
          color: var(--text-primary-color);
          cursor: pointer;
          font: inherit;
          min-height: 44px;
          width: 100%;
        }
      </style>
      ${s ? i ? this._buttonTemplate() : `<ha-card>${this._buttonTemplate()}</ha-card>` : this._chatTemplate()}
    `, (l = e.querySelector(".open-button")) == null || l.addEventListener("click", () => {
      this._openAssistDialog();
    }), (n = e.querySelector("form")) == null || n.addEventListener("submit", (_) => {
      _.preventDefault();
      const d = e.querySelector("input"), a = d == null ? void 0 : d.value.trim();
      a && (d.value = "", this._sendMessage(a));
    }), (c = e.querySelector(".voice-button")) == null || c.addEventListener("click", () => this._openAssistDialog()), (u = e.querySelector(".pipeline-select")) == null || u.addEventListener("change", (_) => {
      const d = _.target.value;
      this._config = {
        ...this._config,
        pipeline_id: d
      }, this._pipeline = void 0, this._pipelineLoadKey = void 0, this._ensurePipelineLoaded(), this._render();
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
    const e = this._config.input_mode === "audio" ? `
          <div class="voice-row">
            <button class="voice-button" type="button">
              Start Assist
            </button>
          </div>
        ` : `
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
        `;
    return `
      <ha-card>
        <div class="chat">
          <div class="header">
            <ha-icon icon="${r(this._config.icon)}"></ha-icon>
            <div class="title">${r(this._config.name)}</div>
            <div class="pipeline">${this._pipelineControlTemplate()}</div>
          </div>
          <div class="messages">
            ${this._messages.map(
      (i) => `<div class="message ${i.who}${i.error ? " error" : ""}">${r(i.text)}</div>`
    ).join("")}
          </div>
          ${e}
        </div>
      </ha-card>
    `;
  }
  _pipelineControlTemplate() {
    var s;
    if (!this._config.show_pipeline_selector)
      return r(
        this._loading ? "Loading..." : ((s = this._pipeline) == null ? void 0 : s.name) ?? "No pipeline"
      );
    const e = this._config.pipeline_id;
    return `
      <select class="pipeline-select" aria-label="Assist pipeline">
        ${[
      p("last_used", "Last used", e),
      p("preferred", "Preferred", e),
      ...this._pipelines.map(
        (t) => p(t.id, t.name, e)
      )
    ].join("")}
      </select>
    `;
  }
  async _sendMessage(e) {
    if (!this.hass || this._processing || (this._pipeline || this._ensurePipelineLoaded(), !this._pipeline))
      return;
    this._processing = !0;
    const i = { who: "hass", text: "...", pending: !0 };
    this._messages = [...this._messages, { who: "user", text: e }, i], this._render();
    let s;
    try {
      s = await this.hass.connection.subscribeMessage(
        (t) => {
          this._processPipelineEvent(t, i, () => {
            s == null || s();
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
      i.text = `Error starting Assist: ${v(t)}`, i.error = !0, i.pending = !1, this._processing = !1, this._render();
    }
  }
  _processPipelineEvent(e, i, s) {
    var t, l;
    if (e.type === "intent-progress") {
      const n = e.data.chat_log_delta;
      (n == null ? void 0 : n.role) === "assistant" && n.content && (i.text = i.pending ? n.content : `${i.text}${n.content}`, i.pending = !1, this._render());
      return;
    }
    if (e.type === "intent-end") {
      const n = e.data.intent_output;
      this._conversationId = n.conversation_id;
      const c = (l = (t = n.response.speech) == null ? void 0 : t.plain) == null ? void 0 : l.speech;
      c ? i.text = c : i.pending && (i.text = ""), i.error = n.response.response_type === "error", i.pending = !1, this._processing = !1, s(), this._render();
      return;
    }
    e.type === "error" && (i.text = e.data.message, i.error = !0, i.pending = !1, this._processing = !1, s(), this._render());
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
class E extends w {
}
class $ extends HTMLElement {
  constructor() {
    super(...arguments), this._config = {}, this._pipelines = [], this._loadingPipelines = !1;
  }
  setConfig(e) {
    this._config = {
      ...e,
      appearance: e.appearance ?? "chat",
      pipeline_id: e.pipeline_id ?? "last_used",
      input_mode: e.input_mode ?? "text",
      show_pipeline_selector: e.show_pipeline_selector ?? !0
    }, this._render();
  }
  set hass(e) {
    const i = !!this._hass;
    this._hass = e, e && !i && (this._render(), this._loadPipelines());
  }
  get hass() {
    return this._hass;
  }
  async _loadPipelines() {
    if (!(!this.hass || this._loadingPipelines || this._pipelines.length)) {
      this._loadingPipelines = !0, this._render();
      try {
        const e = await this.hass.callWS({
          type: "assist_pipeline/pipeline/list"
        });
        this._pipelines = e.pipelines, this._preferredPipeline = e.preferred_pipeline ?? void 0;
      } finally {
        this._loadingPipelines = !1, this._render();
      }
    }
  }
  _render() {
    var t, l, n, c, u, _, d;
    const e = this.shadowRoot ?? this.attachShadow({ mode: "open" }), i = {
      name: this._config.name ?? x,
      icon: this._config.icon ?? b,
      appearance: this._config.appearance ?? "chat",
      pipeline_id: this._config.pipeline_id ?? "last_used",
      input_mode: this._config.input_mode ?? "text",
      placeholder: this._config.placeholder ?? "Ask Assist",
      show_pipeline_selector: this._config.show_pipeline_selector ?? !0,
      start_listening: this._config.start_listening ?? !1
    }, s = [
      p("last_used", "Last used", i.pipeline_id),
      p(
        "preferred",
        this._preferredPipeline ? "Preferred pipeline" : "Preferred",
        i.pipeline_id
      ),
      ...this._pipelines.map(
        (a) => p(a.id, a.name, i.pipeline_id)
      )
    ].join("");
    e.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .editor {
          display: grid;
          gap: 14px;
        }

        label {
          color: var(--secondary-text-color);
          display: grid;
          font-size: 12px;
          gap: 6px;
        }

        input,
        select {
          background: var(--card-background-color);
          border: 1px solid var(--divider-color);
          border-radius: 6px;
          box-sizing: border-box;
          color: var(--primary-text-color);
          font: inherit;
          min-height: 40px;
          padding: 0 10px;
          width: 100%;
        }

        ha-icon-picker {
          width: 100%;
        }

        .check {
          align-items: center;
          color: var(--primary-text-color);
          display: flex;
          font-size: 14px;
          gap: 8px;
        }

        .check input {
          min-height: auto;
          width: auto;
        }
      </style>
      <div class="editor">
        <label>
          Name
          <input data-field="name" type="text" value="${r(i.name)}" />
        </label>
        <label>
          Icon
          ${customElements.get("ha-icon-picker") ? `
                <ha-icon-picker
                  data-field="icon"
                  label="Icon"
                  value="${r(i.icon)}"
                ></ha-icon-picker>
              ` : `<input data-field="icon" type="text" value="${r(i.icon)}" />`}
        </label>
        <label>
          Appearance
          <select data-field="appearance">
            ${p("chat", "Chat", i.appearance)}
            ${p("card", "Dialog opener card", i.appearance)}
            ${p("button", "Dialog opener button", i.appearance)}
          </select>
        </label>
        <label>
          Input mode
          <select data-field="input_mode">
            ${p("text", "Text chat", i.input_mode)}
            ${p("audio", "Audio dialog button", i.input_mode)}
          </select>
        </label>
        <label>
          Default pipeline
          <select data-field="pipeline_id" ${this._loadingPipelines ? "disabled" : ""}>
            ${s}
          </select>
        </label>
        <label>
          Placeholder
          <input
            data-field="placeholder"
            type="text"
            value="${r(i.placeholder)}"
            ${i.input_mode === "audio" ? "disabled" : ""}
          />
        </label>
        <label class="check">
          <input
            data-field="show_pipeline_selector"
            type="checkbox"
            ${i.show_pipeline_selector ? "checked" : ""}
          />
          Show pipeline selector on the card
        </label>
        <label class="check">
          <input
            data-field="start_listening"
            type="checkbox"
            ${i.start_listening ? "checked" : ""}
          />
          Start listening when opening the native Assist dialog
        </label>
      </div>
    `, e.querySelectorAll("input, select, ha-icon-picker").forEach((a) => {
      a.addEventListener("change", (g) => {
        g.stopPropagation(), this._valueChanged(a);
      }), a.addEventListener("value-changed", (g) => {
        g.stopPropagation(), this._valueChanged(a);
      }), a instanceof HTMLInputElement && a.type === "text" && a.addEventListener("input", (g) => {
        g.stopPropagation(), this._valueChanged(a);
      });
    }), (t = e.querySelector(".editor")) == null || t.addEventListener("click", h), (l = e.querySelector(".editor")) == null || l.addEventListener("mousedown", h), (n = e.querySelector(".editor")) == null || n.addEventListener("mouseup", h), (c = e.querySelector(".editor")) == null || c.addEventListener("pointerdown", h), (u = e.querySelector(".editor")) == null || u.addEventListener("pointerup", h), (_ = e.querySelector(".editor")) == null || _.addEventListener("keydown", h), (d = e.querySelector(".editor")) == null || d.addEventListener("keyup", h);
  }
  _valueChanged(e) {
    const i = e.dataset.field;
    if (!i)
      return;
    const s = e instanceof HTMLInputElement && e.type === "checkbox" ? e.checked : e.value ?? e.value, t = {
      ...this._config,
      [i]: s
    };
    this._config = t, this.dispatchEvent(
      new CustomEvent("config-changed", {
        bubbles: !0,
        composed: !0,
        detail: {
          config: t
        }
      })
    );
  }
}
const r = (o) => o.replace(/[&<>"']/g, (e) => {
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
}), v = (o) => o instanceof Error ? o.message : typeof o == "string" ? o : "unknown error", h = (o) => {
  o.stopPropagation();
}, p = (o, e, i) => `
  <option value="${r(o)}" ${o === i ? "selected" : ""}>
    ${r(e)}
  </option>
`;
customElements.get(f) || customElements.define(f, w);
customElements.get(m) || customElements.define(m, E);
customElements.get("assist-pipeline-card-editor") || customElements.define("assist-pipeline-card-editor", $);
window.customCards = window.customCards ?? [];
window.customCards.push({
  type: f,
  name: "Assist Pipeline Card",
  description: "Chat with Home Assistant Assist from a dashboard card."
});
console.info(
  `%cAssist Pipeline Card v${y} loaded`,
  "color: #03a9f4; font-weight: 700;",
  {
    elements: [`custom:${f}`, `custom:${m}`]
  }
);
export {
  w as AssistPipelineCard
};
//# sourceMappingURL=hacs-assist-pipeline-card.js.map
