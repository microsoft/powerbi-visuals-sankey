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

import * as d3 from "d3";

const getEvent = (): MouseEvent => <MouseEvent>require("d3-selection").event;

import {
    SankeyDiagramLink,
    SankeyDiagramNode
} from "./dataInterfaces";

import * as sankeyDiagramUtils from "./utils";

// d3
type Selection<T> = d3.Selection<any, T, any, any>;

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

export class SankeyDiagramBehavior implements IInteractiveBehavior {
    private behaviorOptions: SankeyDiagramBehaviorOptions;
    private selectionHandler: ISelectionHandler;

    private selectedDataPoints: SelectableDataPoint[];

    // tslint:disable-next-line: function-name
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
        this.bindClickEventToLinks();
        this.bindClickEventToClearCatcher();
    }

    private bindClickEventToNodes(): void {
        this.behaviorOptions.nodes.on("click", (node: SankeyDiagramNode) => {
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

        this.behaviorOptions.nodes.on("contextmenu", (datum: SankeyDiagramNode) => {
            const event: MouseEvent = (<MouseEvent>getEvent()) || <MouseEvent>window.event;
            if (event) {
                this.selectionHandler.handleContextMenu(
                    <any>datum,
                    {
                        x: event.clientX,
                        y: event.clientY
                    });
                event.preventDefault();
            }
        });
    }

    private bindClickEventToLinks(): void {
        this.behaviorOptions.links.on("click", (link: SankeyDiagramLink) => {
            this.selectionHandler.handleSelection(link, getEvent().ctrlKey);
            this.createAnEmptySelectedDataPoints();
        });

        this.behaviorOptions.links.on("contextmenu", (datum: SankeyDiagramLink) => {
            const event: MouseEvent = (<MouseEvent>getEvent()) || <MouseEvent>window.event;
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
