# Assist Pipeline Card

A small Home Assistant custom card for chatting with Assist from a dashboard.

By default, it runs the selected Assist pipeline directly with Home Assistant's `assist_pipeline/run` websocket API and streams the response into the card. It can also render as a compact button that opens Home Assistant's native Assist dialog through the supported `hass-action` custom-card event.

## Installation

### HACS custom repository

1. Add this repository to HACS as a Lovelace dashboard repository.
2. Install **Assist Pipeline Card**.
3. Add `/hacsfiles/hacs-assist-pipeline-card/hacs-assist-pipeline-card.js` as a dashboard resource if HACS does not add it automatically.

### Manual

Copy `dist/hacs-assist-pipeline-card.js` to `<config>/www/hacs-assist-pipeline-card.js`, then add it as a dashboard resource:

```yaml
url: /local/hacs-assist-pipeline-card.js
type: module
```

## Usage

```yaml
type: custom:assist-pipeline-card
name: Assist
icon: mdi:comment-processing-outline
appearance: chat
pipeline_id: last_used
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | string | `Assist` | Button label. |
| `icon` | string | `mdi:comment-processing-outline` | Icon shown on the button. |
| `pipeline_id` | string | `last_used` | Assist pipeline to use. Use `preferred`, `last_used`, or a specific pipeline id. |
| `appearance` | string | `chat` | Use `chat` for embedded text chat, `card` for a native Assist dialog opener card, or `button` for a compact opener. |
| `placeholder` | string | `Ask Assist` | Placeholder text for the embedded chat input. |
| `start_listening` | boolean | `false` | For `card` or `button` appearance, whether the native Assist dialog should start voice capture immediately. |

## Development

```bash
npm install
npm run quality
```

## Releases

Versions are standard npm package versions. Use one of:

```bash
npm run release:patch
npm run release:minor
npm run release:major
```

Those commands update `package.json`, update `package-lock.json`, create a matching git commit, and create a matching `vX.Y.Z` tag. Push the commit and tag:

```bash
git push origin main --follow-tags
```

The `Release` workflow verifies that the pushed tag matches `package.json`, runs the full quality gate, builds `dist/hacs-assist-pipeline-card.js`, and publishes a GitHub release.
