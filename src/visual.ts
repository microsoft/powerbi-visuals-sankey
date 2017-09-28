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

    // powerbi
    import DataView = powerbi.DataView;
    import IViewport = powerbi.IViewport;
    import DataViewObjects = powerbi.DataViewObjects;
    import DataViewValueColumn = powerbi.DataViewValueColumn;
    import VisualObjectInstance = powerbi.VisualObjectInstance;
    import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
    import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
    import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
    import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;

    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId;

    // powerbi.extensibility
    import IColorPalette = powerbi.extensibility.IColorPalette;
    import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

    // powerbi.extensibility.visual
    import IVisual = powerbi.extensibility.visual.IVisual;
    import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
    import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

    // powerbi.extensibility.utils.svg
    import IMargin = powerbi.extensibility.utils.svg.IMargin;
    import translate = powerbi.extensibility.utils.svg.translate;
    import ClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.ClassAndSelector;
    import createClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.createClassAndSelector;

    // powerbi.extensibility.utils.type
    import pixelConverterFromPoint = powerbi.extensibility.utils.type.PixelConverter.fromPoint;

    // powerbi.extensibility.utils.formatting
    import ValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
    import TextProperties = powerbi.extensibility.utils.formatting.TextProperties;
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;
    import textMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;

    // powerbi.extensibility.utils.interactivity
    import appendClearCatcher = powerbi.extensibility.utils.interactivity.appendClearCatcher;
    import SelectableDataPoint = powerbi.extensibility.utils.interactivity.SelectableDataPoint;
    import IInteractiveBehavior = powerbi.extensibility.utils.interactivity.IInteractiveBehavior;
    import IInteractivityService = powerbi.extensibility.utils.interactivity.IInteractivityService;
    import createInteractivityService = powerbi.extensibility.utils.interactivity.createInteractivityService;

    // powerbi.extensibility.utils.tooltip
    import TooltipEventArgs = powerbi.extensibility.utils.tooltip.TooltipEventArgs;
    import ITooltipServiceWrapper = powerbi.extensibility.utils.tooltip.ITooltipServiceWrapper;
    import TooltipEnabledDataPoint = powerbi.extensibility.utils.tooltip.TooltipEnabledDataPoint;
    import createTooltipServiceWrapper = powerbi.extensibility.utils.tooltip.createTooltipServiceWrapper;

    // powerbi.extensibility.utils.color
    import ColorHelper = powerbi.extensibility.utils.color.ColorHelper;

    export class SankeyDiagram implements IVisual {
        private static ClassName: string = "sankeyDiagram";

        private static NodeSelector: ClassAndSelector = createClassAndSelector("node");
        private static NodesSelector: ClassAndSelector = createClassAndSelector("nodes");
        private static NodeRectSelector: ClassAndSelector = createClassAndSelector("nodeRect");
        private static NodeLabelSelector: ClassAndSelector = createClassAndSelector("nodeLabel");

        private static LinksSelector: ClassAndSelector = createClassAndSelector("links");
        private static LinkSelector: ClassAndSelector = createClassAndSelector("link");
        private static LinkLabelPathsSelector: ClassAndSelector = createClassAndSelector("linkLabelPaths");
        private static LinkLabelTextsSelector: ClassAndSelector = createClassAndSelector("linkLabelTexts");

        private static DefaultColourOfNode: string = "rgb(62, 187, 162)";
        private static DefaultColourOfLink: string = "black";

        private static LinksPropertyIdentifier: DataViewObjectPropertyIdentifier = {
            objectName: "links",
            propertyName: "fill"
        };

        private static NodeComplexSettingsPropertyIdentifier: DataViewObjectPropertyIdentifier = {
            objectName: "nodeComplexSettings",
            propertyName: "nodePositions"
        };

        private static NodesPropertyIdentifier: DataViewObjectPropertyIdentifier = {
            objectName: "nodes",
            propertyName: "fill"
        };

        private static MinWidthOfLabel: number = 21;

        private static NodeBottomMargin: number = 5; // 5%

        private static NodeMargin: number = 5;
        private static LabelMargin: number = 4;

        private static DefaultFormatOfWeigth: string = "g";

        private static DefaultWeightValue: number = 0;
        private static MinWeightValue: number = 1;

        private static TooltipDisplayName: string = "Name";

        private static DefaultPosition: number = 0;
        private static DefaultXOffset: number = 1;

        private static DefaultCountOfNodes: number = 0;
        private static DefaultSumValueOfNodes: number = 0;

        private static PercentFactor: number = 100;

        private static MinSize: number = 0;

        private static DefaultDy: string = "0.35em";
        private static DisplayNone: string = "none";
        private static TextAnchorEnd: string = "end";

        private static DefaultOffset: number = 0;
        private static DefaultIndex: number = 0;

        private static NodeMarginFactor: number = 2;
        private static MiddleFactor: number = 2;

        private static DefaultNumberOfColumns: number = 1;

        private static StrokeColorFactor: number = 1.5;

        private static MinDomainOfScale = 0;
        private static MaxDomainOfScale = 9;
        private static MinRangeOfScale = 3;
        private static MaxRangeOfScale = 100;

        public static DublicatedNamePostfix: string = "_SK_SELFLINK";

        private static MinWidthOfLink: number = 1;
        private static DefaultWeightOfLink: number = 1;

        private static MinHeightOfNode: number = 5;

        private static ScaleStep: number = 0.1;
        private static ScaleStepLimit: number = 1;

        private static NegativeValueRange: number = 0;

        public static RoleNames: SankeyDiagramRoleNames = {
            rows: "Source",
            columns: "Destination",
            values: "Weight"
        };

        private static DefaultViewport: IViewport = {
            height: 100,
            width: 100
        };

        private margin: IMargin = {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
        };

        private nodeWidth: number = 21.5;
        private curvatureOfLinks: number = 0.5;

        private root: Selection<any>;
        private clearCatcher: Selection<any>;
        private main: Selection<any>;
        private nodes: Selection<SankeyDiagramNode>;
        private links: Selection<SankeyDiagramLink>;

        private colorPalette: IColorPalette;
        private visualHost: IVisualHost;

        private viewport: IViewport;

        private dataView: SankeyDiagramDataView;

        private interactivityService: IInteractivityService;
        private behavior: IInteractiveBehavior;

        private tooltipServiceWrapper: ITooltipServiceWrapper;

        private fontFamily: string;

        public static SourceCategoryIndex: number = 0;
        public static DestinationCategoryIndex: number = 1;
        public static FirstValueIndex: number = 0;

        private get textProperties(): TextProperties {
            return {
                fontFamily: this.fontFamily,
                fontSize: pixelConverterFromPoint(this.dataView
                    ? this.dataView.settings.labels.fontSize
                    : SankeyDiagramLabelsSettings.DefaultFontSize)
            };
        }

        constructor(options: VisualConstructorOptions) {
            this.init(options);
        }

        private init(options: VisualConstructorOptions): void {
            this.visualHost = options.host;

            this.root = d3.select(options.element)
                .append("svg")
                .classed(SankeyDiagram.ClassName, true);

            this.interactivityService = createInteractivityService(this.visualHost);
            this.behavior = SankeyDiagramBehavior.create();
            this.clearCatcher = appendClearCatcher(this.root);

            this.colorPalette = this.visualHost.colorPalette;

            this.tooltipServiceWrapper = createTooltipServiceWrapper(
                this.visualHost.tooltipService,
                options.element);

            this.fontFamily = this.root.style("font-family");

            this.main = this.root.append("g");

            this.links = this.main
                .append("g")
                .classed(SankeyDiagram.LinksSelector.class, true);

            this.nodes = this.main
                .append("g")
                .classed(SankeyDiagram.NodesSelector.class, true);
        }

        public update(visualUpdateOptions: VisualUpdateOptions): void {
            let sankeyDiagramDataView: SankeyDiagramDataView,
                viewport: IViewport = visualUpdateOptions
                    && visualUpdateOptions.viewport
                    || SankeyDiagram.DefaultViewport,
                dataView: DataView = visualUpdateOptions
                    && visualUpdateOptions.dataViews
                    && visualUpdateOptions.dataViews[0];

            this.updateViewport(visualUpdateOptions.viewport);

            sankeyDiagramDataView = this.converter(dataView);

            this.computePositions(sankeyDiagramDataView);

            this.dataView = sankeyDiagramDataView;

            this.applySelectionStateToData();

            this.render(sankeyDiagramDataView);
        }

        private updateViewport(viewport: IViewport): void {
            let height: number,
                width: number;

            height = SankeyDiagram.getPositiveNumber(viewport.height);
            width = SankeyDiagram.getPositiveNumber(viewport.width);

            this.viewport = {
                height: SankeyDiagram.getPositiveNumber(height - this.margin.top - this.margin.bottom),
                width: SankeyDiagram.getPositiveNumber(width - this.margin.left - this.margin.right)
            };

            this.updateElements(height, width);
        }

        public static getPositiveNumber(value: number): number {
            return value < 0 || isNaN(value) || value === null || value === Infinity || value === -Infinity
                ? 0
                : value;
        }

        private updateElements(height: number, width: number): void {
            this.root.attr({
                "height": height,
                "width": width
            });

            this.main.attr("transform", translate(this.margin.left, this.margin.top));
        }

        public converter(dataView: DataView): SankeyDiagramDataView {
            const settings: SankeyDiagramSettings = this.parseSettings(dataView);

            if (!dataView
                || !dataView.categorical
                || !dataView.categorical.categories
                || !dataView.categorical.categories[0]
                || !dataView.categorical.categories[1]
                || !dataView.categorical.categories[0].values
                || !dataView.categorical.categories[1].values) {

                return {
                    settings,
                    nodes: [],
                    links: [],
                    columns: []
                };
            }

            let nodes: SankeyDiagramNode[],
                links: SankeyDiagramLink[],
                sourceCategory: DataViewCategoryColumn = dataView.categorical.categories[0],
                sourceCategories: any[] = sourceCategory.values,
                destinationCategories: any[] = dataView.categorical.categories[1].values,
                sourceCategoryLabels: any[] = (dataView.categorical.categories[2] ||  {values: []}).values,
                destinationCategoriesLabels: any[] = (dataView.categorical.categories[3] || {values: []}).values,
                selectionIdBuilder: SankeyDiagramSelectionIdBuilder = new SankeyDiagramSelectionIdBuilder(
                    this.visualHost,
                    dataView.categorical.categories);

            nodes = this.createNodes(
                sourceCategories,
                destinationCategories,
                settings,
                selectionIdBuilder,
                sourceCategory.source,
                sourceCategory.objects || [],
                sourceCategoryLabels,
                destinationCategoriesLabels);

            links = this.createLinks(
                nodes,
                selectionIdBuilder,
                sourceCategories,
                destinationCategories,
                dataView.categorical.values,
                sourceCategory.objects || [],
                settings,
                dataView.categorical.categories[SankeyDiagram.SourceCategoryIndex].source.displayName,
                dataView.categorical.categories[SankeyDiagram.DestinationCategoryIndex].source.displayName,
                dataView.categorical.values ? dataView.categorical.values[SankeyDiagram.FirstValueIndex].source.displayName : null
            );

            let cycles: SankeyDiagramCycleDictionary = this.checkCycles(nodes);

            links = this.processCycles(cycles, nodes, links, settings);

            this.checkNodePositionSettings(nodes, settings);
            this.restoreNodePositions(nodes, settings);

            return {
                nodes,
                links,
                settings,
                columns: []
            };
        }

        // in this method we breaking simple cycles for typical displaying with twice rendering onr node in cycle
        private processCycles(cycles: SankeyDiagramCycleDictionary, nodes: SankeyDiagramNode[], links: SankeyDiagramLink[], settings: SankeyDiagramSettings): SankeyDiagramLink[] {
            let createdNodes: SankeyDiagramNode[] = [];
            for (let nodeName in cycles) {
                let firstCyclesNode: SankeyDiagramNode = (cycles[nodeName].filter((node: SankeyDiagramNode): boolean => {
                    if ((node.label.name || "").toString() === (nodeName || "").toString()) {
                        return true;
                    }
                    return false;
                }) || [])[0];

                if (firstCyclesNode === undefined) {
                    return [];
                }

                // create a clone of the node and save a link to each other. In selection behavior, selection of clone lead to select original and visa versa
                let nodeCopy: SankeyDiagramNode = _.cloneDeep(firstCyclesNode);
                nodeCopy.label.name += SankeyDiagram.DublicatedNamePostfix;
                firstCyclesNode.cloneLink = nodeCopy;
                nodeCopy.cloneLink = firstCyclesNode;

                // copy only! output links to new node;
                nodeCopy.links = firstCyclesNode.links.filter((link: SankeyDiagramLink) => {
                    if (link.source === firstCyclesNode || link.source === link.destination) {
                        return true;
                    }
                    return false;
                });
                nodeCopy.links.forEach((link: SankeyDiagramLink) => {
                    link.source = nodeCopy;
                });

                // remove output links from original node
                firstCyclesNode.links = firstCyclesNode.links.filter((link: SankeyDiagramLink) => {
                    if (link.destination === firstCyclesNode || link.destination === link.source) {
                        return true;
                    }

                    return false;
                });

                SankeyDiagram.updateValueOfNode(firstCyclesNode);
                SankeyDiagram.updateValueOfNode(nodeCopy);
                SankeyDiagram.fixLinksCount(firstCyclesNode);
                SankeyDiagram.fixLinksCount(nodeCopy);
                nodes.push(nodeCopy);
                createdNodes.push(nodeCopy);
            }

            return links;
        }

        private checkNodePositionSettings(nodes: SankeyDiagramNode[], settings: SankeyDiagramSettings) {
            let nodePositions: SankeyDiagramNodePositionSetting[] = settings._nodePositions;

            nodePositions.forEach((position: SankeyDiagramNodePositionSetting) => {
                let check: boolean = nodes.some((node: SankeyDiagramNode) => {
                    if (node.label.name === position.name) {
                        return true;
                    }

                    return false;
                });

                // if check failed then reset positions
                if (!check) {
                    settings.nodeComplexSettings.nodePositions = "{}";
                    settings._nodePositions = [];
                }
            });
        }

        private restoreNodePositions(nodes: SankeyDiagramNode[], settings: SankeyDiagramSettings) {
            nodes.forEach( (node: SankeyDiagramNode) => {
                let nodeSettings: SankeyDiagramNodePositionSetting = this.getNodeSettings(node.label.name, settings);
                node.settings = nodeSettings;
            });
        }

        // remove dublicated links
        private static fixLinksCount(node: SankeyDiagramNode) {
            node.links = _.uniq(node.links);
        }

        public static dfs(nodes: SankeyDiagramNode[], currNode: SankeyDiagramNode, nodesStatuses: SankeyDiagramNodeStatus[], simpleCycles: SankeyDiagramCycleDictionary): void {
            nodesStatuses[currNode.label.name].status = SankeyDiagramNodeStatus.Processing;

            currNode.links.forEach((link: SankeyDiagramLink) => {
                // consider only output links
                if (link.source !== currNode) {
                    return;
                }

                // get node by output link
                let nextNode: SankeyDiagramNode = link.destination;
                // move to next not visited node
                if (nodesStatuses[nextNode.label.name].status === SankeyDiagramNodeStatus.NotVisited) {
                    SankeyDiagram.dfs(nodes, nextNode, nodesStatuses, simpleCycles);
                }
                // if cycle was found
                if (nodesStatuses[nextNode.label.name].status === SankeyDiagramNodeStatus.Processing) {
                    // add item to dictionary
                    simpleCycles[nextNode.label.name] = <SankeyDiagramNode[]>[];

                    // collect all nodes which were processed in current step
                    nodes.forEach((node: SankeyDiagramNode) => {
                        if (nodesStatuses[node.label.name].status === SankeyDiagramNodeStatus.Processing &&
                            node.links.length > 0) {
                            simpleCycles[nextNode.label.name].push(node);
                        }
                    });
                }
            });

            nodesStatuses[currNode.label.name].status = SankeyDiagramNodeStatus.Visited;
        }

        // Depth-First Search 
        private checkCycles(nodes: SankeyDiagramNode[]): SankeyDiagramCycleDictionary {
            let nodesStatuses: SankeyDiagramNodeStatus[] = [];

            // init nodes statuses array
            // all nodes are not visited state
            nodes.forEach((node: SankeyDiagramNode) => {
                if (node.links.length > 0) {
                    nodesStatuses[node.label.name] = {
                        node: node,
                        status: SankeyDiagramNodeStatus.NotVisited
                    };
                }
            });

            let simpleCycles: SankeyDiagramCycleDictionary = {};

            nodes.forEach((node: SankeyDiagramNode) => {
                if (nodesStatuses[node.label.name].status === SankeyDiagramNodeStatus.NotVisited &&
                    node.links.length > 0) {
                    SankeyDiagram.dfs(nodes, node, nodesStatuses, simpleCycles);
                }
            });

            return simpleCycles;
        }

        private createNodes(
            sourceCategories: any[],
            destinationCategories: any[],
            settings: SankeyDiagramSettings,
            selectionIdBuilder: SankeyDiagramSelectionIdBuilder,
            source: DataViewMetadataColumn,
            linksObjects: DataViewObjects[],
            sourceCategoriesLabels?: any[],
            destinationCategoriesLabels?: any[]): SankeyDiagramNode[] {

            let nodes: SankeyDiagramNode[] = [],
                valueFormatterForCategories: IValueFormatter;

            valueFormatterForCategories = ValueFormatter.create({
                format: ValueFormatter.getFormatStringByColumn(source),
                value: sourceCategories[0],
                value2: destinationCategories[destinationCategories.length - 1]
            });

            // check self connected links
            for (let index: number = 0; index < destinationCategories.length; index++) {
                if (sourceCategoriesLabels[index] === undefined) {
                    sourceCategoriesLabels[index] = sourceCategories[index];
                }
                if (destinationCategoriesLabels[index] === undefined) {
                    destinationCategoriesLabels[index] = destinationCategories[index];
                }
            }

            let labelsDictionary: Object = { };
            sourceCategories.forEach((item: any, index: number) => {
                labelsDictionary[item] = sourceCategoriesLabels[index] || "";
            });
            destinationCategories.forEach((item: any, index: number) => {
                labelsDictionary[item] = destinationCategoriesLabels[index] || "";
            });

            let categories: any[] = sourceCategories.concat(destinationCategories);

            categories.forEach((item: any, index: number) => {
                let formattedValue: string = valueFormatterForCategories.format((<string>labelsDictionary[item].toString()).replace(SankeyDiagram.DublicatedNamePostfix, "")),
                    label: SankeyDiagramLabel,
                    selectableDataPoint: SelectableDataPoint,
                    textProperties: TextProperties = {
                        text: formattedValue,
                        fontFamily: this.textProperties.fontFamily,
                        fontSize: this.textProperties.fontSize
                    };

                label = {
                    internalName: item,
                    name: item,
                    formattedName: valueFormatterForCategories.format((<string>labelsDictionary[item].toString()).replace(SankeyDiagram.DublicatedNamePostfix, "")),
                    width: textMeasurementService.measureSvgTextWidth(textProperties),
                    height: textMeasurementService.estimateSvgTextHeight(textProperties),
                    color: settings.labels.fill
                };

                nodes.push({
                    label: label,
                    links: [],
                    inputWeight: 0,
                    outputWeight: 0,
                    width: this.nodeWidth,
                    height: 0,
                    colour: this.colorPalette.getColor(index.toString()).value,
                    tooltipInfo: [],
                    selectableDataPoints: [],
                    settings: null
                });
            });

            return nodes;
        }

        private createLinks(
            nodes: SankeyDiagramNode[],
            selectionIdBuilder: SankeyDiagramSelectionIdBuilder,
            sourceCategories: any[],
            destinationCategories: any[],
            valueColumns: DataViewValueColumns,
            linksObjects: DataViewObjects[],
            settings: SankeyDiagramSettings,
            sourceFieldName: string,
            destinationFieldName: string,
            valueFieldName: string
        ): SankeyDiagramLink[] {
            let valuesColumn: DataViewValueColumn = valueColumns && valueColumns[0],
                links: SankeyDiagramLink[] = [],
                weightValues: number[] = [],
                dataPoints: SankeyDiagramDataPoint[] = [],
                valuesFormatterForWeigth: IValueFormatter,
                formatOfWeigth: string = SankeyDiagram.DefaultFormatOfWeigth;

            if (valuesColumn && valuesColumn.values && valuesColumn.values.map) {
                weightValues = valuesColumn.values.map((value: any) => {
                    return value
                        ? value
                        : SankeyDiagram.DefaultWeightValue;
                });
            }

            if (valuesColumn && valuesColumn.source) {
                formatOfWeigth = ValueFormatter.getFormatStringByColumn(valuesColumn.source);
            }

            dataPoints = sourceCategories.map((item: any, index: number) => {
                return {
                    source: item,
                    destination: destinationCategories[index],
                    weigth: valuesColumn
                        ? weightValues[index] || SankeyDiagram.DefaultWeightValue
                        : SankeyDiagram.MinWeightValue
                };
            });

            valuesFormatterForWeigth = ValueFormatter.create({
                format: formatOfWeigth,
                value: Math.max(
                    settings.labels.unit !== 0 ? settings.labels.unit : d3.max(weightValues) || SankeyDiagram.MinWeightValue,
                    SankeyDiagram.MinWeightValue),
            });

            dataPoints.forEach((dataPoint: SankeyDiagramDataPoint, index: number) => {
                let sourceNode: SankeyDiagramNode,
                    destinationNode: SankeyDiagramNode,
                    link: SankeyDiagramLink,
                    linkColour: string,
                    selectionId: ISelectionId;

                nodes.forEach((node: SankeyDiagramNode) => {
                    if (node.label.internalName === dataPoint.source) {
                        sourceNode = node;
                    }

                    if (node.label.internalName === dataPoint.destination) {
                        destinationNode = node;
                    }
                });

                linkColour = this.getColor(
                    SankeyDiagram.LinksPropertyIdentifier,
                    SankeyDiagram.DefaultColourOfLink,
                    linksObjects[index]);

                selectionId = selectionIdBuilder.createSelectionId(index);

                link = {
                    source: sourceNode,
                    destination: destinationNode,
                    weigth: dataPoint.weigth,
                    height: dataPoint.weigth,
                    color: linkColour,
                    tooltipInfo: SankeyDiagram.getTooltipDataForLink(
                        valuesFormatterForWeigth,
                        sourceNode.label.formattedName,
                        destinationNode.label.formattedName,
                        dataPoint.weigth,
                        sourceFieldName,
                        destinationFieldName,
                        valueFieldName
                    ),
                    identity: selectionId,
                    selected: false
                };

                let selectableDataPoint: SelectableDataPoint = SankeyDiagram.createSelectableDataPoint(selectionId);
                sourceNode.selectableDataPoints.push(selectableDataPoint);
                destinationNode.selectableDataPoints.push(selectableDataPoint);

                links.push(link);

                sourceNode.links.push(link);
                destinationNode.links.push(link);

                SankeyDiagram.updateValueOfNode(sourceNode);
                SankeyDiagram.updateValueOfNode(destinationNode);
            });

            nodes.forEach((nodes: SankeyDiagramNode) => {
                nodes.tooltipInfo = SankeyDiagram.getTooltipForNode(
                    valuesFormatterForWeigth,
                    nodes.label.formattedName,
                    nodes.inputWeight
                        ? nodes.inputWeight
                        : nodes.outputWeight,
                        nodes.inputWeight >  0 && nodes.outputWeight > 0 ? `${sourceFieldName}-${destinationFieldName}` : nodes.outputWeight > 0
                        ? sourceFieldName
                        : destinationFieldName,
                        valueFieldName);

            });

            return links;
        }

        private static createSelectableDataPoint(
            selectionId: ISelectionId,
            isSelected: boolean = false): SelectableDataPoint {

            return {
                identity: selectionId,
                selected: isSelected
            };
        }

        private getNodeSettings(
            name: string,
            settings: SankeyDiagramSettings): SankeyDiagramNodePositionSetting {

            let setting: SankeyDiagramNodePositionSetting = null;
            settings._nodePositions.some( (nodePositions: SankeyDiagramNodePositionSetting) => {
                if (nodePositions.name === name) {
                    setting = nodePositions;
                    return true;
                }
            });

            return setting;
        }

        private getColor(
            properties: DataViewObjectPropertyIdentifier,
            defaultColor: string,
            objects: DataViewObjects): string {

            const colorHelper: ColorHelper = new ColorHelper(
                this.colorPalette,
                properties,
                defaultColor);

            return colorHelper.getColorForMeasure(objects, "");
        }

        private static getTooltipDataForLink(
            valueFormatter: IValueFormatter,
            sourceNodeName: string,
            destinationNodeName: string,
            linkWeight: number,
            sourceNodeDisplayName?: string,
            destinationNodeDisplayName?: string,
            valueDisplayName?: string,
            ): VisualTooltipDataItem[] {

            let formattedLinkWeight: string;

            if (valueFormatter && valueFormatter.format) {
                formattedLinkWeight = valueFormatter.format(linkWeight);
            } else {
                formattedLinkWeight = linkWeight.toString();
            }

            let tooltips: VisualTooltipDataItem[] = [
                {
                    displayName: sourceNodeDisplayName || SankeyDiagram.RoleNames.rows,
                    value: sourceNodeName
                }, {
                    displayName: destinationNodeDisplayName || SankeyDiagram.RoleNames.columns,
                    value: destinationNodeName
                },
            ];

            if (valueDisplayName) {
                tooltips.push({
                    displayName: valueDisplayName || SankeyDiagram.RoleNames.values,
                    value: formattedLinkWeight
                });
            }

            return tooltips;
        }

        private static updateValueOfNode(node: SankeyDiagramNode): void {
            node.inputWeight = node.links.reduce((previousValue: number, currentValue: SankeyDiagramLink) => {
                return previousValue + (currentValue.destination === node
                    ? currentValue.weigth
                    : SankeyDiagram.DefaultWeightValue);
            }, SankeyDiagram.DefaultWeightValue);

            node.outputWeight = node.links.reduce((previousValue: number, currentValue: SankeyDiagramLink) => {
                return previousValue + (currentValue.source === node
                    ? currentValue.weigth
                    : SankeyDiagram.DefaultWeightValue);
            }, SankeyDiagram.DefaultWeightValue);
        }

        private static getTooltipForNode(
            valueFormatter: IValueFormatter,
            nodeName: string,
            nodeWeight: number,
            nodeDisplayName?: string,
            valueDisplayName?: string,
            ): VisualTooltipDataItem[] {

            let formattedNodeWeigth: string;

            if (valueFormatter && valueFormatter.format) {
                formattedNodeWeigth = valueFormatter.format(nodeWeight);
            } else {
                formattedNodeWeigth = nodeWeight.toString();
            }

            return [
                {
                    displayName: nodeDisplayName || SankeyDiagram.TooltipDisplayName,
                    value: nodeName
                }, {
                    displayName: valueDisplayName || SankeyDiagram.RoleNames.values,
                    value: formattedNodeWeigth
                }
            ];
        }

        private parseSettings(dataView: DataView): SankeyDiagramSettings {
            let settings: SankeyDiagramSettings = SankeyDiagramSettings.parse<SankeyDiagramSettings>(dataView);
            // node positions
            try {
                settings._nodePositions = <SankeyDiagramNodePositionSetting[]>JSON.parse(settings.nodeComplexSettings.nodePositions);
            }
            catch (exception) {
                settings._nodePositions = [];
                settings.nodeComplexSettings.nodePositions = "[]";
            }

            // viewport size
            try {
                settings._viewportSize = <ViewportSize>JSON.parse(settings.nodeComplexSettings.viewportSize);
            }
            catch (exception) {
                settings._nodePositions = settings._nodePositions || [];
                settings.nodeComplexSettings.viewportSize = "{}";
            }
            return settings;
        }

        private computePositions(sankeyDiagramDataView: SankeyDiagramDataView): void {
            let maxXPosition: number,
                maxColumn: SankeyDiagramColumn,
                columns: SankeyDiagramColumn[];

            maxXPosition = SankeyDiagram.computeXPositions(sankeyDiagramDataView);

            SankeyDiagram.sortNodesByX(sankeyDiagramDataView.nodes);

            let scaleShift: number = 0;
            let minWeight: number = 1;
            let minHeight: number = 1;
            let scaleStepCount: number = 0;

            let minWeigthShift: number = 0;
            let minWeigthLink = _.minBy(sankeyDiagramDataView.links, "weigth");
            if (minWeigthLink) {
                minWeigthShift = minWeigthLink.weigth;
            }
            if (minWeigthShift > 0) {
                minWeigthShift = 0;
            }

            let minWeightInData: number = minWeigthShift;
            minWeigthShift = Math.abs(minWeigthShift) + minWeight;
            let maxWeightInData: number = 0;
            let maxWeigthLink = _.maxBy(sankeyDiagramDataView.links, "weigth");
            if (maxWeigthLink) {
                maxWeightInData = maxWeigthLink.weigth;
            }

            while (minHeight <= SankeyDiagram.MinHeightOfNode && scaleStepCount < SankeyDiagram.ScaleStepLimit) {
                let weightScale: any;

                if (sankeyDiagramDataView.settings.scaleSettings.show) {
                    weightScale = d3.scale.log()
                    .base(Math.E)
                    .domain([Math.exp(SankeyDiagram.MinDomainOfScale + scaleShift), Math.exp(SankeyDiagram.MaxDomainOfScale + scaleShift)])
                    .range([SankeyDiagram.MinRangeOfScale, SankeyDiagram.MaxRangeOfScale]);
                } else {
                    weightScale = d3.scale.linear()
                    .domain([minWeightInData + scaleShift, maxWeightInData + scaleShift])
                    .range([SankeyDiagram.MinRangeOfScale, SankeyDiagram.MaxRangeOfScale]);
                }

                sankeyDiagramDataView.links.forEach((l) => {
                    l.weigth = weightScale(l.weigth + minWeigthShift);

                    if (Number.NEGATIVE_INFINITY === l.weigth || Number.POSITIVE_INFINITY  === l.weigth || isNaN(l.weigth)) {
                         l.weigth = 0;
                    };
                });

                if (sankeyDiagramDataView.links.some( (link: SankeyDiagramLink) => link.weigth <= SankeyDiagram.NegativeValueRange)) {
                    let minWeight: number = sankeyDiagramDataView.links[0].weigth;
                    sankeyDiagramDataView.links.forEach((link: SankeyDiagramLink) => {
                        if (link.weigth <= minWeight) {
                            minWeight = link.weigth;
                        }
                    });

                    minWeight = Math.abs(minWeight) + SankeyDiagram.MinRangeOfScale;
                    // shift weight values to eliminate negative values
                    sankeyDiagramDataView.links.forEach((link: SankeyDiagramLink) => {
                        link.weigth += minWeight;
                    });
                }

                sankeyDiagramDataView.nodes.forEach((node: SankeyDiagramNode) => {
                    SankeyDiagram.updateValueOfNode(node);
                });

                columns = this.getColumns(sankeyDiagramDataView.nodes);
                maxColumn = SankeyDiagram.getMaxColumn(columns);

                minWeight = d3.min(sankeyDiagramDataView.nodes.filter((n) => Math.max(n.inputWeight, n.outputWeight) > 0).map((n) => Math.max(n.inputWeight, n.outputWeight)));
                minWeight = minWeight || SankeyDiagram.DefaultWeightOfLink;
                sankeyDiagramDataView.settings._scale.y = this.getScaleByAxisY(maxColumn.sumValueOfNodes);

                minHeight = minWeight * sankeyDiagramDataView.settings._scale.y;

                scaleShift += SankeyDiagram.ScaleStep;
                scaleStepCount++;
            }
            sankeyDiagramDataView.settings._scale.x = this.getScaleByAxisX(maxXPosition);

            SankeyDiagram.scalePositionsByAxes(
                sankeyDiagramDataView.nodes,
                columns,
                sankeyDiagramDataView.settings._scale,
                this.viewport.height);

            this.computeYPosition(
                sankeyDiagramDataView.nodes,
                sankeyDiagramDataView.settings._scale.y
            );

            this.applySavedPositions(sankeyDiagramDataView);

            this.computeBordersOfTheNode(sankeyDiagramDataView);
            SankeyDiagram.computeIntersections(sankeyDiagramDataView);
        }

        private applySavedPositions(sankeyDiagramDataView: SankeyDiagramDataView) {
            // if size were changed shift positions of nodes
            let viewPort: ViewportSize = sankeyDiagramDataView.settings._viewportSize;
            let scaleHeight: number = 1;
            if (+viewPort.height !== this.viewport.height && viewPort.height && +viewPort.height !== 0) {
                scaleHeight = this.viewport.height / +viewPort.height;
            }
            let scaleWidth: number = 1;
            if (+viewPort.width !== this.viewport.width && viewPort.width && +viewPort.width !== 0) {
                scaleWidth = this.viewport.width / +viewPort.width;
            }

            sankeyDiagramDataView.nodes.forEach( (node: SankeyDiagramNode) => {
                if (node.settings !== null) {
                    node.x = (+node.settings.x) * scaleWidth;
                    node.y = (+node.settings.y) * scaleHeight;
                }
            });
        }

        private computeBordersOfTheNode(sankeyDiagramDataView: SankeyDiagramDataView): void {
            sankeyDiagramDataView.nodes.forEach((node: SankeyDiagramNode) => {
                let textHeight: number = textMeasurementService.estimateSvgTextHeight({
                    text: node.label.formattedName,
                    fontFamily: this.textProperties.fontFamily,
                    fontSize: this.textProperties.fontSize
                });

                node.left = node.x + this.getLabelPositionByAxisX(node);

                node.right = node.left
                    + (sankeyDiagramDataView.settings._scale.x - node.width)
                    - SankeyDiagram.NodeMargin;

                node.top = node.y + node.height / SankeyDiagram.MiddleFactor;
                node.bottom = node.top + textHeight;

                node.label.maxWidth = sankeyDiagramDataView.settings._scale.x
                    - node.width
                    - SankeyDiagram.NodeMargin * SankeyDiagram.NodeMarginFactor;
            });
        }

        private static computeIntersections(sankeyDiagramDataView: SankeyDiagramDataView): void {
            sankeyDiagramDataView.nodes.forEach((node1: SankeyDiagramNode) => {
                sankeyDiagramDataView.nodes.forEach((node2: SankeyDiagramNode) => {
                    if (node1.x <= node2.x) {
                        return;
                    }

                    if (SankeyDiagram.isIntersect(node1, node2)) {
                        node1.label.maxWidth =
                            (sankeyDiagramDataView.settings._scale.x - node1.width) / SankeyDiagram.MiddleFactor
                            - SankeyDiagram.NodeMargin;

                        node2.label.maxWidth =
                            (sankeyDiagramDataView.settings._scale.x - node2.width) / SankeyDiagram.MiddleFactor
                            - SankeyDiagram.NodeMargin;
                    }
                });
            });
        }

        private static isIntersect(node1: SankeyDiagramNode, node2: SankeyDiagramNode): boolean {
            return Math.max(node1.left, node2.left) < Math.min(node1.right, node2.right) &&
                Math.max(node1.top, node2.top) < Math.min(node1.bottom, node2.bottom);
        }

        private static computeXPositions(sankeyDiagramDataView: SankeyDiagramDataView): number {
            let nodes: SankeyDiagramNode[] = sankeyDiagramDataView.nodes,
                nextNodes: SankeyDiagramNode[] = [],
                previousNodes: SankeyDiagramNode[] = [],
                x: number = SankeyDiagram.DefaultPosition,
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

            return x - SankeyDiagram.DefaultXOffset;
        }

        private getScaleByAxisX(numberOfColumns: number = SankeyDiagram.DefaultNumberOfColumns): number {
            return SankeyDiagram.getPositiveNumber((this.viewport.width - this.nodeWidth) / numberOfColumns);
        }

        public static sortNodesByX(nodes: SankeyDiagramNode[]): SankeyDiagramNode[] {
            return nodes.sort((firstNode: SankeyDiagramNode, secondNode: SankeyDiagramNode) => {
                return firstNode.x - secondNode.x;
            });
        }

        public getColumns(nodes: SankeyDiagramNode[]): SankeyDiagramColumn[] {
            let columns: SankeyDiagramColumn[] = [],
                currentX: number = -Number.MAX_VALUE;

            nodes.forEach((node: SankeyDiagramNode) => {
                if (currentX !== node.x) {
                    columns.push({
                        countOfNodes: SankeyDiagram.DefaultCountOfNodes,
                        sumValueOfNodes: SankeyDiagram.DefaultSumValueOfNodes
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

        public static getMaxColumn(columns: SankeyDiagramColumn[] = []): SankeyDiagramColumn {
            let currentMaxColumn: SankeyDiagramColumn = {
                sumValueOfNodes: SankeyDiagram.DefaultSumValueOfNodes,
                countOfNodes: SankeyDiagram.DefaultCountOfNodes
            };

            columns.forEach((column: SankeyDiagramColumn) => {
                if (column && column.sumValueOfNodes > currentMaxColumn.sumValueOfNodes) {
                    currentMaxColumn = column;
                }
            });

            return currentMaxColumn;
        }

        private getScaleByAxisY(sumValueOfNodes: number): number {
            return SankeyDiagram.getPositiveNumber(
                (this.viewport.height - this.getAvailableSumNodeMarginByY()) / sumValueOfNodes);
        }

        private getAvailableSumNodeMarginByY(): number {
            return this.viewport
                ? this.viewport.height * SankeyDiagram.NodeBottomMargin / SankeyDiagram.PercentFactor
                : SankeyDiagram.MinSize;
        }

        private static scalePositionsByAxes(
            nodes: SankeyDiagramNode[],
            columns: SankeyDiagramColumn[],
            scale: SankeyDiagramScaleSettings,
            viewportHeight: number): void {

            let shiftByAxisY: number = SankeyDiagram.DefaultOffset,
                currentX: number = SankeyDiagram.DefaultPosition,
                index: number = SankeyDiagram.DefaultIndex;

            nodes.forEach((node: SankeyDiagramNode) => {
                let offsetByY: number = SankeyDiagram.DefaultOffset,
                    availableHeight: number = SankeyDiagram.MinSize;

                if (currentX !== node.x) {
                    currentX = node.x;
                    shiftByAxisY = SankeyDiagram.DefaultOffset;
                    index = SankeyDiagram.DefaultIndex;
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
                    let firstY: number,
                        secondY: number;

                    firstY = firstLink.source === node
                        ? firstLink.destination.y
                        : firstLink.source.y;

                    secondY = secondLink.source === node
                        ? secondLink.destination.y
                        : secondLink.source.y;

                    return firstY - secondY;
                });

                let shiftByAxisYOfLeftLink: number = SankeyDiagram.DefaultOffset,
                    shiftByAxisYOfRightLink: number = SankeyDiagram.DefaultOffset;

                node.links.forEach((link: SankeyDiagramLink) => {
                    let shiftByAxisY: number = SankeyDiagram.DefaultOffset;
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
            return this.dataView.nodes.reduce((
                dataPoints: SelectableDataPoint[],
                node: SankeyDiagramNode) => {

                return dataPoints.concat(node.selectableDataPoints);
            }, this.dataView.links);
        }

        private render(sankeyDiagramDataView: SankeyDiagramDataView): void {
            let nodesSelection: Selection<SankeyDiagramNode>,
                linksSelection: Selection<SankeyDiagramLink>;

            linksSelection = this.renderLinks(sankeyDiagramDataView);
            this.renderLinkLabels(sankeyDiagramDataView);

            this.renderTooltip(linksSelection);

            nodesSelection = this.renderNodes(sankeyDiagramDataView);

            this.renderTooltip(nodesSelection);

            this.bindSelectionHandler(nodesSelection, linksSelection);

            this.updateSelectionState(nodesSelection, linksSelection);
        }

        private renderNodes(sankeyDiagramDataView: SankeyDiagramDataView): Selection<SankeyDiagramNode> {
            let nodesEnterSelection: Selection<SankeyDiagramNode>,
                nodesSelection: UpdateSelection<SankeyDiagramNode>,
                nodeElements: Selection<SankeyDiagramNode>;

            nodeElements = this.main
                .select(SankeyDiagram.NodesSelector.selector)
                .selectAll(SankeyDiagram.NodeSelector.selector);

            nodesSelection = nodeElements.data(sankeyDiagramDataView.nodes.filter((node: SankeyDiagramNode) => {
                return node.height > SankeyDiagram.MinSize;
            }));

            nodesEnterSelection = nodesSelection
                .enter()
                .append("g");

            nodesSelection
                .attr("transform", (node: SankeyDiagramNode) => {
                    return translate(node.x, node.y);
                })
                .classed(SankeyDiagram.NodeSelector.class, true);

            let rectNodes: Selection<SankeyDiagramNode> = nodesEnterSelection
                .append("rect")
                .classed(SankeyDiagram.NodeRectSelector.class, true);

            nodesEnterSelection
                .append("text")
                .classed(SankeyDiagram.NodeLabelSelector.class, true);

            nodesSelection
                .select(SankeyDiagram.NodeRectSelector.selector)
                .style({
                    "fill": (node: SankeyDiagramNode) => node.colour,
                    "stroke": (node: SankeyDiagramNode) => d3.rgb(node.colour)
                        .darker(SankeyDiagram.StrokeColorFactor)
                        .toString()
                })
                .attr({
                    x: SankeyDiagram.DefaultPosition,
                    y: SankeyDiagram.DefaultPosition,
                    height: (node: SankeyDiagramNode) => node.height,
                    width: (node: SankeyDiagramNode) => node.width
                });

            nodesSelection
                .select(SankeyDiagram.NodeLabelSelector.selector)
                .attr({
                    x: (node: SankeyDiagramNode) => node.left - node.x,
                    y: (node: SankeyDiagramNode) => node.top - node.y,
                    dy: SankeyDiagram.DefaultDy
                })
                .style("fill", (node: SankeyDiagramNode) => node.label.color)
                .style("font-size", this.textProperties.fontSize)
                .style("display", (node: SankeyDiagramNode) => {
                    let isNotVisibleLabel: boolean,
                        labelPositionByAxisX: number = this.getCurrentPositionOfLabelByAxisX(node);

                    isNotVisibleLabel =
                        (labelPositionByAxisX >= this.viewport.width ||
                        labelPositionByAxisX <= SankeyDiagram.MinSize ||
                        (node.height + SankeyDiagram.NodeMargin) < node.label.height) && !sankeyDiagramDataView.settings.labels.forceDisplay;

                    if (isNotVisibleLabel || !sankeyDiagramDataView.settings.labels.show
                        || node.label.maxWidth < SankeyDiagram.MinWidthOfLabel) {
                        return SankeyDiagram.DisplayNone;
                    }

                    return null;
                })
                .style("text-anchor", (node: SankeyDiagramNode) => {
                    if (this.isLabelLargerThanWidth(node)) {
                        return SankeyDiagram.TextAnchorEnd;
                    }

                    return null;
                })
                .text((node: SankeyDiagramNode) => {
                    if (node.label.width > node.label.maxWidth) {
                        return textMeasurementService.getTailoredTextOrDefault({
                            text: node.label.formattedName,
                            fontFamily: this.textProperties.fontFamily,
                            fontSize: this.textProperties.fontSize
                        }, node.label.maxWidth);
                    }

                    return node.label.formattedName;
                });

            let drag = d3.behavior.drag()
                .origin(function(node: SankeyDiagramNode, index: number) {
                    return { x: node.x, y: node.y};
                })
                .on("dragstart", dragstarted)
                .on("drag", dragged)
                .on("dragend", dragend);

            function dragstarted(node: SankeyDiagramNode) {
                (d3.event as any).sourceEvent.stopPropagation();
            }

            let sankeyVisual = this;
            let allowSave: boolean = true;
            function dragged(node: SankeyDiagramNode) {
                allowSave = false;
                node.x = (d3.event as any).x;
                node.y = (d3.event as any).y;

                if (node.x < 0 ) {
                    node.x = 0;
                }

                if (node.y < 0 ) {
                    node.y = 0;
                }

                if (node.x + node.width > sankeyVisual.viewport.width ) {
                    node.x = sankeyVisual.viewport.width - node.width;
                }

                if (node.y + node.height > sankeyVisual.viewport.height ) {
                    node.y = sankeyVisual.viewport.height - node.height;
                }

                node.settings = {
                    x: node.x.toFixed(2),
                    y: node.y.toFixed(2),
                    name: node.label.name
                };

                // Update each link related with this node
                node.links.forEach( (link: SankeyDiagramLink) => {
                    // select link svg element by ID generated in link creation as Source-Destination
                    d3.select(`#linkLabelPaths${(link.source.label.name || "").replace(/\W*/g,"")}-${(link.destination.label.name || "").replace(/\W*/g,"")}`).attr({
                        // get updated path params based on actual positions of node
                        d: sankeyVisual.getLinkLabelSvgPath(link)
                    });
                    d3.select(`#${(link.source.label.name || "").replace(/\W*/g,"")}-${(link.destination.label.name || "").replace(/\W*/g,"")}`).attr({
                        // get updated path params based on actual positions of node
                        d: sankeyVisual.getSvgPath(link)
                    });
                });

                // Translate the object on the actual moved point
                d3.select(this).attr({
                    transform: translate(node.x, node.y)
                });
                allowSave = true;
            }

            function dragend(node: SankeyDiagramNode) {
                sankeyVisual.saveNodePositions(sankeyVisual.dataView.nodes);
                sankeyVisual.saveViewportSize();
            }

            nodesEnterSelection.call(drag);

            nodesSelection
                .exit()
                .remove();

            return nodesSelection;
        }

        private saveViewportSize(): void {
            const instance: VisualObjectInstance = {
                objectName: "nodeComplexSettings",
                selector: undefined,
                properties: {
                    viewportSize: JSON.stringify(<ViewportSize>{
                        height: this.viewport.height.toString(),
                        width: this.viewport.width.toString()
                    })
                }
            };

            this.visualHost.persistProperties({
                merge: [
                    instance
                ]
            });
        }

        private saveNodePositions(nodes: SankeyDiagramNode[]): void {
            let nodePositions: SankeyDiagramNodePositionSetting[]  = [];
            nodes.forEach((node: SankeyDiagramNode) => {
                if (node.height === 0) {
                    return;
                }
                let settings: SankeyDiagramNodePositionSetting = <SankeyDiagramNodePositionSetting>{
                    name: node.label.name,
                    x: node.x.toFixed(0),
                    y: node.y.toFixed(0)
                };
                nodePositions.push(settings);
            });

            const instance: VisualObjectInstance = {
                objectName: "nodeComplexSettings",
                selector: undefined,
                properties: {
                    nodePositions: JSON.stringify(nodePositions)
                }
            };

            this.visualHost.persistProperties({
                merge: [
                    instance
                ]
            });
        }

        private getLabelPositionByAxisX(node: SankeyDiagramNode): number {
            if (this.isLabelLargerThanWidth(node)) {
                return -(SankeyDiagram.LabelMargin);
            }

            return node.width + SankeyDiagram.LabelMargin;
        }

        private isLabelLargerThanWidth(node: SankeyDiagramNode): boolean {
            const shiftByAxisX: number = node.x + node.width + SankeyDiagram.LabelMargin;

            return shiftByAxisX + node.label.width > this.viewport.width;
        }

        private getCurrentPositionOfLabelByAxisX(node: SankeyDiagramNode): number {
            let labelPositionByAxisX: number = this.getLabelPositionByAxisX(node);

            labelPositionByAxisX = labelPositionByAxisX > SankeyDiagram.DefaultPosition
                ? labelPositionByAxisX + node.x + node.label.width + node.width
                : node.x - labelPositionByAxisX - node.label.width - node.width;

            return labelPositionByAxisX;
        }

        private renderLinks(sankeyDiagramDataView: SankeyDiagramDataView): Selection<SankeyDiagramLink> {
            let linksSelection: UpdateSelection<SankeyDiagramLink>,
                linksElements: Selection<SankeyDiagramLink>;

            linksElements = this.main
                .select(SankeyDiagram.LinksSelector.selector)
                .selectAll(SankeyDiagram.LinkSelector.selector);

            linksSelection = linksElements.data(sankeyDiagramDataView.links.filter((link: SankeyDiagramLink) => {
                return link.height > SankeyDiagram.MinSize;
            }));

            linksSelection
                .enter()
                .append("path")
                .classed(SankeyDiagram.LinkSelector.class, true);

            linksSelection
                .attr({
                    d: (link: SankeyDiagramLink) => {
                        return this.getSvgPath(link);
                    },
                    id: (link: SankeyDiagramLink) => `${(link.source.label.name || "").replace(/\W*/g,"")}-${(link.destination.label.name || "").replace(/\W*/g,"")}`
                })
                .style({
                    "stroke": (link: SankeyDiagramLink) => link.color,
                    "fill": (link: SankeyDiagramLink) => link.color
                });

            linksSelection
                .exit()
                .remove();

            return linksSelection;
        }

        private renderLinkLabels(sankeyDiagramDataView: SankeyDiagramDataView): void {
             // create labels on link as A - B : Value
             let linkTextData: SankeyDiagramLink[] = sankeyDiagramDataView.links.filter((link: SankeyDiagramLink) => {
                return link.height > SankeyDiagram.MinSize && this.dataView.settings.linkLabels.show;
            });

            // add defs element to svg
            let svgDefs: Selection<any> = this.root
            .selectAll("defs");

            let svgDefsSelection: UpdateSelection<Number> = svgDefs.data([1]);
            svgDefsSelection
                .enter()
                .append("defs");

            svgDefsSelection
                .exit()
                .remove();

            let singleDefsElement: Selection<any> = d3.select(svgDefsSelection.node());

            // add text path for lables
            let linkLabelPaths: Selection<any> = singleDefsElement.selectAll(SankeyDiagram.LinkLabelPathsSelector.selector);

            let linkLabelPathsSelection: UpdateSelection<SankeyDiagramLink> = linkLabelPaths.data(linkTextData);

            linkLabelPathsSelection
                .enter()
                .append("path")
                .classed(SankeyDiagram.LinkLabelPathsSelector.class, true);

            linkLabelPathsSelection
                .attr({
                    d: (link: SankeyDiagramLink) => {
                        return this.getLinkLabelSvgPath(link);
                    },
                    id: (link: SankeyDiagramLink) => `linkLabelPaths${(link.source.label.name || "").replace(/\W*/g,"")}-${(link.destination.label.name || "").replace(/\W*/g,"")}`
                });

            linkLabelPathsSelection
                .exit()
                .remove();

            // add text by using paths from defs
            let linkLabelTexts: Selection<any> = this.main
                .select(SankeyDiagram.LinksSelector.selector)
                .selectAll(SankeyDiagram.LinkLabelTextsSelector.selector);

            let linkLabelTextSelection: UpdateSelection<SankeyDiagramLink> = linkLabelTexts.data(linkTextData);

            linkLabelTextSelection
                .enter()
                .append("text")
                .attr({
                    "text-anchor": "middle"
                })
                .classed(SankeyDiagram.LinkLabelTextsSelector.class, true);

            let textPathSelection: UpdateSelection<SankeyDiagramLink> = linkLabelTextSelection.selectAll("textPath").data( data => [data]);

            textPathSelection
                .enter()
                .append("textPath");

            textPathSelection
                .attr({
                    startOffset: "50%",
                    href: (link: SankeyDiagramLink) => `#linkLabelPaths${(link.source.label.name || "").replace(/\W*/g,"")}-${(link.destination.label.name || "").replace(/\W*/g,"")}`
                })
                .style({
                    "font-size": this.dataView.settings.linkLabels.fontSize,
                    "fill": this.dataView.settings.linkLabels.fill
                })
                .text((link: SankeyDiagramLink) =>
                    `${link.source.label.name || ""}-${link.destination.label.name || ""}:${(link.tooltipInfo[2] || {value: ""}).value}`
                );

            textPathSelection
                .exit()
                .remove();

            linkLabelTextSelection
                .exit()
                .remove();
        }

        private getLinkLabelSvgPath(link: SankeyDiagramLink): string {
            let x0: number,
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
            y0 = link.source.y + link.dySource + link.height / SankeyDiagram.MiddleFactor;
            y1 = link.destination.y + link.dyDestination + link.height / SankeyDiagram.MiddleFactor;

            return `M ${x0} ${y0} C ${x2} ${y0}, ${x3} ${y1}, ${x1} ${y1}`;
        }

        private getSvgPath(link: SankeyDiagramLink): string {
            let pathParams: string = "";

            let x0: number,
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

            // drawing area as combination of 4 lines in one path element of svg to fill this area with required color
            // upper border of link
            xi = d3.interpolateNumber(x0, x1);
            x2 = xi(this.curvatureOfLinks);
            x3 = xi(1 - this.curvatureOfLinks);
            y0 = link.source.y + link.dySource + link.height / SankeyDiagram.MiddleFactor - link.height / 2;
            y1 = link.destination.y + link.dyDestination + link.height / SankeyDiagram.MiddleFactor - link.height / 2;

            pathParams += ` M ${x0} ${y0} C ${x2} ${y0}, ${x3} ${y1}, ${x1} ${y1}`;

            // right border of link
            y0 = link.destination.y + link.dyDestination + link.height / SankeyDiagram.MiddleFactor + link.height / 2;
            y1 = link.destination.y + link.dyDestination + link.height / SankeyDiagram.MiddleFactor - link.height / 2;

            pathParams += ` L ${x1} ${y0}`;

            // bottom border of link
            xi = d3.interpolateNumber(x0, x1);
            x2 = xi(this.curvatureOfLinks);
            x3 = xi(1 - this.curvatureOfLinks);
            y0 = link.source.y + link.dySource + link.height / SankeyDiagram.MiddleFactor + link.height / 2;
            y1 = link.destination.y + link.dyDestination + link.height / SankeyDiagram.MiddleFactor + link.height / 2;

            pathParams += ` L ${x1} ${y1} C ${x2} ${y1}, ${x3} ${y0}, ${x0} ${y0}`;

            // left border of link
            y0 = link.source.y + link.dySource + link.height / SankeyDiagram.MiddleFactor + link.height / 2;
            y1 = link.source.y + link.dySource + link.height / SankeyDiagram.MiddleFactor - link.height / 2;

            // close path to get closed area
            pathParams += ` Z`;

            return pathParams;
        }

        private renderTooltip(selection: Selection<SankeyDiagramNode | SankeyDiagramLink>): void {
            this.tooltipServiceWrapper.addTooltip(
                selection,
                (tooltipEvent: TooltipEventArgs<TooltipEnabledDataPoint>) => {
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

            const behaviorOptions: SankeyDiagramBehaviorOptions = {
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

        public onClearSelection(): void {
            if (this.interactivityService) {
                this.interactivityService.clearSelection();
            }
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            const settings: SankeyDiagramSettings = this.dataView && this.dataView.settings
                || SankeyDiagramSettings.getDefault() as SankeyDiagramSettings;

            const instanceEnumeration: VisualObjectInstanceEnumeration =
                SankeyDiagramSettings.enumerateObjectInstances(settings, options);

            if (options.objectName === SankeyDiagram.LinksPropertyIdentifier.objectName) {
                this.enumerateLinks(instanceEnumeration);
            }

            return instanceEnumeration || [];
        }

        private enumerateLinks(instanceEnumeration: VisualObjectInstanceEnumeration): void {
            const links: SankeyDiagramLink[] = this.dataView && this.dataView.links;

            if (!links || !(links.length > 0)) {
                return;
            }

            links.forEach((link: SankeyDiagramLink) => {
                const identity: ISelectionId = link.identity as ISelectionId,
                    displayName: string = `${link.source.label.formattedName} - ${link.destination.label.formattedName}`;

                this.addAnInstanceToEnumeration(instanceEnumeration, {
                    displayName,
                    objectName: SankeyDiagram.LinksPropertyIdentifier.objectName,
                    selector: ColorHelper.normalizeSelector(identity.getSelector(), false),
                    properties: {
                        fill: { solid: { color: link.color } }
                    }
                });
            });
        }

        private addAnInstanceToEnumeration(
            instanceEnumeration: VisualObjectInstanceEnumeration,
            instance: VisualObjectInstance): void {

            if ((instanceEnumeration as VisualObjectInstanceEnumerationObject).instances) {
                (instanceEnumeration as VisualObjectInstanceEnumerationObject)
                    .instances
                    .push(instance);
            } else {
                (instanceEnumeration as VisualObjectInstance[]).push(instance);
            }
        }
    }
}
