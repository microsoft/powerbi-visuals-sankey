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

module powerbi.extensibility.visual {
    // d3
    import Selection = d3.Selection;
    import UpdateSelection = d3.selection.Update;

    // jsCommon
    import ClassAndSelector = jsCommon.CssConstants.ClassAndSelector;
    import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;
    import pixelConverterFromPoint = jsCommon.PixelConverter.fromPoint;

    // powerbi
    import TextMeasurementService = powerbi.TextMeasurementService;
    import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
    import IVisual = powerbi.IVisual;
    import VisualCapabilities = powerbi.VisualCapabilities;
    import VisualDataRoleKind = powerbi.VisualDataRoleKind;
    import IDataColorPalette = powerbi.IDataColorPalette;
    import IViewport = powerbi.IViewport;
    import TextProperties = powerbi.TextProperties;
    import VisualInitOptions = powerbi.VisualInitOptions;
    import IVisualStyle = powerbi.IVisualStyle;
    import VisualUpdateOptions = powerbi.VisualUpdateOptions;
    import DataView = powerbi.DataView;
    import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
    import DataViewValueColumn = powerbi.DataViewValueColumn;
    import DataViewObjects = powerbi.DataViewObjects;
    import DataViewScopeIdentity = powerbi.DataViewScopeIdentity;
    import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
    import VisualObjectInstance = powerbi.VisualObjectInstance;
    import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;

    // powerbi.visuals
    import ValueFormatter = powerbi.visuals.valueFormatter;
    import IMargin = powerbi.visuals.IMargin;
    import TooltipDataItem = powerbi.visuals.TooltipDataItem;
    import SelectionId = powerbi.visuals.SelectionId;
    import DataColorPalette = powerbi.visuals.DataColorPalette;
    import SVGUtil = powerbi.visuals.SVGUtil;
    import IValueFormatter = powerbi.visuals.IValueFormatter;
    import ColorHelper = powerbi.visuals.ColorHelper;
    import TooltipManager = powerbi.visuals.TooltipManager;
    import TooltipEvent = powerbi.visuals.TooltipEvent;
    import ObjectEnumerationBuilder = powerbi.visuals.ObjectEnumerationBuilder;
    import IInteractiveBehavior = powerbi.visuals.IInteractiveBehavior;
    import IInteractivityService = powerbi.visuals.IInteractivityService;
    import appendClearCatcher = powerbi.visuals.appendClearCatcher;
    import ISelectionHandler = powerbi.visuals.ISelectionHandler;
    import TooltipEnabledDataPoint = powerbi.visuals.TooltipEnabledDataPoint;
    import SelectableDataPoint = powerbi.visuals.SelectableDataPoint;
    import createInteractivityService = powerbi.visuals.createInteractivityService;

    interface SankeyDiagramDataPoint {
        source: any;
        destination: any;
        weigth: number;
    }

    interface SankeyDiagramProperty {
        [propertyName: string]: DataViewObjectPropertyIdentifier;
    }

    interface SankeyDiagramProperties {
        [objectName: string]: SankeyDiagramProperty;
    }

    export class SankeyDiagram implements IVisual {
        private static ClassName: string = "sankeyDiagram";

        private static Node: ClassAndSelector = createClassAndSelector("node");
        private static Nodes: ClassAndSelector = createClassAndSelector("nodes");
        private static NodeRect: ClassAndSelector = createClassAndSelector("nodeRect");
        private static NodeLabel: ClassAndSelector = createClassAndSelector("nodeLabel");

        private static Links: ClassAndSelector = createClassAndSelector("links");
        private static Link: ClassAndSelector = createClassAndSelector("link");

        private static DefaultColourOfNode: string = "rgb(62, 187, 162)";
        private static DefaultColourOfLink: string = "black";

        private static DefaultSettings: SankeyDiagramSettings = {
            isVisibleLabels: true,
            scale: { x: 1, y: 1 },
            colourOfLabels: "black",
            fontSize: 12
        };

        private static MinWidthOfLabel: number = 21;

        private static NodeBottomMargin: number = 5; // 5%

        private static NodeMargin: number = 5;
        private static LabelMargin: number = 4;

        public static RoleNames: SankeyDiagramRoleNames = {
            rows: "Source",
            columns: "Destination",
            values: "Weight"
        };

        // private static Properties: SankeyDiagramProperties = SankeyDiagram.getProperties(SankeyDiagram.capabilities);

        public static getProperties(capabilities: VisualCapabilities): any {
            var result = {};

            for (var objectKey in capabilities.objects) {
                result[objectKey] = {};

                for (var propKey in capabilities.objects[objectKey].properties) {
                    result[objectKey][propKey] = <DataViewObjectPropertyIdentifier>{
                        objectName: objectKey,
                        propertyName: propKey
                    };
                }
            }

            return result;
        }

