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
    // powerbi.extensibility.utils.interactivity
    import SelectableDataPoint = powerbi.extensibility.utils.interactivity.SelectableDataPoint;

    // powerbi.extensibility.utils.tooltip
    import TooltipEnabledDataPoint = powerbi.extensibility.utils.tooltip.TooltipEnabledDataPoint;

    export interface SankeyDiagramLabel {
        name: string;
        formattedName: string;
        width: number;
        maxWidth?: number;
        height: number;
        colour: string;
    }

    export interface SankeyDiagramRect {
        left?: number;
        right?: number;
        top?: number;
        bottom?: number;
    }

    export interface SankeyDiagramNode extends
        TooltipEnabledDataPoint,
        SankeyDiagramRect {

        label: SankeyDiagramLabel;
        inputWeight: number;
        outputWeight: number;
        links: SankeyDiagramLink[];
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        colour: string;
        selectableDataPoints?: SelectableDataPoint[];
    }

    export interface SankeyDiagramLink extends
        TooltipEnabledDataPoint,
        SelectableDataPoint {

        source: SankeyDiagramNode;
        destination: SankeyDiagramNode;
        weigth: number;
        height?: number;
        dySource?: number;
        dyDestination?: number;
        color: string;
    }

    export interface SankeyDiagramColumn {
        countOfNodes: number;
        sumValueOfNodes: number;
    }

    export interface SankeyDiagramDataView {
        nodes: SankeyDiagramNode[];
        links: SankeyDiagramLink[];
        columns: SankeyDiagramColumn[];
        settings: SankeyDiagramSettings;
    }

    export interface SankeyDiagramRoleNames {
        rows: string;
        columns: string;
        values: string;
    }
}
