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
import DataViewMatrix = powerbi.DataViewMatrix;
import DataViewMatrixNode = powerbi.DataViewMatrixNode;
import ISelectionIdBuilder = powerbi.visuals.ISelectionIdBuilder;
// powerbi.extensibility.visual
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

export class SelectionIdBuilder {
    private visualHost: IVisualHost;
    private matrix: DataViewMatrix;
    private matrixDataArray: DataViewMatrixNode[] = [];
    private builder: ISelectionIdBuilder;

    constructor(
        IVisualHost: IVisualHost,
        matrix: DataViewMatrix) {

        this.visualHost = IVisualHost;
        this.matrix = matrix
        this.getMatrixArray(this.matrix.rows.root);
        this.matrixDataArray.shift(); // delete matrix root node
    }

    // walks the matrix deep first, adds each node to matrixDataArray
    private getMatrixArray(node: DataViewMatrixNode) {
        this.matrixDataArray.push(node);
        if (node.children) {
            node.children.forEach(child => this.getMatrixArray(child))
        }
    }

    public createSelectionId(index: number): ISelectionId {
        return this.visualHost.createSelectionIdBuilder()
            .withMatrixNode(this.matrixDataArray[index], this.matrix.rows.levels)
            .createSelectionId();
    }
}
