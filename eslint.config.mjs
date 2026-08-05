import powerbiVisualsConfigs from "eslint-plugin-powerbi-visuals";
import tseslint from 'typescript-eslint';

export default [
    ...tseslint.configs.recommended,
    powerbiVisualsConfigs.configs.recommended,
    {
        ignores: ["node_modules/**", "dist/**", "coverage/**", "test/**", ".vscode/**", ".tmp/**"],

    },
    {
        rules: {
            "@typescript-eslint/no-explicit-any" : "off",
        }
    },
];