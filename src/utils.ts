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
type Selection<T> = d3Selection<Element, T, Element, unknown>;

// powerbi.visuals
import powerbi from "powerbi-visuals-api";
import ISelectionId = powerbi.visuals.ISelectionId;

// powerbi.extensibility
import ISelectionManager = powerbi.extensibility.ISelectionManager;

import {
SankeyDiagramNode,
SankeyDiagramLink
} from "./dataInterfaces";

const SelectedClassName: string = "selected";

export function isNodeSelected(node: SankeyDiagramNode, selectionManager: ISelectionManager): boolean {
    let isSelected: boolean = false;
    const selectedIds: ISelectionId[] = <ISelectionId[]>selectionManager.getSelectionIds();
    node.linkSelectableIds.forEach((selectableId: ISelectionId) => {
        if (selectedIds.some((id: ISelectionId) => id.equals(selectableId))){
            isSelected = true;
        }
    });
    return isSelected;
}

export function isLinkSelected(link: SankeyDiagramLink, selectionManager: ISelectionManager): boolean {
    return selectionManager.getSelectionIds().some((id: ISelectionId) => id.equals(link.selectionId));
}

export function updateLinksFillOpacity(
    links: Selection<SankeyDiagramLink>,
    selectionManager: ISelectionManager): void {

    links.classed(SelectedClassName, (link: SankeyDiagramLink): boolean => isLinkSelected(link, selectionManager));
}

export function updateNodesFillOpacity(
    nodes: Selection<SankeyDiagramNode>,
    selectionManager: ISelectionManager): void {

    const hasSelection: boolean = selectionManager.hasSelection();
    nodes.classed(SelectedClassName, (node: SankeyDiagramNode): boolean => {
        const isSelected: boolean = isNodeSelected(node, selectionManager);
        return hasSelection && !isSelected;
    });
}