        private margin: IMargin = {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
        };

        private nodeWidth: number = 21.5;
        private curvatureOfLinks: number = 0.5;

        private svg: Selection<any>;
        private root: Selection<any>;
        private clearCatcher: Selection<any>;
        private main: Selection<any>;
        private nodes: Selection<SankeyDiagramNode>;
        private links: Selection<SankeyDiagramLink>;

        private colours: IDataColorPalette;
        private viewport: IViewport;
        private dataView: SankeyDiagramDataView;

        private interactivityService: IInteractivityService;
        private behavior: IInteractiveBehavior;

        private get textProperties(): TextProperties {
            return {
                fontFamily: this.root.style("font-family"),
                fontSize: pixelConverterFromPoint(this.dataView
                    ? this.dataView.settings.fontSize
                    : SankeyDiagram.DefaultSettings.fontSize)
            };
        }

        constructor(constructorOptions?) {
            if (constructorOptions) {
                this.svg = constructorOptions.svg;
                this.margin = constructorOptions.margin || this.margin;
                this.curvatureOfLinks = constructorOptions.curvatureOfLinks || this.curvatureOfLinks;
            }
        }

        public init(visualsInitOptions: VisualInitOptions): void {
            var style: IVisualStyle = visualsInitOptions.style;

            if (this.svg) {
                this.root = this.svg;
            } else {
                this.root = d3.select(visualsInitOptions.element.get(0))
                    .append("svg");
            }

            this.interactivityService = createInteractivityService(visualsInitOptions.host);
            this.behavior = SankeyDiagramBehavior.create();

            this.clearCatcher = appendClearCatcher(this.root);

            this.colours = style && style.colorPalette
                ? style.colorPalette.dataColors
                : new DataColorPalette();

            this.root.classed(SankeyDiagram.ClassName, true);

            this.main = this.root.append("g");

            this.links = this.main
                .append("g")
                .classed(SankeyDiagram.Links.class, true);

            this.nodes = this.main
                .append("g")
                .classed(SankeyDiagram.Nodes.class, true);
        }

        public onClearSelection(): void {
            if (this.interactivityService) {
                this.interactivityService.clearSelection();
            }
        }

        public update(visualUpdateOptions: VisualUpdateOptions): void {
            if (!visualUpdateOptions ||
                !visualUpdateOptions.dataViews) {
                return;
            }

            var dataView: DataView = visualUpdateOptions.dataViews[0],
                sankeyDiagramDataView: SankeyDiagramDataView;

            this.updateViewport(visualUpdateOptions.viewport);

            sankeyDiagramDataView = this.converter(dataView);

            this.computePositions(sankeyDiagramDataView);

            this.dataView = sankeyDiagramDataView;

            this.applySelectionStateToData();

            this.render(sankeyDiagramDataView);
        }

        private updateViewport(viewport: IViewport): void {
            var height: number,
                width: number;

            height = this.getPositiveNumber(viewport.height);
            width = this.getPositiveNumber(viewport.width);

            this.viewport = {
                height: this.getPositiveNumber(height - this.margin.top - this.margin.bottom),
                width: this.getPositiveNumber(width - this.margin.left - this.margin.right)
            };

            this.updateElements(height, width);
        }

        /**
         * Public for testability.
         */
        public getPositiveNumber(value: number): number {
            return value < 0 || isNaN(value) || value === null || value === Infinity || value === -Infinity
                ? 0
                : value;
        }

        private updateElements(height: number, width: number): void {
            this.root.attr({
                "height": height,
                "width": width
            });

            this.main.attr("transform", SVGUtil.translate(this.margin.left, this.margin.top));
        }

