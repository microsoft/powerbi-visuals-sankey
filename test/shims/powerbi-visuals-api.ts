import type powerbiApi from "powerbi-visuals-api";

// powerbi-visuals-api is types-only; esbuild cannot inline its const enums, so they need runtime
// values. `satisfies` pins them to the API so a drifted value fails the build.
const powerbiVisualsApi = {
    VisualEnumerationInstanceKinds: {
        ConstantOrRule: 3 satisfies powerbiApi.VisualEnumerationInstanceKinds.ConstantOrRule
    },
    visuals: {
        ValidatorType: {
            Min: 0 satisfies powerbiApi.visuals.ValidatorType.Min,
            Max: 1 satisfies powerbiApi.visuals.ValidatorType.Max
        }
    }
};

export default powerbiVisualsApi;
