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

import ISelectionId = powerbi.visuals.ISelectionId;

import {
    SankeyDiagramSettings
} from "./settings";

// powerbi.extensibility.utils.tooltip
import {
    TooltipEnabledDataPoint
} from "powerbi-visuals-utils-tooltiputils";

export enum SankeyLinkDirrections {
    Forward,
    Backward,
    SelfLink
}

export interface SankeyDiagramLabel {
    internalName: string;
    name: string;
    formattedName: string;
    width: number;
    maxWidth?: number;
    height: number;
    color: string;
}

export interface SankeyDiagramRect {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
}

export interface SankeyDiagramNode extends
    TooltipEnabledDataPoint,
    SankeyDiagramRect{

    label: SankeyDiagramLabel;
    inputWeight: number;
    outputWeight: number;
    selectionId: ISelectionId;
    backwardWeight?: number;
    selfLinkWeight?: number;
    links: SankeyDiagramLink[];
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fillColor?: string;
    strokeColor?: string;
    cloneLink?: SankeyDiagramNode;
    settings?: SankeyDiagramNodePositionSetting;
    linkSelectableIds?: ISelectionId[];
}

export interface SankeyDiagramLink extends
    TooltipEnabledDataPoint{

    label: string;
    source: SankeyDiagramNode;
    destination: SankeyDiagramNode;
    weight: number;
    height?: number;
    shiftByAxisYSource?: number;
    shiftByAxisYDestination?: number;
    fillColor: string;
    strokeColor: string;
    direction: SankeyLinkDirrections;
    selectionId: ISelectionId;
}

export interface SankeyDiagramColumn {
    countOfNodes: number;
    sumValueOfNodes: number;
}

export enum SankeyDiagramNodeStatus {
    NotVisited = 0,
    Visited = 1,
    Processing = 2
}

export interface SankeyDiagramVisitedNode {
    node: SankeyDiagramNode;
    status: SankeyDiagramNodeStatus;
}

export interface SankeyDiagramCycleDictionary {
    [propName: string]: SankeyDiagramNode[];
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

export interface SankeyDiagramDataPoint {
    source: any;
    destination: any;
    weight: number;
}

export interface SankeyDiagramNodePositionSetting {
    name: string;
    y?: string;
    x?: string;
}
