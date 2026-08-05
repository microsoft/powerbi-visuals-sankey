import powerbiVisualsApi from "./mocks/powerbi-visuals-api";

(globalThis as unknown as { powerbi: typeof powerbiVisualsApi }).powerbi = powerbiVisualsApi;
