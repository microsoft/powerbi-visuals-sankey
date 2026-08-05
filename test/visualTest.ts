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
import powerbi from "powerbi-visuals-api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import capabilities from "../capabilities.json";

// powerbi
import DataView = powerbi.DataView;

// powerbi.extensibility.visual.test
import { SankeyDiagramData } from "./visualData";
import { VisualBuilder } from "./visualBuilder";

// powerbi.extensibility.visual.SankeyDiagram1446463184954
import {
    SankeyDiagram as VisualClass
}
    from "../src/sankeyDiagram";

import {
    SankeyDiagramNode,
    SankeyDiagramColumn,
    SankeyDiagramDataView,
    SankeyDiagramLink,
    SankeyDiagramLabel
}
    from "../src/dataInterfaces";

// powerbi.extensibility.utils.test
import {
    clickElement,
    assertColorsMatch,
    renderTimeout,
    getRandomNumbers,
    createSelectionManager,
    createVisualHost,
    MockISelectionManager,
} from "powerbi-visuals-utils-testutils";

import { SankeyDiagramBehavior } from "../src/behavior";

import {
    isColorAppliedToElements
} from "./helpers/helpers";

import { ColorHelper } from "powerbi-visuals-utils-colorutils";

import {
    DataLabelsSettings,
    LinkColorContainerItem,
    LinkLabelsSettings,
    LinkOutlineSettings,
    NodesSettings,
    SankeyDiagramScaleSettings,
    SankeyDiagramSettings
} from "../src/settings";


interface SankeyDiagramTestsNode {
    x: number;
    inputWeight: number;
    outputWeight: number;
}

let fireMouseEvent = (type, elem, centerX, centerY) => {
    let evt = document.createEvent('MouseEvents');
    evt.initMouseEvent(type, true, true, window, 1, 1, 1, centerX, centerY, false, false, false, false, 0, elem);
    elem.dispatchEvent(evt);
};

