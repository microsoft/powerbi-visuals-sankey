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

module powerbi.extensibility.visual {
    export interface SankeyDiagramIdentity {
        identity: DataViewScopeIdentity | DataViewScopeIdentity[];
        queryName: string;
    }

    export class SankeyDiagramSelectionIdBuilder {
        private identities: SankeyDiagramIdentity[] = [];

        public static create(): SankeyDiagramSelectionIdBuilder {
            return new SankeyDiagramSelectionIdBuilder();
        }

        public addCategories(categories: DataViewCategoryColumn[]): void {
            categories.forEach((category: DataViewCategoryColumn) => {
                this.addCategory(category);
            });
        }

        public addCategory(category: DataViewCategoryColumn): void {
            var queryName: string = category && category.source
                ? category.source.queryName
                : undefined;

            this.identities.push({
                identity: category.identity || [],
                queryName: queryName
            });
        }

        private getIdentityById(id: number): SankeyDiagramIdentity {
            var identity: DataViewScopeIdentity,
                queryName: string;

            for (var i = 0; i < this.identities.length; i++) {
                var amountOfIdentities: number = (<DataViewScopeIdentity[]>this.identities[i].identity).length;

                if (id > amountOfIdentities - 1) {
                    id -= amountOfIdentities;
                } else {
                    identity = this.identities[i].identity[id];
                    queryName = this.identities[i].queryName;

                    break;
                }
            }

            return { identity, queryName };
        }

        public createSelectionId(id: number): SelectionId {
            var identity: SankeyDiagramIdentity = this.getIdentityById(id),
                measureId: string;

            measureId = identity.identity
                ? (<DataViewScopeIdentity>identity.identity).key
                : undefined;

            return SelectionId.createWithIdAndMeasureAndCategory(
                <DataViewScopeIdentity>identity.identity,
                measureId,
                identity.queryName);
        }
    }
}