        public converter(dataView: DataView): SankeyDiagramDataView {
            if (!dataView ||
                !dataView.categorical ||
                !dataView.categorical.categories ||
                !dataView.categorical.categories[0] ||
                !dataView.categorical.categories[1] ||
                !dataView.categorical.categories[0].values ||
                !dataView.categorical.categories[1].values) {

                return {
                    nodes: [],
                    links: [],
                    columns: [],
                    settings: {
                        scale: { x: 1, y: 1 },
                        colourOfLabels: SankeyDiagram.DefaultSettings.colourOfLabels,
                        fontSize: SankeyDiagram.DefaultSettings.fontSize
                    }
                };
            }

            var nodes: SankeyDiagramNode[] = [],
                links: SankeyDiagramLink[] = [],
                dataPoints: SankeyDiagramDataPoint[] = [],
                sourceCategory: DataViewCategoryColumn = dataView.categorical.categories[0],
                categories: any[] = sourceCategory.values,
                secondCategories: any[] = dataView.categorical.categories[1].values,
                valuesColumn: DataViewValueColumn = dataView.categorical.values && dataView.categorical.values[0],
                weightValues: number[] = [],
                allCategories: any[],
                valueFormatterForCategories: IValueFormatter,
                formatOfWeigth: string = "g",
                valuesFormatterForWeigth: IValueFormatter,
                objects: DataViewObjects,
                linksObjects: DataViewObjects[] = sourceCategory.objects || [],
                labelColour: string,
                settings: SankeyDiagramSettings,
                shiftOfColour: number,
                selectionIdBuilder: SankeyDiagramSelectionIdBuilder = SankeyDiagramSelectionIdBuilder.create();

            if (valuesColumn && valuesColumn.values && valuesColumn.values.map) {
                weightValues = valuesColumn.values.map((x: any) => {
                    return x ? x : 0;
                });
            }

            selectionIdBuilder.addCategories(dataView.categorical.categories);

            objects = this.getObjectsFromDataView(dataView);

            labelColour = this.getColour(
                SankeyDiagram.Properties["labels"]["fill"],
                SankeyDiagram.DefaultSettings.colourOfLabels,
                objects);

            if (valuesColumn && valuesColumn.source) {
                formatOfWeigth = ValueFormatter.getFormatString(
                    valuesColumn.source,
                    SankeyDiagram.Properties["general"]["formatString"]);
            }

            dataPoints = categories.map((item: any, index: number) => {
                return {
                    source: item,
                    destination: secondCategories[index],
                    weigth: valuesColumn ? Math.max(weightValues[index] || 0, 0) : 1
                };
            });

            allCategories = categories.concat(secondCategories);

            valueFormatterForCategories = ValueFormatter.create({
                /*format: ValueFormatter.getFormatString(
                    dataView.categorical.categories[0].source,
                    SankeyDiagram.Properties["general"]["formatString"]),*/
                format: ValueFormatter.getFormatString(dataView.categorical.categories[0].source),
                value: allCategories[0],
                value2: allCategories[allCategories.length - 1]
            });

            valuesFormatterForWeigth = ValueFormatter.create({
                format: formatOfWeigth,
                value: Math.max(d3.max(weightValues) || 1, 1),
            });

            allCategories.forEach((item: any, index: number) => {
                if (!nodes.some((node: SankeyDiagramNode) => {
                    if (item === node.label.name) {
                        var selectionId: SelectionId = selectionIdBuilder.createSelectionId(index);

                        node.selectableDataPoints.push(this.createSelectableDataPoint(selectionId));

                        return true;
                    }

                    return false;
                })) {
                    var formattedValue: string = valueFormatterForCategories.format(item),
                        label: SankeyDiagramLabel,
                        selectableDataPoint: SelectableDataPoint,
                        textProperties: TextProperties = {
                            text: formattedValue,
                            fontFamily: this.textProperties.fontFamily,
                            fontSize: this.textProperties.fontSize
                        };

                    label = {
                        name: item,
                        formattedName: valueFormatterForCategories.format(item),
                        width: TextMeasurementService.measureSvgTextWidth(textProperties),
                        height: TextMeasurementService.estimateSvgTextHeight(textProperties),
                        colour: labelColour
                    };

                    selectableDataPoint = this.createSelectableDataPoint(selectionIdBuilder.createSelectionId(index));

                    nodes.push({
                        label: label,
                        links: [],
                        inputWeight: 0,
                        outputWeight: 0,
                        width: this.nodeWidth,
                        height: 0,
                        colour: SankeyDiagram.DefaultColourOfNode,
                        tooltipInfo: [],
                        selectableDataPoints: [selectableDataPoint]
                    });
                }
            });

            shiftOfColour = this.colours.getAllColors().length / nodes.length;

            nodes.forEach((node: SankeyDiagramNode, index: number) => {
                node.colour = this.colours.getColorByIndex(Math.floor(index * shiftOfColour)).value;
            });

            dataPoints.forEach((dataPoint: SankeyDiagramDataPoint, index: number) => {
                var sourceNode: SankeyDiagramNode,
                    destinationNode: SankeyDiagramNode,
                    link: SankeyDiagramLink,
                    linkColour: string,
                    selectionId: SelectionId;

                if (dataPoint.source === dataPoint.destination) {
                    return;
                }

                nodes.forEach((node: SankeyDiagramNode) => {
                    if (node.label.name === dataPoint.source) {
                        sourceNode = node;
                    }

                    if (node.label.name === dataPoint.destination) {
                        destinationNode = node;
                    }
                });

                linkColour = this.getColour(
                    SankeyDiagram.Properties["links"]["fill"],
                    SankeyDiagram.DefaultColourOfLink,
                    linksObjects[index]);

                selectionId = selectionIdBuilder.createSelectionId(index);

                link = {
                    source: sourceNode,
                    destination: destinationNode,
                    weigth: dataPoint.weigth,
                    height: dataPoint.weigth,
                    colour: linkColour,
                    tooltipInfo: this.getTooltipDataForLink(
                        valuesFormatterForWeigth,
                        sourceNode.label.formattedName,
                        destinationNode.label.formattedName,
                        dataPoint.weigth),
                    identity: selectionId,
                    selected: false
                };

                links.push(link);

                sourceNode.links.push(link);
                destinationNode.links.push(link);

                this.updateValueOfNode(sourceNode);
                this.updateValueOfNode(destinationNode);

                sourceNode.tooltipInfo = this.getTooltipForNode(
                    valuesFormatterForWeigth,
                    sourceNode.label.formattedName,
                    sourceNode.inputWeight
                        ? sourceNode.inputWeight
                        : sourceNode.outputWeight);

                destinationNode.tooltipInfo = this.getTooltipForNode(
                    valuesFormatterForWeigth,
                    destinationNode.label.formattedName,
                    destinationNode.inputWeight
                        ? destinationNode.inputWeight
                        : destinationNode.outputWeight);
            });

            settings = this.parseSettings(objects);

            settings.colourOfLabels = labelColour;

            return {
                nodes: nodes,
                links: links,
                settings: settings,
                columns: []
            };
        }