describe("SankeyDiagram", () => {
    let visualBuilder: VisualBuilder,
        visualInstance: VisualClass,
        defaultDataViewBuilder: SankeyDiagramData,
        dataView: DataView;

    const updateRender = (dataView: DataView | DataView[], timeout?: number): Promise<void> =>
        new Promise((resolve) => visualBuilder.updateRenderTimeout(dataView, resolve, timeout));

    const waitForRender = (timeout?: number): Promise<void> =>
        new Promise((resolve) => renderTimeout(resolve, timeout));

    beforeEach(() => {
        visualBuilder = new VisualBuilder(1000, 500);

        defaultDataViewBuilder = new SankeyDiagramData();
        dataView = defaultDataViewBuilder.getDataView();

        visualInstance = visualBuilder.instance;
    });

    afterEach(() => {
        visualBuilder.cleanup();
    });

    describe("getPositiveNumber", () => {
        it("positive value should be positive value", () => {
            let positiveValue: number = 42;

            expect(VisualClass.getPositiveNumber(positiveValue)).toBe(positiveValue);
        });

        it("negative value should be 0", () => {
            expect(VisualClass.getPositiveNumber(-42)).toBe(0);
        });

        it("Infinity value should be 0", () => {
            expect(VisualClass.getPositiveNumber(Infinity)).toBe(0);
        });

        it("-Infinity should be 0", () => {
            expect(VisualClass.getPositiveNumber(-Infinity)).toBe(0);
        });

        it("NaN should be 0", () => {
            expect(VisualClass.getPositiveNumber(NaN)).toBe(0);
        });

        it("undefined should be 0", () => {
            expect(VisualClass.getPositiveNumber(undefined)).toBe(0);
        });

        it("null should be 0", () => {
            expect(VisualClass.getPositiveNumber(null)).toBe(0);
        });
    });

    describe("sortNodesByColumnIndex", () => {
        it("nodes should be sorted correctly", () => {
            let xValues: number[],
                nodes: SankeyDiagramNode[];

            xValues = [42, 13, 52, 182, 1e25, 1, 6, 3, 4];

            nodes = createNodes(xValues);

            xValues.sort((x: number, y: number) => {
                return x - y;
            });

            VisualClass.sortNodesByColumnIndex(nodes).forEach((node: SankeyDiagramNode, index: number) => {
                expect(node.columnIndex).toBe(xValues[index]);
            });
        });

        function createNodes(xValues: number[]): SankeyDiagramNode[] {
            return xValues.map((xValue: number) => {
                return {
                    label: {
                        name: "",
                        formattedName: "",
                        width: 0,
                        height: 0,
                        color: "",
                        internalName: ""
                    },
                    inputWeight: 0,
                    outputWeight: 0,
                    selectionId: null,
                    selected: false,
                    links: [],
                    x: 0,
                    columnIndex: xValue,
                    y: 0,
                    width: 0,
                    height: 0,
                    colour: "",
                    selectionIds: [],
                    tooltipData: []
                };
            });
        }
    });

    describe("getColumns", () => {
        it("getColumns", () => {
            let testNodes: SankeyDiagramTestsNode[];
            const scale: SankeyDiagramScaleSettings = {
                x: 1,
                y: 1
            }

            testNodes = [
                { x: 0, inputWeight: 15, outputWeight: 14 },
                { x: 1, inputWeight: 10, outputWeight: 5 },
                { x: 2, inputWeight: 15, outputWeight: 13 },
                { x: 3, inputWeight: 42, outputWeight: 28 }
            ];

            visualInstance.getColumns(createNodes(testNodes), scale)
                .forEach((column: SankeyDiagramColumn, index: number) => {
                    expect(column.countOfNodes).toBe(1);

                    expect(column.sumValueOfNodes).toBe(testNodes[index].inputWeight);
                });
        });

        function createNodes(testNodes: SankeyDiagramTestsNode[]): SankeyDiagramNode[] {
            return testNodes.map((testNode: SankeyDiagramTestsNode) => {
                return <SankeyDiagramNode>{
                    label: {
                        name: "",
                        formattedName: "",
                        width: 0,
                        height: 0,
                        color: "",
                        internalName: ""
                    },
                    inputWeight: testNode.inputWeight,
                    outputWeight: testNode.outputWeight,
                    selectionId: null,
                    selected: false,
                    links: [],
                    x: 0,
                    columnIndex: testNode.x,
                    y: 0,
                    width: 0,
                    height: 0,
                    colour: "",
                    selectionIds: [],
                    tooltipData: []
                };
            });
        }
    });

    describe("getMaxColumn", () => {
        it("getMaxColumn should return { sumValueOfNodes: 0, countOfNodes: 0 }", () => {
            let maxColumn: SankeyDiagramColumn;

            maxColumn = VisualClass.getMaxColumn([]);

            expect(maxColumn.countOfNodes).toBe(0);
            expect(maxColumn.sumValueOfNodes).toBe(0);
        });

        it("getMaxColumn should return { sumValueOfNodes: 0, countOfNodes: 0 } when columns are null", () => {
            let maxColumn: SankeyDiagramColumn;

            maxColumn = VisualClass.getMaxColumn([
                undefined,
                null
            ]);

            expect(maxColumn.countOfNodes).toBe(0);
            expect(maxColumn.sumValueOfNodes).toBe(0);
        });

        it("getMaxColumn should return max column", () => {
            let maxColumn: SankeyDiagramColumn,
                columns: SankeyDiagramColumn[];

            maxColumn = { countOfNodes: 35, sumValueOfNodes: 21321 };

            columns = [
                { countOfNodes: 15, sumValueOfNodes: 500 },
                { countOfNodes: 25, sumValueOfNodes: 42 },
                maxColumn
            ];

            expect(VisualClass.getMaxColumn(columns)).toBe(maxColumn);
        });
    });


    describe("DOM tests", () => {

        it("main element created", () => {
            expect(visualBuilder.mainElement).toBeDefined();
        });

        it("number of displayed links should match the dataView", async () => {
            await updateRender(dataView);

            const allLinksInDataView = dataView.matrix.rows.root.children.reduce((acc, current) => acc + current.children.length, 0);
            expect(visualBuilder.linksElement).toBeDefined();
            expect(visualBuilder.linkElements.length).toBe(allLinksInDataView);

            let nodes: SankeyDiagramNode[] = visualBuilder.instance
                .converter(dataView)
                .nodes
                .filter((node: SankeyDiagramNode) => {
                    if (node.links.length > 0) {
                        return true;
                    }

                    return false;
                });
            expect(visualBuilder.nodesElement).toBeDefined();
            expect(visualBuilder.nodeElements.length).toEqual(nodes.length);
        });


        it("update without weight values should display nodes", async () => {

            dataView = defaultDataViewBuilder.getDataViewWithoutValues();
            await updateRender(dataView);

            const allLinksInDataView = dataView.matrix.rows.root.children.reduce((acc, current) => acc + current.children.length, 0);
            expect(visualBuilder.linksElement).toBeDefined();
            expect(visualBuilder.linkElements.length).toBe(allLinksInDataView);

            let nodes: SankeyDiagramNode[] = visualBuilder.instance
                .converter(dataView)
                .nodes
                .filter((node: SankeyDiagramNode) => {
                    if (node.links.length > 0) {
                        return true;
                    }

                    return false;
                });

            expect(visualBuilder.nodesElement).toBeDefined();
            expect(visualBuilder.nodeElements.length).toEqual(nodes.length);
        });


        it("node labels should display when labels: { show: true }", async () => {
            dataView.metadata.objects = {
                labels: {
                    show: true
                }
            };

            await updateRender(dataView);

            const display: string = window.getComputedStyle(
                visualBuilder.nodesElement.querySelector("text")
            ).display

            expect(display).toBe("block");
        });


        it("node labels should not display when labels: { show: false } off", async () => {
            dataView.metadata.objects = {
                labels: {
                    show: false
                }
            };

            await updateRender(dataView);

            const display: string = window.getComputedStyle(
                visualBuilder.nodesElement.querySelector("text")
            ).display

            expect(display).toBe("none");
        });


        it("nodes labels should change color", async () => {
            const color: string = "#123123";

            dataView.metadata.objects = {
                labels: {
                    fill: { solid: { color } }
                }
            };

            await updateRender(dataView);

            const fill: string = window.getComputedStyle(
                visualBuilder.nodesElement.querySelector("text")
            ).fill

            assertColorsMatch(fill, color);
        });


        it("links should change color", async () => {
            const color: string = "#E0F600";

            // change colors for all links
            dataView.matrix.rows.root.children.forEach(child => {
                child.children.forEach(grandChild => {
                    grandChild.objects = {
                        links: {
                            fill: {
                                solid: { color }
                            }
                        }
                    }
                })
            })


            await updateRender(dataView);

            const someLink = visualBuilder.linksElement.querySelector("path.link");
            const currentColor: string = window.getComputedStyle(someLink).stroke;

            assertColorsMatch(currentColor, color);
        });


        it("nodes labels are not overlapping", async () => {
            await updateRender(dataView);

            const nodeElements: HTMLElement[] = [...visualBuilder.nodeElements];
            const firstNode: string = nodeElements[0].querySelector("text").innerHTML
            const secondNode: string = nodeElements[1].querySelector("text").innerHTML
            const thirdNode: string = nodeElements[2].querySelector("text").innerHTML

            expect(firstNode).toBe("Brazil");
            expect(secondNode).toBe("USA");
            expect(thirdNode).toBe("Mexico");
        });


        describe("selection and deselection", () => {
            const selectionClass: string = "selected";
            it("nodes", async () => {
                await updateRender(dataView);

                const node: HTMLElement = visualBuilder.nodeElements[0];
                const firstNodeLinksCount: number = 4;
                const link: NodeListOf<HTMLElement> = visualBuilder.linkElements;
                const selectedNodesBeforeClick = [...visualBuilder.nodeElements].filter(node => node.classList.value.includes(selectionClass));
                expect(selectedNodesBeforeClick.length).toBe(0);
                // expect(selectedNodes).not.toBeInDOM();
                clickElement(node);
                await waitForRender();

                const selectedNodesAfterClick = [...visualBuilder.nodeElements].filter(node => node.classList.value.includes(selectionClass));
                expect(selectedNodesAfterClick.length).not.toBe(0);
                // expect(visualBuilder.nodeElements.filter(selectionClass)).toBeInDOM();
                expect(selectedNodesAfterClick).toBeDefined();
                // when node selected, links of node also must be selected
                expect([...visualBuilder.linkElements].filter(link => link.classList.value.includes(selectionClass)).length).toBe(firstNodeLinksCount);

                clickElement(node);
                await waitForRender();
                expect([...visualBuilder.nodeElements].filter(node => node.classList.value.includes(selectionClass)).length).toBe(0);
            });


            it("links", async () => {
                await updateRender(dataView);

                const link: HTMLElement = visualBuilder.linkElements[0];
                expect([...visualBuilder.linkElements].filter(link => link.classList.value.includes(selectionClass)).length).toBe(0);
                clickElement(link);
                await waitForRender();

                // link is selected and in DOM
                expect(link).toBeDefined();
                expect(link.classList).toContain(selectionClass);
                // selected link is the only one that is selected
                expect([...visualBuilder.linkElements].filter(link => link.classList.value.includes(selectionClass)).length).toBe(1);
                
                // deselection does not work without passing 'true' as second argument
                clickElement(link, true);
                await waitForRender();

                // no links selected
                expect([...visualBuilder.linkElements].filter(link => link.classList.value.includes(selectionClass)).length).toBe(0);
            });

            it("multi-selection test", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                let firstGroup: HTMLElement = visualBuilder.linkElements[0],
                    secondGroup: HTMLElement = visualBuilder.linkElements[1],
                    thirdGroup: HTMLElement = visualBuilder.linkElements[2];

                clickElement(firstGroup);
                clickElement(secondGroup, true);

                expect(firstGroup.classList).toContain(selectionClass);
                expect(secondGroup.classList).toContain(selectionClass);
                expect(thirdGroup.classList).not.toContain(selectionClass);
            });


        });


        describe("data rendering", () => {
            it("negative and zero values", async () => {
                let dataLength: number = defaultDataViewBuilder.valuesSourceDestination.length,
                    groupLength = Math.floor(dataLength / 3) - 2,
                    negativeValues = getRandomNumbers(groupLength, -100, 0),
                    zeroValues = new Array(groupLength).fill(0),
                    positiveValues = getRandomNumbers(
                        dataLength - negativeValues.length - zeroValues.length, 1, 100);

                const valuesValue = negativeValues.concat(zeroValues).concat(positiveValues);

                await updateRender([defaultDataViewBuilder.getDataView()]);
                expect(visualBuilder.linkElements.length).toBe(valuesValue.length);
            });
        });

        describe("self links", () => {
            it("must exist", async () => {
                await updateRender([defaultDataViewBuilder.getDataView()]);
                let transformedData: SankeyDiagramDataView = visualBuilder.instance.converter(dataView);

                let links: SankeyDiagramLink[] = transformedData.links.filter((link: SankeyDiagramLink, index: number) => {
                    if (link.source.label.name.match(/\**_SK_SELFLINK/)) {
                        return true;
                    }
                    return false;
                });

                expect(links.length).toBeGreaterThan(0);
            });
        });

        describe("cycles in graph", () => {
            it("must have two nodes with same label", async () => {
                await updateRender([defaultDataViewBuilder.getDataView()]);
                let transformedData: SankeyDiagramDataView = visualBuilder.instance.converter(dataView);
                let links: SankeyDiagramLink[] = transformedData.links.filter((link) => link.source.label.formattedName === link.destination.label.formattedName);
                expect(links.length).toBeGreaterThan(0);
            });
        });

        describe("0-1 values in graph", () => {
            it("must give positive weigth of links", async () => {
                const expectedLinksCount = 3;
                let dataView: DataView = defaultDataViewBuilder.getDataViewWithLowValue();
                await updateRender([dataView]);
                let linksCount = visualBuilder.linksElement.childElementCount;
                expect(linksCount).toBe(expectedLinksCount);
            });
        });

        describe("datalabels", () => {
            it("must be rendered", async () => {
                let dataView: DataView = defaultDataViewBuilder.getDataViewWithLowValue();

                dataView.metadata.objects = {
                    linkLabels: {
                        show: true
                    }
                };

                await updateRender([dataView]);
                expect(visualBuilder.mainElement.querySelectorAll(".linkLabelTexts")).toBeDefined();
            });
        });

        describe("nodes", () => {
            it("must be dragged and the displayed correctly", async () => {
                let dataView: DataView = defaultDataViewBuilder.getDataView();
                await updateRender([dataView]);
                let nodeToDrag = visualBuilder.nodeElements[0];

                let node1 = nodeToDrag.querySelector(".nodeRect").getBoundingClientRect();
                let center1X = Math.floor((node1.left + node1.right) / 2);
                let center1Y = Math.floor((node1.top + node1.bottom) / 2);

                // user second node as target
                let anotherNode = visualBuilder.nodeElements[1];
                const node2 = anotherNode.querySelector(".nodeRect").getBoundingClientRect();
                let center2X = Math.floor((node2.left + node2.right) / 2);
                let center2Y = Math.floor((node2.top + node2.bottom) / 2);

                    // mouse over dragged element and mousedown
                    fireMouseEvent('mousemove', nodeToDrag, center1X, center1Y);
                    fireMouseEvent('mouseenter', nodeToDrag, center1X, center1Y);
                    fireMouseEvent('mouseover', nodeToDrag, center1X, center1Y);
                    fireMouseEvent('mousedown', nodeToDrag, center1X, center1Y);

                    // start dragging process over to drop target
                    fireMouseEvent('dragstart', nodeToDrag, center1X, center1Y);
                    fireMouseEvent('drag', nodeToDrag, center1X, center1Y);
                    fireMouseEvent('mousemove', nodeToDrag, center1X, center1Y);
                    fireMouseEvent('drag', nodeToDrag, center2X, center2Y);
                    fireMouseEvent('mousemove', nodeToDrag, center2X, center2Y);
                    fireMouseEvent('dragend', nodeToDrag, center2X, center2Y);

                    node1 = nodeToDrag.querySelector(".nodeRect").getBoundingClientRect();
                    center1X = Math.floor((node1.left + node1.right) / 2);
                    center1Y = Math.floor((node1.top + node1.bottom) / 2);

                    // positions must match after drag and drop
                    expect(center1X).toBe(center2X);
                    expect(center1Y).toBe(center2Y);

                    // drag to outside of viewport
                    // mouse over dragged element and mousedown
                    fireMouseEvent('dragstart', nodeToDrag, center1X, center1Y);
                    fireMouseEvent('drag', nodeToDrag, center1X, center1Y);
                    fireMouseEvent('mousemove', nodeToDrag, center1X, center1Y);
                    fireMouseEvent('drag', nodeToDrag, -10, -10);
                    fireMouseEvent('mousemove', nodeToDrag, -10, -10);
                    fireMouseEvent('dragend', nodeToDrag, -10, -10);

                    // positions must match after drag and drop
                    const yDif = Math.abs(nodeToDrag.getBoundingClientRect().top - nodeToDrag.parentElement.getBoundingClientRect().top);
                    const xDif = Math.abs(nodeToDrag.getBoundingClientRect().left - nodeToDrag.parentElement.getBoundingClientRect().left);
                    expect(yDif).toBeLessThan(20);
                    expect(xDif).toBeLessThan(20);


                    // drag to outside of viewport
                    // mouse over dragged element and mousedown
                    fireMouseEvent('dragstart', nodeToDrag, center1X, center1Y);
                    fireMouseEvent('drag', nodeToDrag, center1X, center1Y);
                    fireMouseEvent('mousemove', nodeToDrag, center1X, center1Y);
                    fireMouseEvent('drag', nodeToDrag, visualBuilder.viewport.width + 10, visualBuilder.viewport.height + 10);
                    fireMouseEvent('mousemove', nodeToDrag, visualBuilder.viewport.width + 10, visualBuilder.viewport.height + 10);
                    fireMouseEvent('dragend', nodeToDrag, visualBuilder.viewport.width + 10, visualBuilder.viewport.height + 10);

                    // positions must match after drag and drop
                    expect(nodeToDrag.getBoundingClientRect().right).toBeGreaterThan(visualBuilder.viewport.width - 20);
                    expect(nodeToDrag.getBoundingClientRect().bottom).toBeGreaterThan(visualBuilder.viewport.height - 20);


                // call private methods
                (<any>visualBuilder.instance).saveNodePositions((<any>visualBuilder.instance).dataView.nodes);
                (<any>visualBuilder.instance).saveViewportSize();
            });
        });

        describe("reset button", () => {
            it("must be displayed correctly", async () => {
                let dataView: DataView = defaultDataViewBuilder.getDataView();
                dataView.metadata.objects = {
                    nodeComplexSettings: {
                        showResetButon: true
                    }
                };
                await updateRender([dataView]);
                const resetButton = visualBuilder.resetButton;
                const visibility: string = resetButton.style.visibility;
                expect(visibility).toBe("visible");
            });

            it("must reset saved positions", async () => {
                let dataView: DataView = defaultDataViewBuilder.getDataView();
                const nodePositions = `[{"name":"Brazil","x":"477","y":"348"},{"name":"USA_SK_SELFLINK","x":"0","y":"137"},{"name":"Mexico_SK_SELFLINK","x":"0","y":"297"},{"name":"Canada_SK_SELFLINK","x":"0","y":"402"},{"name":"Canada","x":"479","y":"0"},{"name":"England","x":"479","y":"26"},{"name":"Portugal","x":"479","y":"163"},{"name":"France","x":"479","y":"302"},{"name":"Spain","x":"479","y":"406"},{"name":"Mexico","x":"959","y":"0"},{"name":"USA","x":"959","y":"105"},{"name":"Angola","x":"959","y":"267"},{"name":"Senegal","x":"959","y":"320"},{"name":"Morocco","x":"959","y":"437"}]`;
                dataView.metadata.objects = {
                    nodeComplexSettings: {
                        viewportSize: `{"height":"480","width":"980"}`,
                        nodePositions: nodePositions,
                        showResetButon: true
                    }
                };

                await updateRender([dataView]);
                let nodePositionSettings = visualBuilder.instance.sankeyDiagramSettings.nodeComplexSettings.persistProperties.nodePositions.value;
                expect(nodePositionSettings).toBe(nodePositions);

                vi.spyOn(visualBuilder.visualHost, 'persistProperties');
                const resetButton = visualBuilder.resetButton;
                clickElement(resetButton);

                expect(visualBuilder.visualHost.persistProperties).toHaveBeenCalled();
            });
        });

    });

    describe("Selector tests", () => {
        it("creation", () => {
            let source: SankeyDiagramNode = <SankeyDiagramNode>{};
            let destination: SankeyDiagramNode = <SankeyDiagramNode>{};
            let label: SankeyDiagramLabel = <SankeyDiagramLabel>{};
            let labelDest: SankeyDiagramLabel = <SankeyDiagramLabel>{};
            label.name = "Source";
            labelDest.name = "Destination";
            source.label = label;
            destination.label = labelDest;

            let link: SankeyDiagramLink = <SankeyDiagramLink>{};
            link.source = source;
            link.destination = destination;
            link.direction = 0;

            expect(VisualClass.createLinkId(link)).toBe("_Source-0-_Destination");
            expect(VisualClass.createLinkId(link, true)).toBe("linkLabelPaths_Source-0-_Destination");
        });
    });

    describe("Scale settings test:", () => {
        it("the visual must provide min height of node", async () => {
            let dataView: DataView = defaultDataViewBuilder.getDataViewWithLowValue();
            const firstElement: number = 0;

            dataView.metadata.objects = {
                scaleSettings: {
                    provideMinHeight: true
                }
            };

            dataView.matrix.rows.root.children[0].children[0].values[0].value = 1;
            dataView.matrix.rows.root.children[0].children[1].values[0].value = 1;
            dataView.matrix.rows.root.children[0].children[2].values[0].value = 1000000;
            // the dataset has significantly different range of values
            // the visual must provide min height of node

            await updateRender(dataView);
            const minHeightOfNode: number = 5;
            let nodes = visualBuilder.nodeElements;

            let minHeight: number = +nodes[firstElement].children[firstElement].getAttribute("height");
            nodes.forEach((el: HTMLElement) => {
                let height = +el.children[firstElement].getAttribute("height");
                if (height < minHeight) {
                    minHeight = height;
                }
            });
            expect(minHeight).toBeGreaterThan(minHeightOfNode);
        });

        it("the visual must not provide min height of node", async () => {
            let dataView: DataView = defaultDataViewBuilder.getDataViewWithLowValue();
            const firstElement: number = 0;

            dataView.metadata.objects = {
                scaleSettings: {
                    provideMinHeight: false
                }
            };

            // the dataset has significantly different range of values
            // the visual must not provide min height of node
            // the height of node can be 1px;npm
            dataView.matrix.rows.root.children[0].children[0].values[0].value = 1;
            dataView.matrix.rows.root.children[0].children[1].values[0].value = 1;
            dataView.matrix.rows.root.children[0].children[2].values[0].value = 1000000;

            await updateRender([dataView]);
            const minHeightOfNode: number = 5;
            let nodes = visualBuilder.nodeElements;

            let minHeight: number = +nodes[firstElement].children[firstElement].getAttribute("height");
            nodes.forEach((el: HTMLElement) => {
                let height = +el.children[firstElement].getAttribute("height");
                if (height < minHeight) {
                    minHeight = height;
                }
            });
            expect(minHeight).toBeLessThan(minHeightOfNode);
        });
    });


    describe("Settings tests:", () => {
        beforeEach(() => {
            dataView = defaultDataViewBuilder.getDataView();
        });

        it("nodeComplexSettings persist properties properties must be hidden", async () => {
            await updateRender(dataView);
            visualBuilder.instance.getFormattingModel();
            expect(visualBuilder.instance.sankeyDiagramSettings.nodeComplexSettings.persistProperties.nodePositions.visible).toBe(false);
            expect(visualBuilder.instance.sankeyDiagramSettings.nodeComplexSettings.persistProperties.viewportSize.visible).toBe(false);
        });

        it("other properties must exist", async () => {
            await updateRender(dataView);
            // defaults
            const someColor: string = "#000000";
            const nodeLabelsFontSize: number = 12;
            const linkLabelsFontSize: number = 9;
            const unit: number = 0;

            visualBuilder.instance.getFormattingModel();

            let labels: DataLabelsSettings = visualBuilder.instance.sankeyDiagramSettings.labels;

                expect(labels.show.value).toBeTruthy();
                expect(labels.fontSize.value).toBe(nodeLabelsFontSize);
                expect(labels.forceDisplay.value).toBeFalsy();
                expect(labels.unit.value).toBe(unit);
                expect(labels.fill.value.value).toBe(someColor);

                let linkLabels: LinkLabelsSettings = visualBuilder.instance.sankeyDiagramSettings.linkLabels;

                expect(linkLabels.show.value).toBeFalsy();
                expect(linkLabels.fontSize.value).toBe(linkLabelsFontSize);
                expect(linkLabels.fill.value.value).toBe(someColor);

                let scaleSettings = visualBuilder.instance.sankeyDiagramSettings.scale;

                expect(scaleSettings.slices.length).toBe(2);
                expect(scaleSettings.provideMinHeight.value).toBeTruthy();
                expect(scaleSettings.lnScale.value).toBeFalsy();

            expect(visualBuilder.instance.sankeyDiagramSettings.cards.length).toBe(7);
        });
    });

    describe("Capabilities tests", () => {
        it("all items having displayName should have displayNameKey property", () => {
            const objectsChecker = (value: unknown): void => {
                if (value === null || typeof value !== "object") {
                    return;
                }

                const object = value as Record<string, unknown>;
                if (object.displayName) {
                    expect(object.displayNameKey).toBeDefined();
                }

                Object.values(object).forEach(objectsChecker);
            };

            objectsChecker(capabilities);
        });
    });

    describe("Rendering events:", () => {
        let eventService: powerbi.extensibility.IVisualEventService;

        beforeEach(() => {
            eventService = visualBuilder.visualHost.eventService;

            vi.spyOn(eventService, "renderingStarted");
            vi.spyOn(eventService, "renderingFinished");
            vi.spyOn(eventService, "renderingFailed");
        });

        it("should report started and finished on a successful update", () => {
            visualBuilder.updateFlushAllD3Transitions(dataView);

            expect(eventService.renderingStarted).toHaveBeenCalledTimes(1);
            expect(eventService.renderingFinished).toHaveBeenCalledTimes(1);
            expect(eventService.renderingFailed).not.toHaveBeenCalled();
        });

        it("should report failed instead of finished when rendering throws", () => {
            vi.spyOn(visualInstance, "converter").mockImplementation(() => {
                throw new Error("converter failure");
            });
            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

            visualBuilder.updateFlushAllD3Transitions(dataView);

            expect(eventService.renderingStarted).toHaveBeenCalledTimes(1);
            expect(eventService.renderingFailed).toHaveBeenCalledTimes(1);
            expect(eventService.renderingFinished).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    describe("Selection callback:", () => {
        it("should ignore a selection that arrives before the first render", () => {
            const selectionManager: MockISelectionManager = createSelectionManager() as MockISelectionManager;

            new SankeyDiagramBehavior(selectionManager, createVisualHost({}));

            expect(() => selectionManager.simutateSelection([])).not.toThrow();
        });
    });

    describe("Keyboard Navigation tests:", () => {
        it("links should have attributes tabindex>0, role=option, aria-label is not null, and aria-selected=false", async () => {
            await updateRender(dataView);
            let links = visualBuilder.linkElements;
            links.forEach((el: Element) => {
                expect(el.getAttribute("role")).toBe("option");
                expect(Number(el.getAttribute("tabindex"))).toBeGreaterThanOrEqual(1);
                expect(el.getAttribute("aria-selected")).toBe("false");
                expect(el.getAttribute("aria-label")).not.toBeNull();
            });
        });

        it("nodes should have attributes tabindex>0, role=option, aria-label is not null, and aria-selected=false", async () => {
            await updateRender(dataView);
            let nodeRects = visualBuilder.nodeRectElements;
            nodeRects.forEach((el: Element) => {
                expect(el.getAttribute("role")).toBe("option");
                expect(Number(el.getAttribute("tabindex"))).toBeGreaterThanOrEqual(1);
                expect(el.getAttribute("aria-selected")).toBe("false");
                expect(el.getAttribute("aria-label")).not.toBeNull();
            });
        });

        it("enter toggles the correct slice", async () => {
            const enterEvent = new KeyboardEvent("keydown", { code: "Enter", bubbles: true });
            await updateRender(dataView, 2);
            const links: HTMLElement[] = [...visualBuilder.linkElements];

            links[0].dispatchEvent(enterEvent);
            expect(links[0].getAttribute("aria-selected")).toBe("true");

            const otherLinks: HTMLElement[] = links.slice(1);
            otherLinks.forEach((link: HTMLElement) => {
                expect(link.getAttribute("aria-selected")).toBe("false");
            })

            links[1].dispatchEvent(enterEvent);
            expect(links[1].getAttribute("aria-selected")).toBe("true");

            links.splice(1,1);
            links.forEach((link: HTMLElement) => {
                expect(link.getAttribute("aria-selected")).toBe("false");
            });
        });
        
        it("space toggles the correct slice", async () => {
            const spaceEvent = new KeyboardEvent("keydown", { code: "Space", bubbles: true });
            await updateRender(dataView, 2);
            const links: HTMLElement[] = [...visualBuilder.linkElements];

            links[0].dispatchEvent(spaceEvent);
            expect(links[0].getAttribute("aria-selected")).toBe("true");
                        
            const otherLinks: HTMLElement[] = links.slice(1);
            otherLinks.forEach((link: HTMLElement) => {
                expect(link.getAttribute("aria-selected")).toBe("false");
            });

            links[1].dispatchEvent(spaceEvent);
            expect(links[1].getAttribute("aria-selected")).toBe("true");

            links.splice(1, 1);
            links.forEach((element: HTMLElement) => {
                expect(element.getAttribute("aria-selected")).toBe("false");
            });
        });
        
        it("tab between slices works", async () => {
            const tabEvent = new KeyboardEvent("keydown", { code: "Tab", bubbles: true });
            const enterEvent = new KeyboardEvent("keydown", { code: "Enter", bubbles: true });
            await updateRender(dataView, 2);
            const links: HTMLElement[] = [...visualBuilder.linkElements];

            links[0].dispatchEvent(enterEvent);
            expect(links[0].getAttribute("aria-selected")).toBe("true");

            const otherLinks: HTMLElement[] = links.slice(1);
            otherLinks.forEach((link: HTMLElement) => {
                expect(link.getAttribute("aria-selected")).toBe("false");
            });

            visualBuilder.element.dispatchEvent(tabEvent);

            links[1].dispatchEvent(enterEvent);
            expect(links[1].getAttribute("aria-selected")).toBe("true");

            links.splice(1, 1);
            links.forEach((link: HTMLElement) => {
                expect(link.getAttribute("aria-selected")).toBe("false");
            });
        });
    });

    describe("Focus elements tests:", () => {
        it("focused links should have :focus-visible style", async () => {
            await updateRender(dataView);
            const links: HTMLElement[] = [...visualBuilder.linkElements];

            links[0].focus();
            expect(links[0].matches(':focus-visible')).toBe(true);

            const otherLinks: HTMLElement[] = links.slice(1);
            otherLinks.forEach((link: HTMLElement) => {
                expect(link.matches(':focus-visible')).toBe(false);
            });
        });

        it("focused links should have styled stroke and outline", async () => {
            await updateRender(dataView);
                // defaults
                const focusedStrokeWidth: string = "3px";
                const focusedStrokeOpacity: string = "1";
                const focusedOutline: string = "rgb(0, 0, 0) none 0px";
                const strokeWidth: string = "1px";
                const strokeOpacity: string = "0.6";
                const outline: string = "rgb(0, 0, 0) none 0px";

                const links: HTMLElement[] = [...visualBuilder.linkElements];

                links[0].focus();

                let linkComputedStyle: CSSStyleDeclaration = getComputedStyle(links[0]);
                let linkStrokeWidth: string = linkComputedStyle.getPropertyValue("stroke-width");
                let linkStrokeOpacity: string = linkComputedStyle.getPropertyValue("stroke-opacity");
                let linkOutline: string = linkComputedStyle.getPropertyValue("outline");

                expect(linkStrokeWidth).toBe(focusedStrokeWidth);
                expect(linkStrokeOpacity).toBe(focusedStrokeOpacity);
                expect(linkOutline).toBe(focusedOutline);

                const otherLinks: HTMLElement[] = links.slice(1);
                otherLinks.forEach((link: HTMLElement) => {
                    linkComputedStyle = getComputedStyle(link);
                    linkStrokeWidth = linkComputedStyle.getPropertyValue("stroke-width");
                    linkStrokeOpacity = linkComputedStyle.getPropertyValue("stroke-opacity");
                    linkOutline = linkComputedStyle.getPropertyValue("outline");

                    expect(linkStrokeWidth).toBe(strokeWidth);
                    expect(linkStrokeOpacity).toBe(strokeOpacity);
                    expect(linkOutline).toBe(outline);
                    expect(linkStrokeWidth < focusedStrokeWidth).toBe(true);
                });
        });

        it("nodes should have :focus-visible style", async () => {
            await updateRender(dataView);
            const nodeRects: HTMLElement[] = [...visualBuilder.nodeRectElements];

            nodeRects[0].focus();
            expect(nodeRects[0].matches(':focus-visible')).toBe(true);

            const otherNodeRects: HTMLElement[] = nodeRects.slice(1);
            otherNodeRects.forEach((nodeRect: HTMLElement) => {
                expect(nodeRect.matches(':focus-visible')).toBe(false);
            });
        });

        it("focused nodes should have styled stroke and outline", async () => {
            await updateRender(dataView);
                // defaults
                const focusedStrokeWidth: string = "4px";
                const focusedOutline: string = "rgb(0, 0, 0) none 0px";
                const strokeWidth: string = "1px";
                const outline: string = "rgb(0, 0, 0) none 0px";

                const nodeRects: HTMLElement[] = [...visualBuilder.nodeRectElements];

                nodeRects[0].focus();

                let nodeComputedStyle: CSSStyleDeclaration = getComputedStyle(nodeRects[0]);
                let nodeStrokeWidth: string = nodeComputedStyle.getPropertyValue("stroke-width");
                let nodeOutline: string = nodeComputedStyle.getPropertyValue("outline");
                expect(nodeStrokeWidth).toBe(focusedStrokeWidth);
                expect(nodeOutline).toBe(focusedOutline);

                const otherNodeRects: HTMLElement[] = nodeRects.slice(1);
                otherNodeRects.forEach((nodeRect: HTMLElement) => {
                    nodeComputedStyle = getComputedStyle(nodeRect);
                    nodeStrokeWidth = nodeComputedStyle.getPropertyValue("stroke-width");
                    nodeOutline = nodeComputedStyle.getPropertyValue("outline");
                    expect(nodeStrokeWidth).toBe(strokeWidth);
                    expect(nodeOutline).toBe(outline);
                    expect(nodeStrokeWidth < focusedStrokeWidth).toBe(true);
                });
        });
    });

    describe("high contrast mode test", () => {
        const backgroundColor: string = "#00ff00";
        const foregroundColor: string = "#ff00ff";


        beforeEach(() => {
            visualBuilder.visualHost.colorPalette.isHighContrast = true;

            visualBuilder.visualHost.colorPalette.background = { value: backgroundColor };
            visualBuilder.visualHost.colorPalette.foreground = { value: foregroundColor };

        });

        it("should not use fill style", async () => {
            await updateRender(dataView);
            // element.style.fill return "" when not initialized
            const nullColor = "";
            expect(isColorAppliedToElements([...visualBuilder.nodeElements], nullColor, "fill"));
            expect(isColorAppliedToElements([...visualBuilder.linkElements], nullColor, "fill"));
        });

        it("should use stroke style", async () => {
            await updateRender(dataView);
            expect(isColorAppliedToElements([...visualBuilder.nodeElements], foregroundColor, "stroke"));
            expect(isColorAppliedToElements([...visualBuilder.linkElements], foregroundColor, "stroke"));
        });

        it("should disable color slices in the formatting model", async () => {
            await updateRender(dataView);
            visualBuilder.instance.getFormattingModel();
            const settings: SankeyDiagramSettings = visualBuilder.instance.sankeyDiagramSettings;

            expect(settings.labels.fill.disabled).toBe(true);
            expect(settings.linkLabels.fill.disabled).toBe(true);
            expect(settings.links.defaultContainerItem.color.disabled).toBe(true);
            expect(settings.links.defaultContainerItem.border.color.disabled).toBe(true);
            expect(settings.nodes.defaultContainerItem.color.disabled).toBe(true);
        });
    });

    describe("high contrast mode settings", () => {
        const backgroundColor: string = "#00ff00";
        const foregroundColor: string = "#ff00ff";
        const colorDisabledReasonKey: string = "Visual_ColorDisabledDescription";

        const createColorHelper = (isHighContrast: boolean): ColorHelper => {
            const colorPalette = visualBuilder.visualHost.colorPalette;

            colorPalette.isHighContrast = isHighContrast;
            colorPalette.background = { value: backgroundColor };
            colorPalette.foreground = { value: foregroundColor };

            return new ColorHelper(colorPalette);
        };

        it("should disable color slices when high contrast mode is on", () => {
            const colorHelper: ColorHelper = createColorHelper(true);

            const labels: DataLabelsSettings = new DataLabelsSettings();
            const linkLabels: LinkLabelsSettings = new LinkLabelsSettings();
            const linkOutline: LinkOutlineSettings = new LinkOutlineSettings();
            const linkColor: LinkColorContainerItem = new LinkColorContainerItem();
            const nodes: NodesSettings = new NodesSettings();

            labels.handleHighContrastMode(colorHelper);
            linkLabels.handleHighContrastMode(colorHelper);
            linkOutline.handleHighContrastMode(colorHelper);
            linkColor.handleHighContrastMode(colorHelper);
            nodes.handleHighContrastMode(colorHelper);

            expect(labels.fill.disabled).toBe(true);
            expect(labels.fill.disabledReasonKey).toBe(colorDisabledReasonKey);
            expect(linkLabels.fill.disabled).toBe(true);
            expect(linkOutline.color.disabled).toBe(true);
            expect(linkOutline.color.disabledReasonKey).toBe(colorDisabledReasonKey);
            expect(linkColor.color.disabled).toBe(true);
            expect(linkColor.border.color.disabled).toBe(true);
            expect(nodes.defaultContainerItem.color.disabled).toBe(true);
        });

        it("should not disable color slices when high contrast mode is off", () => {
            const colorHelper: ColorHelper = createColorHelper(false);

            const labels: DataLabelsSettings = new DataLabelsSettings();
            const linkLabels: LinkLabelsSettings = new LinkLabelsSettings();
            const linkOutline: LinkOutlineSettings = new LinkOutlineSettings();
            const linkColor: LinkColorContainerItem = new LinkColorContainerItem();
            const nodes: NodesSettings = new NodesSettings();

            labels.handleHighContrastMode(colorHelper);
            linkLabels.handleHighContrastMode(colorHelper);
            linkOutline.handleHighContrastMode(colorHelper);
            linkColor.handleHighContrastMode(colorHelper);
            nodes.handleHighContrastMode(colorHelper);

            expect(labels.fill.disabled).toBeFalsy();
            expect(linkLabels.fill.disabled).toBeFalsy();
            expect(linkOutline.color.disabled).toBeFalsy();
            expect(linkColor.color.disabled).toBeFalsy();
            expect(linkColor.border.color.disabled).toBeFalsy();
            expect(nodes.defaultContainerItem.color.disabled).toBeFalsy();
        });

        // guards against reading the disabled flag back from an unrelated property such as visible
        it("should preserve an existing disabled state when high contrast mode is off", () => {
            const colorHelper: ColorHelper = createColorHelper(false);

            const labels: DataLabelsSettings = new DataLabelsSettings();
            const linkOutline: LinkOutlineSettings = new LinkOutlineSettings();
            const linkColor: LinkColorContainerItem = new LinkColorContainerItem();
            const nodes: NodesSettings = new NodesSettings();

            labels.fill.disabled = true;
            linkOutline.color.disabled = true;
            linkColor.color.disabled = true;
            linkColor.border.color.disabled = true;
            nodes.defaultContainerItem.color.disabled = true;

            labels.handleHighContrastMode(colorHelper);
            linkOutline.handleHighContrastMode(colorHelper);
            linkColor.handleHighContrastMode(colorHelper);
            nodes.handleHighContrastMode(colorHelper);

            expect(labels.fill.disabled).toBe(true);
            expect(linkOutline.color.disabled).toBe(true);
            expect(linkColor.color.disabled).toBe(true);
            expect(linkColor.border.color.disabled).toBe(true);
            expect(nodes.defaultContainerItem.color.disabled).toBe(true);
        });

        it("should not disable color slices in the formatting model when high contrast mode is off", async () => {
            createColorHelper(false);

            await updateRender(dataView);
            visualBuilder.instance.getFormattingModel();
            const settings: SankeyDiagramSettings = visualBuilder.instance.sankeyDiagramSettings;

            expect(settings.labels.fill.disabled).toBeFalsy();
            expect(settings.linkLabels.fill.disabled).toBeFalsy();
            expect(settings.links.defaultContainerItem.color.disabled).toBeFalsy();
            expect(settings.links.defaultContainerItem.border.color.disabled).toBeFalsy();
            expect(settings.nodes.defaultContainerItem.color.disabled).toBeFalsy();
        });
    });

});