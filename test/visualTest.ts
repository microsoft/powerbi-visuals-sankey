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

// powerbi
import DataView = powerbi.DataView;
import PrimitiveValue = powerbi.PrimitiveValue;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;

// powerbi.extensibility.visual.test
import { SankeyDiagramData } from "./sankeydiagramdata";
import { SankeyDiagramBuilder } from "./sankeydiagrambuilder";

// powerbi.extensibility.visual.SankeyDiagram1446463184954
import {
    SankeyDiagram as VisualClass
}
    from "../src/sankeydiagram";

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

import * as _ from "lodash-es";
import * as $ from "jquery";

interface SankeyDiagramTestsNode {
    x: number;
    inputWeight: number;
    outputWeight: number;
}

// tslint:disable-next-line: no-function-expression
let fireMouseEvent = function (type, elem, centerX, centerY) {
    let evt = document.createEvent('MouseEvents');
    evt.initMouseEvent(type, true, true, window, 1, 1, 1, centerX, centerY, false, false, false, false, 0, elem);
    elem.dispatchEvent(evt);
};

describe("SankeyDiagram", () => {
    let visualBuilder: SankeyDiagramBuilder,
        visualInstance: VisualClass,
        defaultDataViewBuilder: SankeyDiagramData,
        dataView: DataView;

    beforeEach(() => {
        visualBuilder = new SankeyDiagramBuilder(1000, 500);

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
                    tooltipData: []
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
            expect(visualBuilder.mainElement[0]).toBeInDOM();
        });

        it("update", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                const sourceCategories: PrimitiveValue[] = dataView.categorical.categories[0].values,
                    destinationCategories: PrimitiveValue[] = dataView.categorical.categories[1].values;

                expect(visualBuilder.linksElement).toBeInDOM();
                expect(visualBuilder.linkElements.length).toBe(sourceCategories.length);

                let nodes: SankeyDiagramNode[] = visualBuilder.instance
                    .converter(dataView)
                    .nodes
                    .filter((node: SankeyDiagramNode) => {
                        if (node.links.length > 0) {
                            return true;
                        }

                        return false;
                    });

                expect(visualBuilder.nodesElement).toBeInDOM();
                expect(visualBuilder.nodeElements.length).toEqual(nodes.length);

                done();
            });
        });

        it("update without weight values", (done) => {
            dataView.categorical.values = undefined;
            visualBuilder.updateRenderTimeout(dataView, () => {
                const sourceCategories: PrimitiveValue[] = dataView.categorical.categories[0].values,
                    destinationCategories: PrimitiveValue[] = dataView.categorical.categories[1].values;

                expect(visualBuilder.linksElement).toBeInDOM();
                expect(visualBuilder.linkElements.length).toBe(sourceCategories.length);

                let nodes: SankeyDiagramNode[] = visualBuilder.instance
                    .converter(dataView)
                    .nodes
                    .filter((node: SankeyDiagramNode) => {
                        if (node.links.length > 0) {
                            return true;
                        }

                        return false;
                    });

                expect(visualBuilder.nodesElement).toBeInDOM();
                expect(visualBuilder.nodeElements.length).toEqual(nodes.length);

                done();
            });
        });

        it("nodes labels on", (done) => {
            dataView.metadata.objects = {
                labels: {
                    show: true
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                const display: string = visualBuilder.nodesElement
                    .find("text")
                    .first()
                    .css("display");

                expect(display).toBe("block");

                done();
            });
        });

        it("nodes labels off", (done) => {
            dataView.metadata.objects = {
                labels: {
                    show: false
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                const display: string = visualBuilder.nodesElement
                    .find("text")
                    .first()
                    .css("display");

                expect(display).toBe("none");

                done();
            });
        });

        it("nodes labels change color", (done) => {
            const color: string = "#123123";

            dataView.metadata.objects = {
                labels: {
                    fill: { solid: { color } }
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                const fill: string = visualBuilder.nodesElement
                    .find("text")
                    .first()
                    .css("fill");

                assertColorsMatch(fill, color);
                done();
            });
        });

        it("link change color", done => {
            const color: string = "#E0F600";

            // change colors for all links
            for (let index of Object.keys(dataView.categorical.categories)) {
                let category = dataView.categorical.categories[index];
                category.objects = [];
                for (let valIndex of category.values) {
                    category.objects.push({
                        links: {
                            fill: { solid: { color } }
                        }
                    });
                }
            }

            visualBuilder.updateRenderTimeout(dataView, () => {
                const currentColor: string = visualBuilder.linksElement
                    .find(".link")
                    .first()
                    .css("stroke");

                assertColorsMatch(currentColor, color);

                done();
            });
        });

        it("nodes labels are not overlapping", done => {

            visualBuilder.updateRenderTimeout(dataView, () => {
                const textElement: JQuery = visualBuilder.nodesElement.find("text"),
                    firstNode: string = textElement.first().text(),
                    secondNode: string = textElement.last().text(),
                    thirdNode: string = textElement.eq(4).text();

                expect(firstNode).toBe("Brazil");
                expect(secondNode).toBe("Angola");
                expect(thirdNode).toBe("France");

                done();
            });
        });

        describe("selection and deselection", () => {
            const selectionSelector: string = ".selected";

            it("nodes", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const node: JQuery = visualBuilder.nodeElements.first();
                    const firstNodeLinksCount: number = 4;
                    const link: JQuery = visualBuilder.linkElements;

                    expect(visualBuilder.nodeElements.filter(selectionSelector)).not.toBeInDOM();
                    clickElement(node);

                    renderTimeout(() => {
                        expect(node.filter(selectionSelector)).not.toBeInDOM();
                        expect(visualBuilder.nodeElements.filter(selectionSelector)).toBeInDOM();
                        // when node selected, links of node also must be selected
                        expect(visualBuilder.linkElements.filter(selectionSelector).length).toBe(firstNodeLinksCount);

                        clickElement(node);
                        renderTimeout(() => {
                            expect(visualBuilder.nodeElements.filter(selectionSelector)).not.toBeInDOM();

                            done();
                        });
                    });
                });
            });

            it("links", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const link: JQuery = visualBuilder.linkElements.first();

                    expect(visualBuilder.linkElements.filter(selectionSelector)).not.toBeInDOM();
                    clickElement(link);

                    renderTimeout(() => {
                        expect(link.filter(selectionSelector)).toBeInDOM();
                        expect(visualBuilder.linkElements.not(link).filter(selectionSelector)).not.toBeInDOM();

                        clickElement(link);
                        renderTimeout(() => {
                            expect(visualBuilder.linkElements.filter(selectionSelector)).not.toBeInDOM();
                            done();
                        });
                    });
                });
            });

            it("multi-selection test", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                let firstGroup: JQuery = visualBuilder.linkElements.eq(0),
                    secondGroup: JQuery = visualBuilder.linkElements.eq(1),
                    thirdGroup: JQuery = visualBuilder.linkElements.eq(2);

                clickElement(firstGroup);
                clickElement(secondGroup, true);

                expect(firstGroup.is(selectionSelector)).toBeTruthy();
                expect(secondGroup.is(selectionSelector)).toBeTruthy();
                expect(thirdGroup.is(selectionSelector)).toBeFalsy();
            });
        });

        describe("data rendering", () => {
            it("negative and zero values", done => {
                let dataLength: number = defaultDataViewBuilder.valuesSourceDestination.length,
                    groupLength = Math.floor(dataLength / 3) - 2,
                    negativeValues = getRandomNumbers(groupLength, -100, 0),
                    // tslint:disable-next-line: underscore-consistent-invocation
                    zeroValues = _.range(0, groupLength, 0),
                    positiveValues = getRandomNumbers(
                        dataLength - negativeValues.length - zeroValues.length, 1, 100);

                defaultDataViewBuilder.valuesValue = negativeValues.concat(zeroValues).concat(positiveValues);

                visualBuilder.updateRenderTimeout([defaultDataViewBuilder.getDataView()], () => {
                    expect(visualBuilder.linkElements.length).toBe(defaultDataViewBuilder.valuesValue.length);

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
                const firstElement = 0;
                const expectedLinksCount = 3;
                let dataView: DataView = defaultDataViewBuilder.getDataViewWithLowValue();
                visualBuilder.updateRenderTimeout([dataView], () => {
                    let linksCount = visualBuilder.linksElement[firstElement].childElementCount;
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
                    expect($(visualBuilder.mainElement.find(".linkLabelTexts"))).toBeInDOM();
                    done();
                });
            });
        });

        describe("nodes", () => {
            it("must be dragged", done => {
                let dataView: DataView = defaultDataViewBuilder.getDataView();

                visualBuilder.updateRenderTimeout([dataView], () => {
                    let nodeToDrag = visualBuilder.nodeElements[0];

                    let pos = nodeToDrag.getBoundingClientRect();
                    let center1X = Math.floor((pos.left + pos.right) / 2);
                    let center1Y = Math.floor((pos.top + pos.bottom) / 2);

                    // user second node as target
                    let anotherNode = visualBuilder.nodeElements[1];
                    pos = anotherNode.getBoundingClientRect();
                    let center2X = Math.floor((pos.left + pos.right) / 2);
                    let center2Y = Math.floor((pos.top + pos.bottom) / 2);

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

                    pos = nodeToDrag.getBoundingClientRect();
                    center1X = Math.floor((pos.left + pos.right) / 2);
                    center1Y = Math.floor((pos.top + pos.bottom) / 2);

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
                    expect((<any>nodeToDrag).getBoundingClientRect().left).toBeLessThan(20);
                    expect((<any>nodeToDrag).getBoundingClientRect().top).toBeLessThan(40);

                    // drag to outside of viewport
                    // mouse over dragged element and mousedown
                    fireMouseEvent('dragstart', nodeToDrag, center1X, center1Y);
                    fireMouseEvent('drag', nodeToDrag, center1X, center1Y);
                    fireMouseEvent('mousemove', nodeToDrag, center1X, center1Y);
                    fireMouseEvent('drag', nodeToDrag, visualBuilder.viewport.width + 10, visualBuilder.viewport.height + 10);
                    fireMouseEvent('mousemove', nodeToDrag, visualBuilder.viewport.width + 10, visualBuilder.viewport.height + 10);
                    fireMouseEvent('dragend', nodeToDrag, visualBuilder.viewport.width + 10, visualBuilder.viewport.height + 10);

                    // positions must match after drag and drop
                    expect((<any>nodeToDrag).getBoundingClientRect().right).toBeGreaterThan(visualBuilder.viewport.width - 20);
                    expect((<any>nodeToDrag).getBoundingClientRect().bottom).toBeGreaterThan(visualBuilder.viewport.height - 20);

                    // call private methods
                    (<any>visualBuilder.instance).saveLinkPositions((<any>visualBuilder.instance).dataView.links);
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

            expect(VisualClass.createLink(link)).toBe("_Source-0-_Destination");
            expect(VisualClass.createLink(link, true)).toBe("linkLabelPaths_Source-0-_Destination");
        });
    });

    describe("Node pinning settings test:", () => {
        it("the visual does not change node positions", () => {
            let dataView: DataView = defaultDataViewBuilder.getDataView();
            dataView.metadata.objects = {
                general: {
                    pinNodes: false
                }
            };
            // when the pinNodes setting is on
            // filter apply generates new data and causes node position recalculation
            let nodesBeforeFiltering: SankeyDiagramNode[] = [];
            let nodesAfterFiltering: SankeyDiagramNode[] = [];
            visualBuilder.update(dataView);
            nodesBeforeFiltering = (<any>visualBuilder).visual.dataView.nodes;

            // filter simulation via data array slicing
            let defaultData = defaultDataViewBuilder.getSourceDestination().slice(0, 4);
            defaultDataViewBuilder.setData(defaultData);
            dataView = defaultDataViewBuilder.getDataView();



            visualBuilder.update(dataView);
            nodesAfterFiltering = (<any>visualBuilder).visual.dataView.nodes;
            // guarantee that nodes were recalculated when data changed
            nodesAfterFiltering.forEach(node => {
                expect(nodesBeforeFiltering.some(nodeBeforeFiltering =>
                    nodeBeforeFiltering.x === node.x &&
                    nodeBeforeFiltering.y === node.y &&
                    nodeBeforeFiltering.height === node.height))
                    .toBe(false);
            });
        });

        it("the visual saves node positions", () => {
            let dataView: DataView = defaultDataViewBuilder.getDataView();
            dataView.metadata.objects = {
                general: {
                    pinNodes: true
                }
            };
            // when the pinNodes setting is on
            // filter apply generates new data and causes node position recalculation
            let nodesBeforeFiltering: SankeyDiagramNode[] = [];
            let nodesAfterFiltering: SankeyDiagramNode[] = [];
            visualBuilder.update(dataView);
            // defaultDataViewBuilder = new SankeyDiagramData();
            nodesBeforeFiltering = (<any>visualBuilder).visual.dataView.nodes;

            // filter simulation via data array slicing
            let defaultData = defaultDataViewBuilder.getSourceDestination().slice(0, 4);
            defaultDataViewBuilder.setData(defaultData);
            const savedSettings = visualBuilder.getPropertyInstances();
            const objects = {
                general: {
                    pinNodes: true
                },
                // cyclesLinks: {
                //     drawCycles: 1
                // },
                nodeComplexSettings: {
                    appState: savedSettings.properties.appState,
                    columns: savedSettings.properties.columns
                }
            };
            dataView = defaultDataViewBuilder.getDataView();
            dataView.metadata.objects = objects;
            visualBuilder.update(dataView);
            nodesAfterFiltering = (<any>visualBuilder).visual.dataView.nodes;
            // guarantee that nodes were recalculated when data changed
            nodesAfterFiltering.forEach(node => {
                let found: boolean = nodesBeforeFiltering.some(nodeBeforeFiltering =>
                    nodeBeforeFiltering.x === node.x &&
                    nodeBeforeFiltering.y === node.y);
                expect(found)
                    .toBe(true);
            });
        });
    });

    describe("Postupdate render options test:", () => {
        it("the visual keeps render data on subsequent updates", () => {
            let dataView: DataView = defaultDataViewBuilder.getDataViewWithLowValue();
            visualBuilder.update([dataView]);
            visualBuilder.update([dataView]);
            let links = (<any>visualBuilder).visual.dataView.links;
            links.forEach(link => {
                expect(link.display).toBe(true);
            });
        });

        it("the visual renders data on subsequent updates", () => {
            let dataView: DataView = defaultDataViewBuilder.getDataViewWithLowValue();
            let linksOnInit = [];
            let linksAfterUpdate = [];
            visualBuilder.update([dataView]);
            linksOnInit = (<any>visualBuilder).visual.links._groups[0][0].children;
            visualBuilder.update([dataView]);
            linksAfterUpdate = (<any>visualBuilder).visual.links._groups[0][0].children;
            let links = (<any>visualBuilder).visual.dataView.links;
            // check for data display properties
            links.forEach(element => {
                expect(element.display).toBe(true);
            });
            // check for DOM element properties
            [...linksAfterUpdate].forEach(link => {
                expect(link.style.display).toBe("");
                let foundElement = [...linksOnInit].find(linkOnInit => linkOnInit === link);
                let found = false;
                if (foundElement) {
                    found = true;
                }
                expect(found).toBe(true);
            });
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

            // the dataset has significantly different range of values
            // the visual must provide min height of node
            dataView.categorical.values[firstElement].values[0] = 1;
            dataView.categorical.values[firstElement].values[1] = 1;
            dataView.categorical.values[firstElement].values[2] = 1000000;

            visualBuilder.updateRenderTimeout([dataView], () => {
                const minHeightOfNode: number = 5;
                let nodes = visualBuilder.nodeElements;

                let minHeight: number = +nodes[firstElement].children[firstElement].getAttribute("height");
                nodes.each((index: number, el: HTMLElement) => {
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
            dataView.categorical.values[firstElement].values[0] = 1;
            dataView.categorical.values[firstElement].values[1] = 1;
            dataView.categorical.values[firstElement].values[2] = 1000000;

            visualBuilder.updateRenderTimeout([dataView], () => {
                const minHeightOfNode: number = 5;
                let nodes = visualBuilder.nodeElements;

                let minHeight: number = +nodes[firstElement].children[firstElement].getAttribute("height");
                nodes.each((index: number, el: HTMLElement) => {
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
        it("nodeComplexSettings properties must be hidden", () => {
            let objectInstanes: VisualObjectInstanceEnumerationObject = <VisualObjectInstanceEnumerationObject>visualBuilder.instance.enumerateObjectInstances({
                objectName: "nodeComplexSettings"
            });

            expect(objectInstanes.instances.length).toBe(0);
        });

        it("other properties must exist", () => {
            // defaults
            const instance: number = 0;
            const someColor: string = "black";
            const fontSize: number = 12;
            const unit: number = 0;
            dataView.metadata.objects = {
                labels: {
                    show: true,
                    fill: { solid: { color: someColor } },
                    fontSize: fontSize,
                    forceDisplay: false,
                    unit: unit
                },
                linkLabels: {
                    show: false,
                    fill: { solid: { color: someColor } },
                    fontSize: fontSize,
                },
                scaleSettings: {
                    provideMinHeight: true,
                    lnScale: true,
                },
                nodeComplexSettings: {
                    nodePositions: "",
                    viewportSize: ""
                }
            };

            let labels: VisualObjectInstanceEnumerationObject = (<VisualObjectInstanceEnumerationObject>visualBuilder
                .instance.enumerateObjectInstances({
                    objectName: "labels"
                }));

            expect(labels.instances.length).toBe(1);
            expect(labels.instances[instance].properties["show"]).toBeTruthy();
            expect(labels.instances[instance].properties["fontSize"]).toBe(fontSize);
            expect(labels.instances[instance].properties["forceDisplay"]).toBeFalsy();
            expect(labels.instances[instance].properties["unit"]).toBe(unit);
            expect(labels.instances[instance].properties["fill"]).toBe(someColor);

            let linkLabels: VisualObjectInstanceEnumerationObject = (<VisualObjectInstanceEnumerationObject>visualBuilder
                .instance.enumerateObjectInstances({
                    objectName: "linkLabels"
                }));
            expect(linkLabels.instances.length).toBe(1);
            expect(linkLabels.instances[instance].properties["show"]).toBeFalsy();
            expect(linkLabels.instances[instance].properties["fontSize"]).toBe(fontSize);
            expect(linkLabels.instances[instance].properties["fill"]).toBe(someColor);

            let scaleSettings: VisualObjectInstanceEnumerationObject = (<VisualObjectInstanceEnumerationObject>visualBuilder
                .instance.enumerateObjectInstances({
                    objectName: "scaleSettings"
                }));
            expect(scaleSettings.instances.length).toBe(1);
            expect(scaleSettings.instances[instance].properties["provideMinHeight"]).toBeTruthy();
            expect(scaleSettings.instances[instance].properties["lnScale"]).toBeFalsy();
        });
    });

    describe("Capabilities tests", () => {
        it("all items having displayName should have displayNameKey property", () => {
            jasmine.getJSONFixtures().fixturesPath = "base";

            let jsonData = getJSONFixture("capabilities.json");

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
        const backgroundColor: string = "#000000";
        const foregroundColor: string = "#ff00ff";

        let nodeElements: JQuery[],
            linkElements: JQuery[];

        beforeEach(() => {
            visualBuilder.visualHost.colorPalette.isHighContrast = true;

            visualBuilder.visualHost.colorPalette.background = { value: backgroundColor };
            visualBuilder.visualHost.colorPalette.foreground = { value: foregroundColor };

            nodeElements = <any>visualBuilder.nodeElements.toArray().map($);
            linkElements = <any>visualBuilder.linkElements.toArray().map($);
        });

        it("should not use fill style", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(isColorAppliedToElements(nodeElements, null, "fill"));
                expect(isColorAppliedToElements(linkElements, null, "fill"));
                done();
            });
        });

        it("should use stroke style", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(isColorAppliedToElements(nodeElements, foregroundColor, "stroke"));
                expect(isColorAppliedToElements(linkElements, foregroundColor, "stroke"));
                done();
            });
        });
    });
});

