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
    }

    public bindEvents(
        behaviorOptions: SankeyDiagramBehaviorOptions): void {

        this.behaviorOptions = behaviorOptions;

        this.bindClickEventToNodes();
        this.bindKeyboardEventToNodes();
        this.bindClickEventToLinks();
        this.bindKeyboardEventToLinks();
        this.bindClickEventToClearCatcher();
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

            this.renderSelection();
        });

        this.behaviorOptions.nodes.on("contextmenu", (event: PointerEvent, node: SankeyDiagramNode) => {
            if (event) {
                this.selectionManager.showContextMenu(
                    node,
                    {
                        x: event.clientX,
                        y: event.clientY
                    });
                event.preventDefault();
            }
        });
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

            this.renderSelection();
        });
    }

    private bindClickEventToLinks(): void {
        this.behaviorOptions.links.on("click", (event: PointerEvent, link: SankeyDiagramLink) => {
            this.selectionManager.select(link.selectionId, event.ctrlKey || event.metaKey || event.shiftKey);
            this.renderSelection();
        });

        this.behaviorOptions.links.on("contextmenu", (event: PointerEvent, link: SankeyDiagramLink) => {
            if (event) {
                this.selectionManager.showContextMenu(
                    link,
                    {
                        x: event.clientX,
                        y: event.clientY
                    });
                event.preventDefault();
            }
        });
    }

    private bindKeyboardEventToLinks(): void {
        this.behaviorOptions.links.on("keydown", (event: KeyboardEvent, link: SankeyDiagramLink) => {
            if (event.code !== EnterCode && event.code !== SpaceCode) {
                return;
            }
            this.selectionManager.select(link.selectionId, event.ctrlKey || event.metaKey || event.shiftKey);
            this.renderSelection();
        });
    }

    private bindClickEventToClearCatcher(): void {
        this.behaviorOptions.clearCatcher.on("contextmenu", (event: PointerEvent) => {
            if (event) {
                this.selectionManager.showContextMenu(
                    null,
                    {
                        x: event.clientX,
                        y: event.clientY
                    });
                event.preventDefault();
            }
        });
        this.behaviorOptions.clearCatcher.on("click", () => {
            this.selectionManager.clear();
            this.renderSelection();
        });
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