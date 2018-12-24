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

// powerbi.extensibility.visual
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

interface CategoryIdentityIndex {
    categoryIndex: number;
    identityIndex: number;
}

export class SankeyDiagramSelectionIdBuilder {
    private static DefaultCategoryIndex: number = 0;

    private visualHost: IVisualHost;
    private categories: DataViewCategoryColumn[];

    constructor(
        IVisualHost: IVisualHost,
        categories: DataViewCategoryColumn[]) {

        this.visualHost = IVisualHost;
        this.categories = categories || [];
    }

    private getIdentityById(index: number): CategoryIdentityIndex {
        let categoryIndex: number = SankeyDiagramSelectionIdBuilder.DefaultCategoryIndex,
            identityIndex: number = index;

        for (let length: number = this.categories.length; categoryIndex < length; categoryIndex++) {
            const amountOfIdentities: number = this.categories[categoryIndex].identity.length;

            if (identityIndex > amountOfIdentities - 1) {
                identityIndex -= amountOfIdentities;
            } else {
                break;
            }
        }

        return {
            categoryIndex,
            identityIndex
        };
    }

    public createSelectionId(index: number): ISelectionId {
        const categoryIdentityIndex: CategoryIdentityIndex = this.getIdentityById(index);

        return this.visualHost.createSelectionIdBuilder()
            .withCategory(
                this.categories[categoryIdentityIndex.categoryIndex],
                categoryIdentityIndex.identityIndex)
            .createSelectionId();
    }
}