        private createSelectableDataPoint(selectionId: SelectionId, isSelected: boolean = false): SelectableDataPoint {
            return {
                identity: selectionId,
                selected: isSelected
            };
        }

        private getObjectsFromDataView(dataView: DataView): DataViewObjects {
            if (!dataView ||
                !dataView.metadata ||
                !dataView.metadata.columns ||
                !dataView.metadata.objects) {
                return null;
            }

            return dataView.metadata.objects;
        }

        private getColour(properties: DataViewObjectPropertyIdentifier, defaultColor: string, objects: DataViewObjects): string {
            var colorHelper: ColorHelper;

            colorHelper = new ColorHelper(this.colours, properties, defaultColor);

            return colorHelper.getColorForMeasure(objects, "");
        }

        private getTooltipDataForLink(
            valueFormatter: IValueFormatter,
            sourceNodeName: string,
            destinationNodeName: string,
            linkWeight: number): TooltipDataItem[] {

            var formattedLinkWeight: string;

            if (valueFormatter && valueFormatter.format) {
                formattedLinkWeight = valueFormatter.format(linkWeight);
            } else {
                formattedLinkWeight = linkWeight.toString();
            }

            return [
                {
                    displayName: SankeyDiagram.RoleNames.rows,
                    value: sourceNodeName
                }, {
                    displayName: SankeyDiagram.RoleNames.columns,
                    value: destinationNodeName
                }, {
                    displayName: SankeyDiagram.RoleNames.values,
                    value: formattedLinkWeight
                }
            ];
        }

        private updateValueOfNode(node: SankeyDiagramNode): void {
            node.inputWeight = node.links.reduce((previousValue: number, currentValue: SankeyDiagramLink) => {
                return previousValue + (currentValue.destination === node ? currentValue.weigth : 0);
            }, 0);

            node.outputWeight = node.links.reduce((previousValue: number, currentValue: SankeyDiagramLink) => {
                return previousValue + (currentValue.source === node ? currentValue.weigth : 0);
            }, 0);
        }

        private getTooltipForNode(
            valueFormatter: IValueFormatter,
            nodeName: string,
            nodeWeight: number): TooltipDataItem[] {

            var formattedNodeWeigth: string;

            if (valueFormatter && valueFormatter.format) {
                formattedNodeWeigth = valueFormatter.format(nodeWeight);
            } else {
                formattedNodeWeigth = nodeWeight.toString();
            }

            return [
                {
                    displayName: "Name",
                    value: nodeName
                }, {
                    displayName: SankeyDiagram.RoleNames.values,
                    value: formattedNodeWeigth
                }
            ];
        }

        private parseSettings(objects: DataViewObjects): SankeyDiagramSettings {
            var isVisibleLabels: boolean = false;

            // isVisibleLabels = DataViewObjects.getValue(
            //     objects,
            //     SankeyDiagram.Properties["labels"]["show"],
            //     SankeyDiagram.DefaultSettings.isVisibleLabels);

            return {
                isVisibleLabels: isVisibleLabels,
                scale: {
                    x: SankeyDiagram.DefaultSettings.scale.x,
                    y: SankeyDiagram.DefaultSettings.scale.y
                },
                colourOfLabels: SankeyDiagram.DefaultSettings.colourOfLabels,
                // fontSize: DataViewObjects.getValue<number>(objects,
                //     SankeyDiagram.Properties["labels"]["fontSize"],
                //     SankeyDiagram.DefaultSettings.fontSize)
                fontSize: SankeyDiagram.DefaultSettings.fontSize
            };
        }

