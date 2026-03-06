import type { Preview } from "@storybook/react";
import { addons } from "@storybook/preview-api";

const EVENT_ID = "iztro/ai-code/data";
const REQUEST_ID = "iztro/ai-code/request";

let bridgeInitialized = false;
let latestData: unknown = null;

function initBridge() {
  if (bridgeInitialized) return;
  bridgeInitialized = true;
  const channel = addons.getChannel();

  window.addEventListener("iztro-data-update", ((e: CustomEvent) => {
    latestData = e.detail;
    try {
      channel.emit(EVENT_ID, e.detail);
    } catch (_) {}
  }) as EventListener);

  channel.on(REQUEST_ID, () => {
    if (latestData) {
      channel.emit(EVENT_ID, latestData);
    }
  });
}

const preview: Preview = {
  decorators: [
    (Story) => {
      initBridge();
      return Story();
    },
  ],
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
