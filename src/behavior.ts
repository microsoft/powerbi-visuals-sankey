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

import { Selection as d3Selection } from "d3-selection";

import {
    ISelectableDataPoint,
    SankeyDiagramLink,
    SankeyDiagramNode
} from "./dataInterfaces";

import * as sankeyDiagramUtils from "./utils";

// d3
type Selection<T> = d3Selection<any, T, any, any>;

import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;

export interface SankeyDiagramBehaviorOptions {
    nodes: Selection<SankeyDiagramNode>;
    links: Selection<SankeyDiagramLink>;
    clearCatcher: Selection<any>;
}

const EnterCode: string = "Enter";
const SpaceCode: string = "Space";

export class SankeyDiagramBehavior{
    private behaviorOptions: SankeyDiagramBehaviorOptions;
    private selectionManager: ISelectionManager;

    constructor(selectionManager: ISelectionManager) {
        this.selectionManager = selectionManager;
        this.selectionManager.registerOnSelectCallback(this.onSelectCallback.bind(this));
    }

    private onSelectCallback(selectionIds?: ISelectionId[]){
        this.applySelectionStateToData(selectionIds);
        this.renderSelection();
    }

    private applySelectionStateToData(selectionIds?: ISelectionId[]): void {
        const selectedIds: ISelectionId[] = selectionIds || <ISelectionId[]>this.selectionManager.getSelectionIds();
        this.setSelectedToDataPoints(this.behaviorOptions.nodes.data(), selectedIds);
        this.setSelectedToDataPoints(this.behaviorOptions.links.data(), selectedIds);
    }

    private setSelectedToDataPoints(dataPoints: ISelectableDataPoint[], ids: ISelectionId[]): void{
        dataPoints.forEach((dataPoint: SankeyDiagramNode | SankeyDiagramLink) => {
            dataPoint.selected = false;
            ids.forEach((selectedId: ISelectionId) => {
                if (selectedId.equals(<ISelectionId>dataPoint.selectionId)) {
                    dataPoint.selected = true;
                }
            });
        });
    }

    public bindEvents(
        behaviorOptions: SankeyDiagramBehaviorOptions): void {

        this.behaviorOptions = behaviorOptions;

        this.bindClickEventToNodes();
        this.bindKeyboardEventToNodes();
        this.bindClickEventToLinks();
        this.bindKeyboardEventToLinks();
        this.bindClickEventToClearCatcher();

        this.applySelectionStateToData();
    }

    private bindContextMenuEvent(elements: Selection<any>): void {
        elements.on("contextmenu", (event: PointerEvent, dataPoint: ISelectableDataPoint | undefined) => {
            this.selectionManager.showContextMenu(dataPoint ? dataPoint.selectionId : {},
                {
                    x: event.clientX,
                    y: event.clientY
                }
            );
            event.preventDefault();
            event.stopPropagation();
        });
    }

    private bindClickEventToNodes(): void {
        this.behaviorOptions.nodes.on("click", (event: PointerEvent, node: SankeyDiagramNode) => {
            const selectedIds: ISelectionId[] = node.linkSelectableIds.filter((selectedId: ISelectionId) => this.selectionManager.getSelectionIds().some((id: ISelectionId) =>id.equals(selectedId)));
            const notSelectedIds: ISelectionId[] = node.linkSelectableIds.filter((notSelectedId:ISelectionId) => !this.selectionManager.getSelectionIds().some((id: ISelectionId) =>id.equals(notSelectedId)));

            if (selectedIds.length === node.linkSelectableIds.length){
                this.selectionManager.select(selectedIds, true);
            }
            else {
                if (event.ctrlKey || event.metaKey || event.shiftKey){
                    this.selectionManager.select(notSelectedIds, true);
                }
                else {
                    // deselecting previously selected ids so that all node.linkSelectableIds are in the same deselected state
                    this.selectionManager.select(selectedIds, false);
                    this.selectionManager.select(node.linkSelectableIds, false);
                }
            }
            this.onSelectCallback();
        });

        this.bindContextMenuEvent(this.behaviorOptions.nodes);
    }

    private bindKeyboardEventToNodes(): void {
        this.behaviorOptions.nodes.on("keydown", (event: KeyboardEvent, node: SankeyDiagramNode) => {
            if (event.code !== EnterCode && event.code !== SpaceCode) {
                return;
            }

            const selectedIds: ISelectionId[] = node.linkSelectableIds.filter((selectedId: ISelectionId) => this.selectionManager.getSelectionIds().some((id: ISelectionId) =>id.equals(selectedId)));
            const notSelectedIds: ISelectionId[] = node.linkSelectableIds.filter((notSelectedId:ISelectionId) => !this.selectionManager.getSelectionIds().some((id: ISelectionId) =>id.equals(notSelectedId)));

            if (selectedIds.length === node.linkSelectableIds.length){
                this.selectionManager.select(selectedIds, true);
            }
            else {
                if (event.ctrlKey || event.metaKey || event.shiftKey){
                    this.selectionManager.select(notSelectedIds, true);
                }
                else {
                    // deselecting previously selected ids so that all node.linkSelectableIds are in the same deselected state
                    this.selectionManager.select(selectedIds, false);
                    this.selectionManager.select(node.linkSelectableIds, false);
                }
            }
            this.onSelectCallback();

        });
    }

    private bindClickEventToLinks(): void {
        this.behaviorOptions.links.on("click", (event: PointerEvent, link: SankeyDiagramLink) => {
            this.selectionManager.select(link.selectionId, event.ctrlKey || event.metaKey || event.shiftKey);
            this.onSelectCallback();

        });

        this.bindContextMenuEvent(this.behaviorOptions.links);
    }

    private bindKeyboardEventToLinks(): void {
        this.behaviorOptions.links.on("keydown", (event: KeyboardEvent, link: SankeyDiagramLink) => {
            if (event.code !== EnterCode && event.code !== SpaceCode) {
                return;
            }
            this.selectionManager.select(link.selectionId, event.ctrlKey || event.metaKey || event.shiftKey);
            this.onSelectCallback();

        });
    }

    private bindClickEventToClearCatcher(): void {
        this.behaviorOptions.clearCatcher.on("click", () => {
            this.selectionManager.clear();
            this.onSelectCallback();
        });

        this.bindContextMenuEvent(this.behaviorOptions.clearCatcher);
    }

    public renderSelection(): void {
        this.behaviorOptions.nodes.attr("aria-selected", (node: SankeyDiagramNode) => sankeyDiagramUtils.isNodeSelected(node, this.selectionManager));
        this.behaviorOptions.links.attr("aria-selected", (link: SankeyDiagramLink) => sankeyDiagramUtils.isLinkSelected(link, this.selectionManager));

        sankeyDiagramUtils.updateLinksFillOpacity(
            this.behaviorOptions.links,
            this.selectionManager);

        sankeyDiagramUtils.updateNodesFillOpacity(
            this.behaviorOptions.nodes,
            this.selectionManager);
    }
}