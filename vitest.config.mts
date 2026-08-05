import path from "node:path";
import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    resolve: {
        alias: [
            {
                find: /^powerbi-visuals-api$/,
                replacement: path.resolve(rootDirectory, "test/shims/powerbi-visuals-api.ts")
            },
            {
                find: /^powerbi-visuals-utils-dataviewutils$/,
                replacement: path.resolve(rootDirectory, "test/shims/powerbi-visuals-utils-dataviewutils.ts")
            }
        ]
    },
    css: {
        preprocessorOptions: {
            less: {
                paths: [path.resolve(rootDirectory, "node_modules")]
            }
        }
    },
    test: {
        include: ["test/visualTest.ts"],
        // testutils' assertColorsMatch calls a global expect, so globals cannot be disabled.
        globals: true,
        setupFiles: ["test/setup.ts"],
        browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [
                { browser: "chromium" }
            ],
            viewport: {
                width: 1280,
                height: 720
            }
        },
        deps: {
            optimizer: {
                client: {
                    enabled: true,
                    include: ["powerbi-visuals-utils-formattingutils"]
                }
            }
        },
        clearMocks: true,
        restoreMocks: true,
        coverage: {
            provider: "v8",
            include: ["src/**/*.ts"],
            reporter: ["text", "html", "lcov"]
        }
    }
});