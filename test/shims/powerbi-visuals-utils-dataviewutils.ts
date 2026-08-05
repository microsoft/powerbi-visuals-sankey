import * as dataViewUtils from "powerbi-visuals-utils-dataviewutils/lib/index.js";

export * from "powerbi-visuals-utils-dataviewutils/lib/index.js";

// DataViewWildcardMatchingOption is a const enum, so it has no runtime value under esbuild.
export const dataViewWildcard = {
    ...dataViewUtils.dataViewWildcard,
    DataViewWildcardMatchingOption: {
        InstancesAndTotals: 0,
        InstancesOnly: 1,
        TotalsOnly: 2
    }
};
