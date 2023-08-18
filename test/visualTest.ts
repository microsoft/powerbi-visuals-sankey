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
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

// powerbi
import DataView = powerbi.DataView;
import FormattingSettingsCard = formattingSettings.Card;

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
} from "powerbi-visuals-utils-testutils";

import {
    isColorAppliedToElements
} from "./helpers/helpers";

import { DataLabelsSettings, LinkLabelsSettings, SankeyDiagramSettings } from "../src/settings";


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

    beforeEach(() => {
        visualBuilder = new VisualBuilder(1000, 500);

        defaultDataViewBuilder = new SankeyDiagramData();
        dataView = defaultDataViewBuilder.getDataView();

        visualInstance = visualBuilder.instance;
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

    describe("sortNodesByX", () => {
        it("nodes should be sorted correctly", () => {
            let xValues: number[],
                nodes: SankeyDiagramNode[];

            xValues = [42, 13, 52, 182, 1e25, 1, 6, 3, 4];

            nodes = createNodes(xValues);

            xValues.sort((x: number, y: number) => {
                return x - y;
            });

            VisualClass.sortNodesByX(nodes).forEach((node: SankeyDiagramNode, index: number) => {
                expect(node.x).toBe(xValues[index]);
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
                    links: [],
                    x: xValue,
                    y: 0,
                    width: 0,
                    height: 0,
                    colour: "",
                    selectionIds: [],
                    tooltipData: [],
                    identity: null,
                    selected: false
                };
            });
        }
    });

    describe("getColumns", () => {
        it("getColumns", () => {
            let testNodes: SankeyDiagramTestsNode[];

            testNodes = [
                { x: 0, inputWeight: 15, outputWeight: 14 },
                { x: 1, inputWeight: 10, outputWeight: 5 },
                { x: 2, inputWeight: 15, outputWeight: 13 },
                { x: 3, inputWeight: 42, outputWeight: 28 }
            ];

            visualInstance.getColumns(createNodes(testNodes))
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
                    links: [],
                    x: testNode.x,
                    y: 0,
                    width: 0,
                    height: 0,
                    colour: "",
                    selectionIds: [],
                    tooltipData: [],
                    identity: null,
                    selected: false
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

        it("number of displayed links should match the dataView", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
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

                done();
            });
        });


        it("update without weight values should display nodes", (done) => {

            dataView = defaultDataViewBuilder.getDataViewWithoutValues();
            visualBuilder.updateRenderTimeout(dataView, () => {
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

                done();
            });
        });


        it("node labels should display when labels: { show: true }", (done) => {
            dataView.metadata.objects = {
                labels: {
                    show: true
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                const display: string = window.getComputedStyle(
                    visualBuilder.nodesElement.querySelector("text")
                ).display

                expect(display).toBe("block");

                done();
            });
        });


        it("node labels should not display when labels: { show: false } off", (done) => {
            dataView.metadata.objects = {
                labels: {
                    show: false
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                const display: string = window.getComputedStyle(
                    visualBuilder.nodesElement.querySelector("text")
                ).display

                expect(display).toBe("none");

                done();
            });
        });


        it("nodes labels should change color", (done) => {
            const color: string = "#123123";

            dataView.metadata.objects = {
                labels: {
                    fill: { solid: { color } }
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                const fill: string = window.getComputedStyle(
                    visualBuilder.nodesElement.querySelector("text")
                ).fill

                assertColorsMatch(fill, color);
                done();
            });
        });


        it("links should change color", done => {
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


            visualBuilder.updateRenderTimeout(dataView, () => {
                const someLink = visualBuilder.linksElement.querySelector("path.link");
                const currentColor: string = window.getComputedStyle(someLink).stroke;

                assertColorsMatch(currentColor, color);

                done();
            });
        });


        it("nodes labels are not overlapping", done => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                const nodeElements: HTMLElement[] = [...visualBuilder.nodeElements];
                const firstNode: string = nodeElements[0].querySelector("text").innerHTML
                const secondNode: string = nodeElements[1].querySelector("text").innerHTML
                const thirdNode: string = nodeElements[2].querySelector("text").innerHTML

                expect(firstNode).toBe("Brazil");
                expect(secondNode).toBe("USA");
                expect(thirdNode).toBe("Mexico");

                done();
            });
        });


        describe("selection and deselection", () => {
            const selectionClass: string = "selected";
            it("nodes", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const node: HTMLElement = visualBuilder.nodeElements[0];
                    const firstNodeLinksCount: number = 4;
                    const link: NodeListOf<HTMLElement> = visualBuilder.linkElements;
                    const selectedNodesBeforeClick = [...visualBuilder.nodeElements].filter(node => node.classList.value.includes(selectionClass));
                    expect(selectedNodesBeforeClick.length).toBe(0);
                    // expect(selectedNodes).not.toBeInDOM();
                    clickElement(node);
                    renderTimeout(() => {
                        const selectedNodesAfterClick = [...visualBuilder.nodeElements].filter(node => node.classList.value.includes(selectionClass));
                        expect(selectedNodesAfterClick.length).not.toBe(0);
                        // expect(visualBuilder.nodeElements.filter(selectionClass)).toBeInDOM();
                        expect(selectedNodesAfterClick).toBeDefined();
                        // when node selected, links of node also must be selected
                        expect([...visualBuilder.linkElements].filter(link => link.classList.value.includes(selectionClass)).length).toBe(firstNodeLinksCount);

                        clickElement(node);
                        renderTimeout(() => {
                            expect([...visualBuilder.nodeElements].filter(node => node.classList.value.includes(selectionClass)).length).toBe(0);
                            done();
                        });
                    });
                });
            });


            it("links", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const link: HTMLElement = visualBuilder.linkElements[0];
                    expect([...visualBuilder.linkElements].filter(link => link.classList.value.includes(selectionClass)).length).toBe(0);
                    clickElement(link);

                    renderTimeout(() => {
                        // link is selected and in DOM
                        expect(link).toBeDefined();
                        expect(link.classList).toContain(selectionClass);
                        // selected link is the only one that is selected
                        expect([...visualBuilder.linkElements].filter(link => link.classList.value.includes(selectionClass)).length).toBe(1);


                        clickElement(link);
                        renderTimeout(() => {
                            // no links selected
                            expect([...visualBuilder.linkElements].filter(link => link.classList.value.includes(selectionClass)).length).toBe(0);
                            done();
                        });
                    });
                });
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
            it("negative and zero values", done => {
                let dataLength: number = defaultDataViewBuilder.valuesSourceDestination.length,
                    groupLength = Math.floor(dataLength / 3) - 2,
                    negativeValues = getRandomNumbers(groupLength, -100, 0),
                    zeroValues = new Array(groupLength).fill(0),
                    positiveValues = getRandomNumbers(
                        dataLength - negativeValues.length - zeroValues.length, 1, 100);

                const valuesValue = negativeValues.concat(zeroValues).concat(positiveValues);

                visualBuilder.updateRenderTimeout([defaultDataViewBuilder.getDataView()], () => {
                    expect(visualBuilder.linkElements.length).toBe(valuesValue.length);

                    done();
                });
            });
        });

        describe("self links", () => {
            it("must exist", done => {
                visualBuilder.updateRenderTimeout([defaultDataViewBuilder.getDataView()], () => {
                    let transformedData: SankeyDiagramDataView = visualBuilder.instance.converter(dataView);

                    let links: SankeyDiagramLink[] = transformedData.links.filter((link: SankeyDiagramLink, index: number) => {
                        if (link.source.label.name.match(/\**_SK_SELFLINK/)) {
                            return true;
                        }
                        return false;
                    });

                    expect(links.length).toBeGreaterThan(0);

                    done();
                });
            });
        });

        describe("cycles in graph", () => {
            it("must have two nodes with same label", done => {
                visualBuilder.updateRenderTimeout([defaultDataViewBuilder.getDataView()], () => {
                    let transformedData: SankeyDiagramDataView = visualBuilder.instance.converter(dataView);
                    let links: SankeyDiagramLink[] = transformedData.links.filter((link) => link.source.label.formattedName === link.destination.label.formattedName);
                    expect(links.length).toBeGreaterThan(0);

                    done();
                });
            });
        });

        describe("0-1 values in graph", () => {
            it("must give positive weigth of links", done => {
                const expectedLinksCount = 3;
                let dataView: DataView = defaultDataViewBuilder.getDataViewWithLowValue();
                visualBuilder.updateRenderTimeout([dataView], () => {
                    let linksCount = visualBuilder.linksElement.childElementCount;
                    expect(linksCount).toBe(expectedLinksCount);
                    done();
                });
            });
        });

        describe("datalabels", () => {
            it("must be rendered", done => {
                let dataView: DataView = defaultDataViewBuilder.getDataViewWithLowValue();

                dataView.metadata.objects = {
                    linkLabels: {
                        show: true
                    }
                };

                visualBuilder.updateRenderTimeout([dataView], () => {
                    expect(visualBuilder.mainElement.querySelectorAll(".linkLabelTexts")).toBeDefined();
                    done();
                });
            });
        });

        describe("nodes", () => {
            it("must be dragged and the displayed correctly", done => {
                let dataView: DataView = defaultDataViewBuilder.getDataView();
                visualBuilder.updateRenderTimeout([dataView], () => {
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

                    done();
                });
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
        it("the visual must provide min height of node", done => {
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

            visualBuilder.updateRenderTimeout(dataView, () => {
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
                done();
            });
        });

        it("the visual must not provide min height of node", done => {
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

            visualBuilder.updateRenderTimeout([dataView], () => {
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
                done();
            });
        });
    });


    describe("Settings tests:", () => {
        it("nodeComplexSettings properties must be hidden", done => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                visualBuilder.instance.getFormattingModel();
                expect(visualBuilder.instance.sankeyDiagramSettings.cards.some((card: FormattingSettingsCard) => card.displayName === "Node Complex Settings")).toBeFalse();
                done();
            });
        });

        it("other properties must exist", done => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                // defaults
                const someColor: string = "#000000";
                const fontSize: number = 12;
                const unit: number = 0;

                visualBuilder.instance.getFormattingModel();

                let labels: DataLabelsSettings = visualBuilder.instance.sankeyDiagramSettings.labels;

                expect(labels.slices.length).toBe(6);
                expect(labels.show.value).toBeTruthy();
                expect(labels.fontSize.value).toBe(fontSize);
                expect(labels.forceDisplay.value).toBeFalsy();
                expect(labels.unit.value).toBe(unit);
                expect(labels.fill.value.value).toBe(someColor);

                let linkLabels: LinkLabelsSettings = visualBuilder.instance.sankeyDiagramSettings.linkLabels;

                expect(linkLabels.slices.length).toBe(3);
                expect(linkLabels.show.value).toBeFalsy();
                expect(linkLabels.fontSize.value).toBe(fontSize);
                expect(linkLabels.fill.value.value).toBe(someColor);

                let scaleSettings = visualBuilder.instance.sankeyDiagramSettings.scale;

                expect(scaleSettings.slices.length).toBe(2);
                expect(scaleSettings.provideMinHeight.value).toBeTruthy();
                expect(scaleSettings.lnScale.value).toBeFalsy();

                expect(visualBuilder.instance.sankeyDiagramSettings.cards.length).toBe(6);
                done();
            });
        });
    });

    describe("Capabilities tests", () => {
        it("all items having displayName should have displayNameKey property", () => {
            let r = fetch("base/capabilities.json");
            let jsonData = JSON.stringify(r);

            let objectsChecker: Function = (obj) => {
                for (let property of Object.keys(obj)) {
                    let value: any = obj[property];

                    if (value.displayName) {
                        expect(value.displayNameKey).toBeDefined();
                    }

                    if (typeof value === "object") {
                        objectsChecker(value);
                    }
                }
            };

            objectsChecker(jsonData);
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

        it("should not use fill style", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                // element.style.fill return "" when not initialized
                const nullColor = "";
                expect(isColorAppliedToElements([...visualBuilder.nodeElements], nullColor, "fill"));
                expect(isColorAppliedToElements([...visualBuilder.linkElements], nullColor, "fill"));
                done();
            });
        });

        it("should use stroke style", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(isColorAppliedToElements([...visualBuilder.nodeElements], foregroundColor, "stroke"));
                expect(isColorAppliedToElements([...visualBuilder.linkElements], foregroundColor, "stroke"));
                done();
            });
        });
    });

});