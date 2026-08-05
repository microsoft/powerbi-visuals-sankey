import * as dataViewUtils from "../../node_modules/powerbi-visuals-utils-dataviewutils/lib/index.js";

export * from "../../node_modules/powerbi-visuals-utils-dataviewutils/lib/index.js";

export const dataViewWildcard = {
    ...dataViewUtils.dataViewWildcard,
    DataViewWildcardMatchingOption: {
        InstancesAndTotals: 0,
        InstancesOnly: 1,
        TotalsOnly: 2
    }
};