        private computePositions(sankeyDiagramDataView: SankeyDiagramDataView): void {
            var maxXPosition: number,
                maxColumn: SankeyDiagramColumn,
                columns: SankeyDiagramColumn[];

            maxXPosition = this.computeXPositions(sankeyDiagramDataView);

            this.sortNodesByX(sankeyDiagramDataView.nodes);

            columns = this.getColumns(sankeyDiagramDataView.nodes);
            maxColumn = this.getMaxColumn(columns);

            sankeyDiagramDataView.settings.scale.x = this.getScaleByAxisX(maxXPosition);
            sankeyDiagramDataView.settings.scale.y = this.getScaleByAxisY(maxColumn.sumValueOfNodes);

            this.scalePositionsByAxes(
                sankeyDiagramDataView.nodes,
                columns,
                sankeyDiagramDataView.settings.scale,
                this.viewport.height);

            this.computeYPosition(
                sankeyDiagramDataView.nodes,
                sankeyDiagramDataView.settings.scale.y);

            sankeyDiagramDataView.nodes.forEach((node: SankeyDiagramNode, i) => {
                var textHeight: number = TextMeasurementService.estimateSvgTextHeight({
                    text: node.label.formattedName,
                    fontFamily: this.textProperties.fontFamily,
                    fontSize: this.textProperties.fontSize
                });

                node.left = node.x + this.getLabelPositionByAxisX(node);
                node.right = node.left + (sankeyDiagramDataView.settings.scale.x - node.width) - SankeyDiagram.NodeMargin;
                node.top = node.y + node.height / 2;
                node.bottom = node.top + textHeight;
                node.label.maxWidth = sankeyDiagramDataView.settings.scale.x - node.width - SankeyDiagram.NodeMargin * 2;
            });

            sankeyDiagramDataView.nodes.forEach((node1: SankeyDiagramNode) => {
                sankeyDiagramDataView.nodes.forEach((node2: SankeyDiagramNode) => {
                    if (node1.x <= node2.x) {
                        return;
                    }

                    if (SankeyDiagram.isIntersect(node1, node2)) {
                        node1.label.maxWidth = (sankeyDiagramDataView.settings.scale.x - node1.width) / 2 - SankeyDiagram.NodeMargin;
                        node2.label.maxWidth = (sankeyDiagramDataView.settings.scale.x - node2.width) / 2 - SankeyDiagram.NodeMargin;
                    }
                });
            });
        }

        private static isIntersect(a: SankeyDiagramNode, b: SankeyDiagramNode): boolean {
            return Math.max(a.left, b.left) < Math.min(a.right, b.right) &&
                Math.max(a.top, b.top) < Math.min(a.bottom, b.bottom);
        }

        private computeXPositions(sankeyDiagramDataView: SankeyDiagramDataView): number {
            var nodes: SankeyDiagramNode[] = sankeyDiagramDataView.nodes,
                nextNodes: SankeyDiagramNode[] = [],
                previousNodes: SankeyDiagramNode[] = [],
                x: number = 0,
                isRecursiveDependencies: boolean = false;

            while (nodes.length > 0) {
                nextNodes = [];

                nodes.forEach((node: SankeyDiagramNode) => {
                    node.x = x;

                    node.links.forEach((link: SankeyDiagramLink) => {
                        if (node === link.source && node !== link.destination) {
                            if (nextNodes.every((item: SankeyDiagramNode) => {
                                return item !== link.destination;
                            })) {
                                nextNodes.push(link.destination);
                            }
                        }
                    });
                });

                isRecursiveDependencies = nextNodes.length === previousNodes.length &&
                    previousNodes.every((previousNode: SankeyDiagramNode) => {
                        return nextNodes.some((nextNode: SankeyDiagramNode) => {
                            return nextNode === previousNode;
                        });
                    });

                if (isRecursiveDependencies) {
                    previousNodes.forEach((element: SankeyDiagramNode) => {
                        element.x = x;

                        x++;
                    });

                    nodes = [];
                } else {
                    nodes = nextNodes;

                    previousNodes = nodes;

                    x++;
                }
            }

            return x - 1;
        }

        private getScaleByAxisX(numberOfColumns: number = 1): number {
            return this.getPositiveNumber((this.viewport.width - this.nodeWidth) / numberOfColumns);
        }

