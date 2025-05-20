/*
*  Power BI Visualizations
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/

// powerbi.extensibility.utils.type
import { valueType } from "powerbi-visuals-utils-typeutils";
import ValueType = valueType.ValueType;
import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;

// powerbi.extensibility.utils.test
import {
    testDataViewBuilder,
    getRandomNumbers,
    getRandomNumber
} from "powerbi-visuals-utils-testutils";
import TestDataViewBuilder = testDataViewBuilder.TestDataViewBuilder;
import { DataTable, ResourceColumnMetadata } from "powerbi-visuals-utils-testutils/lib/dataViewBuilder/matrixBuilder";

export class SankeyDiagramData extends TestDataViewBuilder {
    public static ColumnSource: string = "Source";
    public static ColumnDestination: string = "Destination";
    public static ColumnValue: string = "Value";

    public valuesSourceDestination: string[][] = [
        ["Brazil", "Portugal"],
        ["Brazil", "France"],
        ["Brazil", "Spain"],
        ["Brazil", "England"],
        ["Canada", "Portugal"],
        ["Canada", "France"],
        ["Canada", "England"],
        ["Mexico", "Portugal"],
        ["Mexico", "France"],
        ["Mexico", "Spain"],
        ["Mexico", "England"],
        ["USA", "Portugal"],
        ["USA", "France"],
        ["USA", "Spain"],
        ["USA", "England"],
        ["England", "USA"],
        ["Portugal", "Angola"],
        ["Portugal", "Senegal"],
        ["Portugal", "Morocco"],
        ["USA", "USA"],
        ["England", "Mexico"],
        ["Mexico", "Canada"]
    ];

    public valuesSourceDestinationWithWeigth: string[][] = [
        ["Brazil", "Portugal"],
        ["Brazil", "France"],
        ["Brazil", "Spain"]
    ];

    // public valuesValue: number[] = getRandomNumbers(this.valuesSourceDestination.length, 10, 500);

    // public valuesWithLowValue: number[] = getRandomNumbers(this.valuesSourceDestinationWithWeigth.length, 10, 50).map((v) => v / 100);

    public getMatrixDataTable(sourceDestination: string[][], useLowValues: boolean = false): DataTable {
        let result: any[][] = [];

        result[0] = ["Source", "Destination", "Weight"];

        const min: number = 10;
        const max: number = useLowValues ? 50 : 500;

        for (let link of sourceDestination) {
            let value = getRandomNumber(min, max);
            if (useLowValues) {
                value = value / 100;
            }
            result.push([...link, value]);
        }
        return new DataTable(result);
    }

    public getDataViewWithoutValues(): DataView {
        const data: DataTable = new DataTable([["Source", "Destination"], ...this.valuesSourceDestination]);

        const matrixBuilder = SankeyDiagramData.createMatrixDataViewBuilder(data);

        const source: ResourceColumnMetadata = {
            name: "Source",
            displayName: "Source",
            type: { text: true },
        };
        const destination: ResourceColumnMetadata = {
            name: "Destination",
            displayName: "Destination",
            type: { text: true },
        }

        return matrixBuilder
            .withRowGroup({
                columns: [{
                    metadata: source,
                    role: "Source",
                    index: 1,
                }]
            })
            .withRowGroup({
                columns: [{
                    metadata: destination,
                    role: "Destination",
                    index: 2,
                }]
            })
            .build();
    }

    public getDataViewWithLowValue(): DataView {
        const data: DataTable = this.getMatrixDataTable(this.valuesSourceDestinationWithWeigth, true);

        const matrixBuilder = SankeyDiagramData.createMatrixDataViewBuilder(data);

        const source: ResourceColumnMetadata = {
            name: "Source",
            displayName: "Source",
            type: { text: true },
        };
        const destination: ResourceColumnMetadata = {
            name: "Destination",
            displayName: "Destination",
            type: { text: true },
        }
        const values: ResourceColumnMetadata = {
            name: "Weight",
            displayName: "Weight",
            type: { numeric: true },
        }

        const dataView: DataView = matrixBuilder
            .withValues([{
                metadata: values,
                role: "Weight",
                index: 0,
            }])
            .withRowGroup({
                columns: [{
                    metadata: source,
                    role: "Source",
                    index: 1,
                }]
            })
            .withRowGroup({
                columns: [{
                    metadata: destination,
                    role: "Destination",
                    index: 2,
                }]
            })
            .build();
        return dataView;
    }

    public getDataView(): DataView {
        const data: DataTable = this.getMatrixDataTable(this.valuesSourceDestination, false);

        const matrixBuilder = SankeyDiagramData.createMatrixDataViewBuilder(data);

        const source: ResourceColumnMetadata = {
            name: "Source",
            displayName: "Source",
            type: { text: true },
        };
        const destination: ResourceColumnMetadata = {
            name: "Destination",
            displayName: "Destination",
            type: { text: true },
        }
        const values: ResourceColumnMetadata = {
            name: "Weight",
            displayName: "Weight",
            type: { numeric: true },
        }

        const dataView: DataView = matrixBuilder
            .withRowGroup({
                columns: [{
                    metadata: source,
                    role: "Source",
                    index: 1,
                }]
            })
            .withRowGroup({
                columns: [{
                    metadata: destination,
                    role: "Destination",
                    index: 2,
                }]
            })
            .withValues([{
                metadata: values,
                role: "Weight",
                index: 0,
            }])
            .build();
        return dataView;
    }
}