import powerbiVisualsApi from "./shims/powerbi-visuals-api";

// src/settings.ts reads the ambient powerbi global that the Power BI host normally provides.
(globalThis as unknown as { powerbi: typeof powerbiVisualsApi }).powerbi = powerbiVisualsApi;