        /**
         * Public for testability.
         */
        public sortNodesByX(nodes: SankeyDiagramNode[]): SankeyDiagramNode[] {
            return nodes.sort((firstNode: SankeyDiagramNode, secondNode: SankeyDiagramNode) => {
                return firstNode.x - secondNode.x;
            });
        }

        /**
         * Public for testability.
         */
        public getColumns(nodes: SankeyDiagramNode[]): SankeyDiagramColumn[] {
            var columns: SankeyDiagramColumn[] = [],
                currentX: number = -Number.MAX_VALUE;

            nodes.forEach((node: SankeyDiagramNode, index: number) => {
                if (currentX !== node.x) {
                    columns.push({
                        countOfNodes: 0,
                        sumValueOfNodes: 0
                    });

                    currentX = node.x;
                }

                if (columns[node.x]) {
                    columns[node.x].sumValueOfNodes += Math.max(node.inputWeight, node.outputWeight);
                    columns[node.x].countOfNodes++;
                }
            });

            return columns;
        }

        /**
         * Public for testability.
         */
        public getMaxColumn(columns: SankeyDiagramColumn[] = []): SankeyDiagramColumn {
            var currentMaxColumn: SankeyDiagramColumn = { sumValueOfNodes: 0, countOfNodes: 0 };

            columns.forEach((column: SankeyDiagramColumn) => {
                if (column && column.sumValueOfNodes > currentMaxColumn.sumValueOfNodes) {
                    currentMaxColumn = column;
                }
            });

            return currentMaxColumn;
        }

        private getScaleByAxisY(sumValueOfNodes: number): number {
            return this.getPositiveNumber((this.viewport.height - this.getAvailableSumNodeMarginByY()) / sumValueOfNodes);
        }

        private getAvailableSumNodeMarginByY(): number {
            return this.viewport
                ? this.viewport.height * SankeyDiagram.NodeBottomMargin / 100
                : 0;
        }

        private scalePositionsByAxes(
            nodes: SankeyDiagramNode[],
            columns: SankeyDiagramColumn[],
            scale: SankeyDiagramScale,
            viewportHeight: number): void {

            var shiftByAxisY: number = 0,
                currentX: number = 0,
                index: number = 0;

            nodes.forEach((node: SankeyDiagramNode) => {
                var offsetByY: number = 0,
                    availableHeight: number = 0;

                if (currentX !== node.x) {
                    currentX = node.x;
                    shiftByAxisY = 0;
                    index = 0;
                }

                if (columns[currentX]) {
                    availableHeight = viewportHeight - columns[currentX].sumValueOfNodes * scale.y;

                    offsetByY = availableHeight / columns[currentX].countOfNodes;
                }

                node.x *= scale.x;
                node.height = Math.max(node.inputWeight, node.outputWeight) * scale.y;
                node.y = shiftByAxisY + offsetByY * index;
                shiftByAxisY += node.height;
                index++;
            });
        }

        // TODO: Update this method to improve a distribution by height.
        private computeYPosition(
            nodes: SankeyDiagramNode[],
            scale: number): void {

            nodes.forEach((node: SankeyDiagramNode) => {
                node.links = node.links.sort((firstLink: SankeyDiagramLink, secondLink: SankeyDiagramLink) => {
                    var firstY: number,
                        secondY: number;

                    firstY = firstLink.source === node
                        ? firstLink.destination.y
                        : firstLink.source.y;

                    secondY = secondLink.source === node
                        ? secondLink.destination.y
                        : secondLink.source.y;

                    return firstY - secondY;
                });

                var shiftByAxisYOfLeftLink: number = 0,
                    shiftByAxisYOfRightLink: number = 0;

                node.links.forEach((link: SankeyDiagramLink) => {
                    var shiftByAxisY: number = 0;

                    link.height = link.weigth * scale;

                    if (link.source.x < node.x || link.destination.x < node.x) {
                        shiftByAxisY = shiftByAxisYOfLeftLink;
                        shiftByAxisYOfLeftLink += link.height;
                    } else if (link.source.x > node.x || link.destination.x > node.x) {
                        shiftByAxisY = shiftByAxisYOfRightLink;
                        shiftByAxisYOfRightLink += link.height;
                    }

                    if (link.source === node) {
                        link.dySource = shiftByAxisY;
                    } else if (link.destination === node) {
                        link.dyDestination = shiftByAxisY;
                    }
                });
            });
        }

        private applySelectionStateToData(): void {
            this.interactivityService.applySelectionStateToData(this.getSelectableDataPoints());
        }

        private getSelectableDataPoints(): SelectableDataPoint[] {
            var dataPoints: SelectableDataPoint[] = this.dataView.links;

            this.dataView.nodes.forEach((node: SankeyDiagramNode) => {
                dataPoints = dataPoints.concat(node.selectableDataPoints);
            });

            return dataPoints;
        }

