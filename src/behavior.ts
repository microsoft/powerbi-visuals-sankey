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

// powerbi.extensibility.utils.interactivity
import { interactivitySelectionService, interactivityBaseService } from "powerbi-visuals-utils-interactivityutils";
import SelectableDataPoint = interactivitySelectionService.SelectableDataPoint;
import IInteractiveBehavior = interactivityBaseService.IInteractiveBehavior;
import IInteractivityService = interactivityBaseService.IInteractivityService;

import ISelectionHandler = interactivityBaseService.ISelectionHandler;
import IBehaviorOptions = interactivityBaseService.IBehaviorOptions;

export interface SankeyDiagramBehaviorOptions extends IBehaviorOptions<SelectableDataPoint> {
    nodes: Selection<SankeyDiagramNode>;
    links: Selection<SankeyDiagramLink>;
    clearCatcher: Selection<any>;
    interactivityService: IInteractivityService<SelectableDataPoint>;
}

const EnterCode = "Enter";
const SpaceCode = "Space";

export class SankeyDiagramBehavior implements IInteractiveBehavior {
    private behaviorOptions: SankeyDiagramBehaviorOptions;
    private selectionHandler: ISelectionHandler;


    private selectedDataPoints: SelectableDataPoint[];

    public static create(): IInteractiveBehavior {
        return new SankeyDiagramBehavior();
    }

    constructor() {
        this.createAnEmptySelectedDataPoints();
    }

    public bindEvents(
        behaviorOptions: SankeyDiagramBehaviorOptions,
        selectionHandler: ISelectionHandler): void {

        this.behaviorOptions = behaviorOptions;
        this.selectionHandler = selectionHandler;

        this.bindClickEventToNodes();
        this.bindKeyboardEventToNodes();
        this.bindClickEventToLinks();
        this.bindKeyboardEventToLinks();
        this.bindClickEventToClearCatcher();
    }

    private bindClickEventToNodes(): void {
        this.behaviorOptions.nodes.on("click", (event: PointerEvent, node: SankeyDiagramNode) => {
            let selectableDataPoints: SelectableDataPoint[] = node.selectableDataPoints;
            if (node.cloneLink) {
                selectableDataPoints = selectableDataPoints.concat(node.cloneLink.selectableDataPoints);
            }

            this.clearSelection();

            if (!sankeyDiagramUtils.areDataPointsSelected(this.selectedDataPoints, selectableDataPoints)) {
                selectableDataPoints.forEach((subDataPoint: SelectableDataPoint) => {
                    this.selectionHandler.handleSelection(subDataPoint, true);
                });

                this.selectedDataPoints = selectableDataPoints;
            } else {
                this.createAnEmptySelectedDataPoints();
            }
        });
    }

    private bindKeyboardEventToNodes(): void {
        this.behaviorOptions.nodes.on("contextmenu", (event: PointerEvent, datum: SankeyDiagramNode) => {
            if (event) {
                this.selectionHandler.handleContextMenu(
                    datum,
                    {
                        x: event.clientX,
                        y: event.clientY
                    });
                event.preventDefault();
            }
        });
    }

    private bindClickEventToLinks(): void {
        this.behaviorOptions.links.on("click", (event: PointerEvent, link: SankeyDiagramLink) => {
            this.selectionHandler.handleSelection(link, event.ctrlKey || event.metaKey);
            this.createAnEmptySelectedDataPoints();
        });

        this.behaviorOptions.links.on("contextmenu", (event: PointerEvent, datum: SankeyDiagramLink) => {
            if (event) {
                this.selectionHandler.handleContextMenu(
                    datum,
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
            this.selectionHandler.handleSelection(link, event.ctrlKey || event.metaKey);
            this.createAnEmptySelectedDataPoints();

        });

        this.behaviorOptions.links.on("contextmenu", (event: PointerEvent, datum: SankeyDiagramLink) => {
            if (event) {
                this.selectionHandler.handleContextMenu(
                    datum,
                    {
                        x: event.clientX,
                        y: event.clientY
                    });
                event.preventDefault();
            }
        });
    }

    private bindClickEventToClearCatcher(): void {
        this.behaviorOptions.clearCatcher.on("contextmenu", (event: PointerEvent) => {
            if (event) {
                this.selectionHandler.handleContextMenu(
                    null,
                    {
                        x: event.clientX,
                        y: event.clientY
                    });
                event.preventDefault();
            }
        });
        this.behaviorOptions.clearCatcher.on("click", () => {
            this.clearSelection();
            this.createAnEmptySelectedDataPoints();
        });
    }

    private clearSelection(): void {
        this.selectionHandler.handleClearSelection();
    }

    private createAnEmptySelectedDataPoints(): void {
        this.selectedDataPoints = [];
    }

    public renderSelection(hasSelection: boolean): void {
        this.behaviorOptions.links.attr("aria-selected", sankeyDiagramUtils.isDataPointSelected);
        sankeyDiagramUtils.updateFillOpacity(
            this.behaviorOptions.links,
            this.behaviorOptions.interactivityService,
            hasSelection);

        sankeyDiagramUtils.updateFillOpacity(
            this.behaviorOptions.nodes,
            this.behaviorOptions.interactivityService,
            hasSelection);
    }
}