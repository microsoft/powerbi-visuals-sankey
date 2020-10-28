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

// powerbi.visuals
import powerbi from "powerbi-visuals-api";
import ISelectionId = powerbi.visuals.ISelectionId;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewMatrix = powerbi.DataViewMatrix;
import DataViewMatrixNode = powerbi.DataViewMatrixNode;

// powerbi.extensibility.visual
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

export class SelectionIdBuilder {
    private visualHost: IVisualHost;
    private matrix: DataViewMatrix;

    constructor(
        IVisualHost: IVisualHost,
        matrix: DataViewMatrix) {

        this.visualHost = IVisualHost;
        this.matrix = matrix
    }

    public createSelectionId(index: number): ISelectionId {
        let counter: number = 0,
        selectionId:ISelectionId;

        this.matrix.rows.root.children.forEach((source: DataViewMatrixNode) => {
            if (counter == index){
                const categoryColumn: DataViewCategoryColumn = {
                    source: {
                        displayName: null,
                        // tslint:disable-next-line: insecure-random
                        queryName: `${Math.random()}-${+(new Date())}`
                    },
                    values: null,
                    identity: [source.identity]
                };

                selectionId = this.visualHost.createSelectionIdBuilder()
                .withCategory(categoryColumn,0)
                .createSelectionId();
            }
            counter+=1
        });

        this.matrix.rows.root.children.forEach((source: powerbi.DataViewMatrixNode) =>{
            source.children.forEach((destination: powerbi.DataViewMatrixNode) => {
                if (counter == index){
                    const categoryColumn1: DataViewCategoryColumn = {
                        source: {
                            displayName: null,
                            // tslint:disable-next-line: insecure-random
                            queryName: `${Math.random()}-${+(new Date())}`
                        },
                        values: null,
                        identity: [source.identity]
                    };
                    const categoryColumn2: DataViewCategoryColumn = {
                        source: {
                            displayName: null,
                            // tslint:disable-next-line: insecure-random
                            queryName: `${Math.random()}-${+(new Date())}`
                        },
                        values: null,
                        identity: [destination.identity]
                    };
                    selectionId = this.visualHost.createSelectionIdBuilder()
                    .withCategory(categoryColumn1,0)
                    .withCategory(categoryColumn2, 0)
                    .createSelectionId();
                }
                counter += 1
            });
        });

        return selectionId;
    }
}