        private render(sankeyDiagramDataView: SankeyDiagramDataView): void {
            var nodesSelection: Selection<SankeyDiagramNode>,
                linksSelection: Selection<SankeyDiagramLink>;

            linksSelection = this.renderLinks(sankeyDiagramDataView);

            this.renderTooltip(linksSelection);

            nodesSelection = this.renderNodes(sankeyDiagramDataView);

            this.renderTooltip(nodesSelection);

            this.bindSelectionHandler(nodesSelection, linksSelection);

            this.updateSelectionState(nodesSelection, linksSelection);
        }

        private renderNodes(sankeyDiagramDataView: SankeyDiagramDataView): Selection<SankeyDiagramNode> {
            var nodesEnterSelection: Selection<SankeyDiagramNode>,
                nodesSelection: UpdateSelection<SankeyDiagramNode>,
                nodeElements: Selection<SankeyDiagramNode>;

            nodeElements = this.main
                .select(SankeyDiagram.Nodes.selector)
                .selectAll(SankeyDiagram.Node.selector);

            nodesSelection = nodeElements.data(sankeyDiagramDataView.nodes.filter(x => x.height > 0));

            nodesEnterSelection = nodesSelection
                .enter()
                .append("g");

            nodesSelection
                .attr("transform", (node: SankeyDiagramNode) => {
                    return SVGUtil.translate(node.x, node.y);
                })
                .classed(SankeyDiagram.Node.class, true);

            nodesEnterSelection
                .append("rect")
                .classed(SankeyDiagram.NodeRect.class, true);

            nodesEnterSelection
                .append("text")
                .classed(SankeyDiagram.NodeLabel.class, true);

            nodesSelection
                .select(SankeyDiagram.NodeRect.selector)
                .style({
                    "fill": (node: SankeyDiagramNode) => node.colour,
                    "stroke": (node: SankeyDiagramNode) => d3.rgb(node.colour).darker(1.5).toString() // TODO: check it. It returns d3_rgb.
                })
                .attr({
                    x: 0,
                    y: 0,
                    height: (node: SankeyDiagramNode) => node.height,
                    width: (node: SankeyDiagramNode) => node.width
                });

            nodesSelection
                .select(SankeyDiagram.NodeLabel.selector)
                .attr({
                    x: (node: SankeyDiagramNode) => node.left - node.x,
                    y: (node: SankeyDiagramNode) => node.top - node.y,
                    dy: "0.35em"
                })
                .style("fill", (node: SankeyDiagramNode) => node.label.colour)
                .style("font-size", this.textProperties.fontSize)
                .style("display", (node: SankeyDiagramNode) => {
                    var isNotVisibleLabel: boolean = false,
                        labelPositionByAxisX: number = this.getCurrentPositionOfLabelByAxisX(node);

                    isNotVisibleLabel =
                        labelPositionByAxisX >= this.viewport.width ||
                        labelPositionByAxisX <= 0 ||
                        (node.height + SankeyDiagram.NodeMargin) < node.label.height;

                    if (isNotVisibleLabel || !sankeyDiagramDataView.settings.isVisibleLabels
                        || node.label.maxWidth < SankeyDiagram.MinWidthOfLabel) {
                        return "none";
                    }

                    return null;
                })
                .style("text-anchor", (node: SankeyDiagramNode) => {
                    if (this.isLabelLargerThanWidth(node)) {
                        return "end";
                    }

                    return null;
                })
                .text((node: SankeyDiagramNode) => {
                    if (node.label.width > node.label.maxWidth) {
                        return TextMeasurementService.getTailoredTextOrDefault({
                            text: node.label.formattedName,
                            fontFamily: this.textProperties.fontFamily,
                            fontSize: this.textProperties.fontSize
                        }, node.label.maxWidth);
                    }

                    return node.label.formattedName;
                });

            nodesSelection
                .exit()
                .remove();

            return nodesSelection;
        }

        private getLabelPositionByAxisX(node: SankeyDiagramNode): number {
            if (this.isLabelLargerThanWidth(node)) {
                return -(SankeyDiagram.LabelMargin);
            }

            return node.width + SankeyDiagram.LabelMargin;
        }

        private isLabelLargerThanWidth(node: SankeyDiagramNode): boolean {
            var shiftByAxisX: number = node.x + node.width + SankeyDiagram.LabelMargin;

            return shiftByAxisX + node.label.width > this.viewport.width;
        }

        private getCurrentPositionOfLabelByAxisX(node: SankeyDiagramNode): number {
            var labelPositionByAxisX: number = this.getLabelPositionByAxisX(node);

            labelPositionByAxisX = labelPositionByAxisX > 0
                ? labelPositionByAxisX + node.x + node.label.width + node.width
                : node.x - labelPositionByAxisX - node.label.width - node.width;

            return labelPositionByAxisX;
        }

