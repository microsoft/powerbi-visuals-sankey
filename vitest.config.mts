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
                replacement: path.resolve(rootDirectory, "test/mocks/powerbi-visuals-api.ts")
            },
            {
                find: /^powerbi-visuals-utils-colorutils$/,
                replacement: path.resolve(rootDirectory, "test/mocks/powerbi-visuals-utils-colorutils.ts")
            },
            {
                find: /^powerbi-visuals-utils-dataviewutils$/,
                replacement: path.resolve(rootDirectory, "test/mocks/powerbi-visuals-utils-dataviewutils.ts")
            },
            {
                find: /^powerbi-visuals-utils-typeutils(?:\/lib\/index(?:\.js)?)?$/,
                replacement: path.resolve(rootDirectory, "test/mocks/powerbi-visuals-utils-typeutils.ts")
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
        reporters: ["default", "junit", "json"],
        outputFile: {
            junit: "test-results/TESTS-report.xml",
            json: "test-results/vitest-report.json"
        },
        coverage: {
            provider: "v8",
            include: ["src/**/*.ts"],
            reporter: ["text", "html", "lcov", "cobertura"]
        }
    }
});