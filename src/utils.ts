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

// d3
import { Selection as d3Selection } from "d3-selection";
type Selection<T> = d3Selection<any, T, any, any>;

// powerbi.visuals
import powerbi from "powerbi-visuals-api";
import ISelectionId = powerbi.visuals.ISelectionId;

// powerbi.extensibility.utils.interactivity
import { interactivitySelectionService, interactivityBaseService } from "powerbi-visuals-utils-interactivityutils";
import SelectableDataPoint = interactivitySelectionService.SelectableDataPoint;
import IInteractivityService = interactivityBaseService.IInteractivityService;

import {
SankeyDiagramNode,
SankeyDiagramLink
} from "./dataInterfaces";

const SelectedClassName: string = "selected";

export function getFillOpacity(
    selected: boolean,
    highlight: boolean,
    hasSelection: boolean,
    hasPartialHighlights: boolean): boolean {

    if ((hasPartialHighlights && !highlight) || (hasSelection && !selected)) {
        return true;
    }

    return false;
}

export function isTheDataPointNode(dataPoint: SankeyDiagramLink | SankeyDiagramNode): boolean {
    const node: SankeyDiagramNode = <SankeyDiagramNode>dataPoint;

    return node.selectableDataPoints && node.selectableDataPoints.length
        ? true
        : false;
}

export function isDataPointSelected(dataPoint: SankeyDiagramLink | SankeyDiagramNode): boolean {
    const node: SankeyDiagramNode = <SankeyDiagramNode>dataPoint,
        link: SankeyDiagramLink = <SankeyDiagramLink>dataPoint;

    let selected: boolean;

    if (isTheDataPointNode(dataPoint)) {
        node.selectableDataPoints.forEach((selectableDataPoint: SelectableDataPoint) => {
            selected = selected || selectableDataPoint.selected;
        });
    } else if (link.identity) {
        selected = link.selected;
    }

    return selected;
}

export function updateFillOpacity(
    selection: Selection<SankeyDiagramNode | SankeyDiagramLink>,
    interactivityService?: IInteractivityService<SelectableDataPoint>,
    hasSelection: boolean = false): void {

    let hasHighlights: boolean = false;

    if (interactivityService) {
        hasHighlights = interactivityService.hasSelection();
    }

    selection.classed(SelectedClassName, (dataPoint: SankeyDiagramLink | SankeyDiagramNode): boolean => {
        const dataPointSelected: boolean = isDataPointSelected(dataPoint),
            theDataPointNode: boolean = isTheDataPointNode(dataPoint);

        const selected: boolean = !theDataPointNode && hasSelection
            ? !dataPointSelected
            : dataPointSelected;

        return getFillOpacity(
            selected,
            false,
            hasSelection,
            !selected && hasHighlights);
    });
}

export function areDataPointsSelected(
    selectedDataPoints: SelectableDataPoint[],
    dataPoints: SelectableDataPoint[]): boolean {

    if (!dataPoints
        || !selectedDataPoints
        || dataPoints.length !== selectedDataPoints.length) {

        return false;
    }

    return doDataPointsIncludeIdentities(selectedDataPoints, dataPoints);
}

export function doDataPointsIncludeIdentities(
    selectedDataPoints: SelectableDataPoint[],
    dataPoints: SelectableDataPoint[]): boolean {

    return selectedDataPoints.every((selectedDataPoint: SelectableDataPoint) => {
        return doDataPointsIncludeIdentity(dataPoints, selectedDataPoint);
    });
}

export function doDataPointsIncludeIdentity(
    dataPoints: SelectableDataPoint[],
    selectedDataPoint: SelectableDataPoint): boolean {

    return dataPoints.some((dataPoint: SelectableDataPoint) => {
        return selectedDataPoint
            && dataPoint
            && selectedDataPoint.identity
            && dataPoint.identity
            && (<ISelectionId>selectedDataPoint.identity).equals(<ISelectionId>dataPoint.identity);
    });
}