        private renderLinks(sankeyDiagramDataView: SankeyDiagramDataView): Selection<SankeyDiagramLink> {
            var linksSelection: UpdateSelection<SankeyDiagramLink>,
                linksElements: Selection<SankeyDiagramLink>;

            linksElements = this.main
                .select(SankeyDiagram.Links.selector)
                .selectAll(SankeyDiagram.Link.selector);

            linksSelection = linksElements.data(sankeyDiagramDataView.links.filter(x => x.height > 0));

            linksSelection
                .enter()
                .append("path")
                .classed(SankeyDiagram.Link.class, true);

            linksSelection
                .attr("d", (link: SankeyDiagramLink) => {
                    return this.getSvgPath(link);
                })
                .style({
                    "stroke-width": (link: SankeyDiagramLink) => link.height,
                    "stroke": (link: SankeyDiagramLink) => link.colour
                });

            linksSelection
                .exit()
                .remove();

            return linksSelection;
        }

        private getSvgPath(link: SankeyDiagramLink): string {
            var x0: number,
                x1: number,
                xi: (t: number) => number,
                x2: number,
                x3: number,
                y0: number,
                y1: number;

            if (link.destination.x < link.source.x) {
                x0 = link.source.x;
                x1 = link.destination.x + link.destination.width;
            } else {
                x0 = link.source.x + link.source.width;
                x1 = link.destination.x;
            }

            xi = d3.interpolateNumber(x0, x1);
            x2 = xi(this.curvatureOfLinks);
            x3 = xi(1 - this.curvatureOfLinks);
            y0 = link.source.y + link.dySource + link.height / 2;
            y1 = link.destination.y + link.dyDestination + link.height / 2;

            return `M ${x0} ${y0} C ${x2} ${y0}, ${x3} ${y1}, ${x1} ${y1}`;
        }

        private renderTooltip(selection: Selection<SankeyDiagramNode | SankeyDiagramLink>): void {
            TooltipManager.addTooltip(selection, (tooltipEvent: TooltipEvent) => {
                return tooltipEvent.data.tooltipInfo;
            });
        }

        private updateSelectionState(
            nodesSelection: Selection<SankeyDiagramNode>,
            linksSelection: Selection<SankeyDiagramLink>): void {

            sankeyDiagramUtils.updateFillOpacity(
                nodesSelection,
                this.interactivityService,
                false);

            sankeyDiagramUtils.updateFillOpacity(
                linksSelection,
                this.interactivityService,
                true);
        }

        private bindSelectionHandler(
            nodesSelection: Selection<SankeyDiagramNode>,
            linksSelection: Selection<SankeyDiagramLink>): void {

            if (!this.interactivityService
                || !this.dataView) {
                return;
            }

            var behaviorOptions: SankeyDiagramBehaviorOptions = {
                nodes: nodesSelection,
                links: linksSelection,
                clearCatcher: this.clearCatcher,
                interactivityService: this.interactivityService
            };

            this.interactivityService.bind(
                this.getSelectableDataPoints(),
                this.behavior,
                behaviorOptions,
                {
                    overrideSelectionFromData: true
                });
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            var enumeration = new ObjectEnumerationBuilder();

            if (!this.dataView) {
                return [];
            }

            switch (options.objectName) {
                case "labels": {
                    this.enumerateLabels(enumeration);
                    break;
                }
                case "links": {
                    this.enumerateLinks(enumeration);
                    break;
                }
            }

            return enumeration.complete();
        }

        private enumerateLabels(enumeration: ObjectEnumerationBuilder): void {
            var settings: SankeyDiagramSettings = this.dataView.settings,
                labels: VisualObjectInstance;

            if (!settings) {
                return;
            }

            labels = {
                objectName: "labels",
                displayName: "labels",
                selector: null,
                properties: {
                    show: settings.isVisibleLabels,
                    fill: settings.colourOfLabels,
                    fontSize: settings.fontSize
                }
            };

            enumeration.pushInstance(labels);
        }

        private enumerateLinks(enumeration: ObjectEnumerationBuilder): void {
            var links: SankeyDiagramLink[] = this.dataView.links;

            if (!links || !(links.length > 0)) {
                return;
            }

            links.forEach((link: SankeyDiagramLink) => {
                enumeration.pushInstance({
                    objectName: "links",
                    displayName: `${link.source.label.formattedName} - ${link.destination.label.formattedName}`,
                    // selector: ColorHelper.normalizeSelector(link.identity.getSelector(), false), // TODO: check it.
                    properties: {
                        fill: { solid: { color: link.colour } }
                    }
                });
            });
        }
    }
}
