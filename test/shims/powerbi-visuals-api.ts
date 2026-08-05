// powerbi-visuals-api is types-only; esbuild cannot inline its const enums, so they need runtime values.
const powerbiVisualsApi = {
    VisualEnumerationInstanceKinds: {
        Constant: 1,
        Rule: 2,
        ConstantOrRule: 3
    },
    visuals: {
        ValidatorType: {
            Min: 0,
            Max: 1,
            Required: 2
        }
    }
};

export default powerbiVisualsApi;
