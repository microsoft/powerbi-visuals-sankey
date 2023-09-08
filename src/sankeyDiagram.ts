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
import "../style/visual.less";
import powerbi from "powerbi-visuals-api";

// lodash
import lodashCloneDeep from "lodash.clonedeep";

// d3
import { select as d3Select, Selection as d3Selection } from "d3-selection";
import { drag as d3Drag, D3DragEvent } from "d3-drag";
import { max as d3Max, min as d3Min } from "d3-array";
import { scaleLog as d3ScaleLog, scaleLinear as d3ScaleLinear, ScaleContinuousNumeric } from "d3-scale";
import { rgb as d3Rgb } from "d3-color";
import { interpolateNumber as d3InterpolateNumber } from "d3-interpolate";

type Selection<T> = d3Selection<any, T, any, any>;
type UpdateSelection<T> = d3Selection<any, T, any, any>;

// powerbi
import DataView = powerbi.DataView;
import IViewport = powerbi.IViewport;
import DataViewObjects = powerbi.DataViewObjects;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import DataViewMatrixNode = powerbi.DataViewMatrixNode;
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
import { IMargin, manipulation, CssConstants } from "powerbi-visuals-utils-svgutils";
import translate = manipulation.translate;
import ClassAndSelector = CssConstants.ClassAndSelector;
import createClassAndSelector = CssConstants.createClassAndSelector;

// powerbi.extensibility.utils.type
import { pixelConverter } from "powerbi-visuals-utils-typeutils";
import fromPoint = pixelConverter.fromPoint;

// powerbi.extensibility.utils.formatting
import { valueFormatter, textMeasurementService, interfaces } from "powerbi-visuals-utils-formattingutils";
import TextProperties = interfaces.TextProperties;
import IValueFormatter = valueFormatter.IValueFormatter;

// powerbi.extensibility.utils.interactivity
import { interactivitySelectionService, interactivityBaseService } from "powerbi-visuals-utils-interactivityutils";
import appendClearCatcher = interactivityBaseService.appendClearCatcher;
import SelectableDataPoint = interactivitySelectionService.SelectableDataPoint;
import IInteractiveBehavior = interactivityBaseService.IInteractiveBehavior;
import IInteractivityService = interactivityBaseService.IInteractivityService;
import createInteractivitySelectionService = interactivitySelectionService.createInteractivitySelectionService;

// powerbi.extensibility.utils.tooltip
import {
    ITooltipServiceWrapper,
    TooltipEnabledDataPoint,
    createTooltipServiceWrapper
} from "powerbi-visuals-utils-tooltiputils";

// powerbi.extensibility.utils.color
import { ColorHelper } from "powerbi-visuals-utils-colorutils";

import {
    SankeyDiagramSettings,
    DataLabelsSettings,
    CyclesDrawType,
    ViewportSize,
    SankeyDiagramScaleSettings,
    FontSizeDefaultOptions
} from "./settings";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";

import {
    SankeyDiagramColumn,
    SankeyDiagramCycleDictionary,
    SankeyDiagramDataView,
    SankeyDiagramLabel,
    SankeyDiagramLink,
    SankeyDiagramNode,
    SankeyDiagramNodePositionSetting,
    SankeyDiagramNodeStatus,
    SankeyDiagramRoleNames,
    SankeyLinkDirrections
} from "./dataInterfaces";

import * as sankeyDiagramUtils from "./utils";

import {
    SankeyDiagramBehaviorOptions,
    SankeyDiagramBehavior
} from "./behavior";

export class SankeyDiagram implements IVisual {
    private static ClassName: string = "sankeyDiagram";

    private static NodeSelector: ClassAndSelector = createClassAndSelector("node");
    private static NodesSelector: ClassAndSelector = createClassAndSelector("nodes");
    private static NodeRectSelector: ClassAndSelector = createClassAndSelector("nodeRect");
    private static NodeLabelSelector: ClassAndSelector = createClassAndSelector("nodeLabel");

    private static LinksSelector: ClassAndSelector = createClassAndSelector("links");
    private static LinkSelector: ClassAndSelector = createClassAndSelector("link");
    private static BackwardLinkSelector: ClassAndSelector = createClassAndSelector("linkBackward");
    private static SelftLinkSelector: ClassAndSelector = createClassAndSelector("linkSelf");
    private static LinkLabelPathsSelector: ClassAndSelector = createClassAndSelector("linkLabelPaths");
    private static LinkLabelTextsSelector: ClassAndSelector = createClassAndSelector("linkLabelTexts");

    private static DefaultColourOfLink: string = "black";

    private static LinksPropertyIdentifier: DataViewObjectPropertyIdentifier = {
        objectName: "links",
        propertyName: "fill"
    };

    private static NodesPropertyIdentifier: DataViewObjectPropertyIdentifier = {
        objectName: "nodes",
        propertyName: "fill"
    };

    private static MinWidthOfLabel: number = 21;

    private static NodeBottomMargin: number = 5; // 5%

    private static NodeMargin: number = 5;
    private static LabelMargin: number = 4;

    private static DefaultFormatOfWeight: string = "g";

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
    private static DefaultMinRangeOfScale = 3;
    private static MinRangeOfScale = 0;
    private static DefaultMaxRangeOfScale = 100;

    public static DuplicatedNamePostfix: string = "_SK_SELFLINK";

    private static DefaultWeightOfLink: number = 1;

    private static MinHeightOfNode: number = 1;

    private static ScaleStep: number = 0.1;
    private static ScaleStepLimit: number = 1;

    private static NegativeValueRange: number = 0;

    private static BackwardPsudoNodeMargin: number = 5;

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

    private static NodeAndBackwardLinkDistance: number = 5;
    private static DistanceBetweenLinks: number = 3;

    private root: Selection<any>;
    private clearCatcher: Selection<any>;
    private main: Selection<any>;
    private nodes: Selection<SankeyDiagramNode>;
    private links: Selection<SankeyDiagramLink>;

    private colorPalette: IColorPalette;
    private colorHelper: ColorHelper;
    private visualHost: IVisualHost;
    private localizationManager: ILocalizationManager;

    private viewport: IViewport;

    private dataView: SankeyDiagramDataView;

    private interactivityService: IInteractivityService<SelectableDataPoint>;
    private behavior: IInteractiveBehavior;

    private tooltipServiceWrapper: ITooltipServiceWrapper;

    private fontFamily: string;

    public static SourceCategoryIndex: number = 0;
    public static DestinationCategoryIndex: number = 1;
    public static FirstValueIndex: number = 0;

    public sankeyDiagramSettings: SankeyDiagramSettings;
    private formattingSettingsService: FormattingSettingsService;

    private get textProperties(): TextProperties {
        return {
            fontFamily: this.dataView
                ? this.dataView.settings.labels.fontFamily.value
                : DataLabelsSettings.DefaultFontFamily,
            fontSize: fromPoint(this.dataView
                ? this.dataView.settings.labels.fontSize.value
                : FontSizeDefaultOptions.DefaultFontSize)
        };
    }

    constructor(options: VisualConstructorOptions) {
        this.init(options);
    }

    private init(options: VisualConstructorOptions): void {
        this.visualHost = options.host;
        this.localizationManager = this.visualHost.createLocalizationManager();
        this.formattingSettingsService = new FormattingSettingsService(this.localizationManager);

        this.root = d3Select(options.element)
            .append("svg")
            .classed(SankeyDiagram.ClassName, true);

        this.interactivityService = createInteractivitySelectionService(this.visualHost);
        this.behavior = SankeyDiagramBehavior.create();
        this.clearCatcher = appendClearCatcher(this.root);

        this.colorPalette = this.visualHost.colorPalette;
        this.colorHelper = new ColorHelper(this.colorPalette);

        this.tooltipServiceWrapper = createTooltipServiceWrapper(
            this.visualHost.tooltipService,
            options.element);

        this.fontFamily = this.root.style("font-family");

        this.main = this.root.append("g");

        this.links = this.main
            .append("g")
            .classed(SankeyDiagram.LinksSelector.className, true)
            .attr("role", "listbox")
            .attr("aria-multiselectable", "true");

        this.nodes = this.main
            .append("g")
            .classed(SankeyDiagram.NodesSelector.className, true)
            .attr("role", "listbox")
            .attr("aria-multiselectable", "true");
    }

    public update(visualUpdateOptions: VisualUpdateOptions): void {
        this.visualHost.eventService.renderingStarted(visualUpdateOptions);

        this.updateViewport(visualUpdateOptions.viewport);

        const dataView: DataView = visualUpdateOptions
            && visualUpdateOptions.dataViews
            && visualUpdateOptions.dataViews[0];

        this.sankeyDiagramSettings = this.parseSettings(dataView, visualUpdateOptions.dataViews);

        const sankeyDiagramDataView: SankeyDiagramDataView = this.converter(dataView);

        this.computePositions(sankeyDiagramDataView);

        this.dataView = sankeyDiagramDataView;

        this.applySelectionStateToData();

        this.render(sankeyDiagramDataView);
        this.visualHost.eventService.renderingFinished(visualUpdateOptions);

    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        // nodeComplexSettings are persist properties that we do not want to show in the propery pane
        this.sankeyDiagramSettings.removeNodeComplexSettingsFromPane();

        return this.formattingSettingsService.buildFormattingModel(this.sankeyDiagramSettings);
    }

    private updateViewport(viewport: IViewport): void {
        const height: number = SankeyDiagram.getPositiveNumber(viewport.height);
        const width: number = SankeyDiagram.getPositiveNumber(viewport.width);

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
        this.root
            .attr("height", height)
            .attr("width", width);

        this.main.attr("transform", translate(this.margin.left, this.margin.top));
    }

    private createNewNode(node: DataViewMatrixNode, settings: SankeyDiagramSettings): SankeyDiagramNode {
        const nodeFillColor = this.getColor(
            SankeyDiagram.NodesPropertyIdentifier,
            this.colorPalette.getColor(<string>node.value).value,
            <any>node.objects);
        const nodeStrokeColor = this.colorHelper.getHighContrastColor("foreground", nodeFillColor);

        const name = <any>node.value;

        const textProperties: TextProperties = {
            text: name,
            fontFamily: this.textProperties.fontFamily,
            fontSize: this.textProperties.fontSize
        };
        const label: SankeyDiagramLabel = {
            internalName: name,
            name: name,
            formattedName: name,//valueFormatterForCategories.format((<string>labelsDictionary[item].toString()).replace(SankeyDiagram.DuplicatedNamePostfix, "")),
            width: textMeasurementService.measureSvgTextWidth(textProperties),
            height: textMeasurementService.estimateSvgTextHeight(textProperties),
            color: settings.labels.fill.value.value
        };

        return {
            label: label,
            links: [],
            inputWeight: 0,
            outputWeight: 0,
            backwardWeight: 0,
            selfLinkWeight: 0,
            width: settings.nodesSettings.nodeWidth.value,
            height: 0,
            fillColor: nodeFillColor,
            strokeColor: nodeStrokeColor,
            tooltipInfo: [],
            selectableDataPoints: [],
            settings: null,
            identity: null,
            selected: false
        }
    }

    /*eslint max-lines-per-function: ["error", 200]*/
    public converter(dataView: DataView): SankeyDiagramDataView {
        const settings = this.sankeyDiagramSettings;

        if (!dataView
            || !dataView.matrix
            || !dataView.matrix.rows
            || !dataView.matrix.rows.levels
            || !dataView.matrix.rows.levels[0]
            || !dataView.matrix.rows.levels[0].sources
            || !dataView.matrix.rows.levels[0].sources[0]
            || !dataView.matrix.rows.levels[0].sources[0].displayName
            || !dataView.matrix.rows.levels[1]
            || !dataView.matrix.rows.levels[1].sources
            || !dataView.matrix.rows.levels[1].sources[0]
            || !dataView.matrix.rows.levels[1].sources[0].displayName
            || !dataView.matrix.rows.root
            || !dataView.matrix.rows.root.children
            || !dataView.matrix.valueSources) {
            return {
                settings,
                nodes: [],
                links: [],
                columns: []
            }
        }

        const nodes: SankeyDiagramNode[] = [];
        let links: SankeyDiagramLink[] = [];

        const valueSources = dataView.matrix.valueSources;
        const sourceLabelIndex: number = valueSources.indexOf(valueSources.filter((column: powerbi.DataViewMetadataColumn) => {
            return column.roles.SourceLabels;
        }).pop());

        const weightIndex: number = valueSources.indexOf(valueSources.filter((source: powerbi.DataViewMetadataColumn) => {
            return source.roles.Weight;
        }).pop());

        const sourceFieldName = dataView.matrix.rows.levels[0].sources[0].displayName;
        const destinationFieldName = dataView.matrix.rows.levels[1].sources[0].displayName;
        const valueFieldName = dataView.matrix.valueSources[weightIndex] ? dataView.matrix.valueSources[weightIndex].displayName : null;
        const formatOfWeight = valueFormatter.getFormatStringByColumn(valueSources[weightIndex]);
        const weightValues: number[] = [1];

        dataView.matrix.rows.root.children.forEach(parent => {
            const newSourceNode = this.createNewNode(parent, settings)
            newSourceNode.identity = this.visualHost.createSelectionIdBuilder()
                .withMatrixNode(parent, dataView.matrix.rows.levels)
                .createSelectionId();
            nodes.push(newSourceNode);

        });

        dataView.matrix.rows.root.children.forEach(parent => {
            const foundSource: SankeyDiagramNode = nodes.find(found => found.label.name === parent.value)
            parent.children.forEach(child => {
                let linkLabel = undefined;
                let weight: number = SankeyDiagram.DefaultWeightValue;

                let foundDestination: SankeyDiagramNode = nodes.find(found => found.label.name === child.value)
                const selfLinkFound: boolean = foundDestination === foundSource;

                if (!foundDestination) {
                    foundDestination = this.createNewNode(child, settings);
                    foundDestination.identity = this.visualHost.createSelectionIdBuilder()
                        .withMatrixNode(parent, dataView.matrix.rows.levels)
                        .withMatrixNode(child, dataView.matrix.rows.levels)
                        .createSelectionId();
                    nodes.push(foundDestination);
                }
                if (sourceLabelIndex != -1) {
                    linkLabel = (child.values[sourceLabelIndex] && child.values[sourceLabelIndex].value) ?
                        child.values[sourceLabelIndex].value || SankeyDiagram.DefaultWeightValue : SankeyDiagram.MinWeightValue;
                }
                // If weights are present, populate the weights array
                if (weightIndex != -1) {
                    weight = (child.values[weightIndex] && child.values[weightIndex].value) ?
                        Number(child.values[weightIndex].value) || SankeyDiagram.DefaultWeightValue : SankeyDiagram.MinWeightValue;
                    weightValues.push(weight);
                }
                const linkFillColor = this.getColor(
                    SankeyDiagram.LinksPropertyIdentifier,
                    SankeyDiagram.DefaultColourOfLink,
                    child.objects);
                const linkStrokeColor = this.colorHelper.isHighContrast ? this.colorHelper.getHighContrastColor("foreground", linkFillColor) : linkFillColor;

                const valuesFormatterForLinkTooltipInfo = valueFormatter.create({
                    format: formatOfWeight,
                    value: Math.max(
                        +settings.labels.unit.value !== 0 ? +settings.labels.unit.value : d3Max(weightValues) || SankeyDiagram.MinWeightValue,
                        SankeyDiagram.MinWeightValue),
                });

                const tooltipInfo = SankeyDiagram.getTooltipDataForLink(
                    valuesFormatterForLinkTooltipInfo,
                    foundSource.label.formattedName,
                    foundDestination.label.formattedName,
                    weight,
                    sourceFieldName,
                    destinationFieldName,
                    valueFieldName
                );

                const link: SankeyDiagramLink = {
                    label: linkLabel && linkLabel.toString(),
                    source: foundSource,
                    destination: foundDestination,
                    weight: weight,
                    height: 10,
                    fillColor: linkFillColor,
                    strokeColor: linkStrokeColor,
                    shiftByAxisYSource: 0,
                    shiftByAxisYDestination: 0,
                    tooltipInfo: tooltipInfo,
                    identity: this.visualHost.createSelectionIdBuilder()
                        .withMatrixNode(parent, dataView.matrix.rows.levels)
                        .withMatrixNode(child, dataView.matrix.rows.levels)
                        .createSelectionId(),
                    selected: false,
                    direction: SankeyLinkDirrections.Forward
                }

                const linkDataPoint: SelectableDataPoint = SankeyDiagram.createSelectableDataPoint(<ISelectionId>link.identity);

                // preventing double copying of selectableDataPoints and links to a node with selflink 
                if (!selfLinkFound){
                    foundSource.selectableDataPoints.push(linkDataPoint);
                    foundSource.links.push(link);
                }
                foundDestination.selectableDataPoints.push(linkDataPoint);
                foundDestination.links.push(link);
                links.push(link);

                SankeyDiagram.updateValueOfNode(foundSource);
                SankeyDiagram.updateValueOfNode(foundDestination);
            });
        });

        const valuesFormatterForWeight = valueFormatter.create({
            format: formatOfWeight,
            value: Math.max(
                +settings.labels.unit.value !== 0 ? +settings.labels.unit.value : d3Max(weightValues) || SankeyDiagram.MinWeightValue,
                SankeyDiagram.MinWeightValue),
        });

        const cycles: SankeyDiagramCycleDictionary = this.checkCycles(nodes);

        if (settings.cyclesLinks.drawCycles.value.value === CyclesDrawType.Duplicate) {
            links = this.processCyclesForwardLinks(cycles, nodes, links);
        }

        // add ColorPicker for each node and link to the Format pane
        this.sankeyDiagramSettings.populateNodesColorSelector(nodes);
        this.sankeyDiagramSettings.populateLinksColorSelector(links);

        const sankeyDiagramDataView = {
            nodes,
            links,
            settings,
            columns: []
        };

        if (settings.cyclesLinks.drawCycles.value.value === CyclesDrawType.Backward) {
            SankeyDiagram.computeXPositions(sankeyDiagramDataView);
            sankeyDiagramDataView.links = this.processCyclesForBackwardLinks(cycles, links);
            sankeyDiagramDataView.links.forEach((link: SankeyDiagramLink) => {
                if (link.destination === link.source) {
                    link.direction = SankeyLinkDirrections.SelfLink;
                    SankeyDiagram.updateValueOfNode(link.source);
                }
            });
        }

        nodes.forEach((node: SankeyDiagramNode) => {
            node.tooltipInfo = SankeyDiagram.getTooltipForNode(
                valuesFormatterForWeight,
                node.label.formattedName,
                node.inputWeight + node.selfLinkWeight,
                node.outputWeight + node.selfLinkWeight,
                this.localizationManager
            );
        });

        this.checkNodePositionSettings(nodes, settings);
        this.restoreNodePositions(nodes, settings);
        return sankeyDiagramDataView;
    }

    private static swapNodes(link: SankeyDiagramLink) {
        link.direction = SankeyLinkDirrections.Backward;
        const source = link.source;
        link.source = link.destination;
        link.destination = source;
        SankeyDiagram.updateValueOfNode(link.destination);
        SankeyDiagram.updateValueOfNode(link.source);
    }

    private processCyclesForwardLinks(cycles: SankeyDiagramCycleDictionary, nodes: SankeyDiagramNode[], links: SankeyDiagramLink[]): SankeyDiagramLink[] {
        for (const nodeName of Object.keys(cycles)) {
            cycles[nodeName].forEach((cycleNode: SankeyDiagramNode) => {
                const nodeCopy: SankeyDiagramNode = lodashCloneDeep(cycleNode);
                nodeCopy.label.name += SankeyDiagram.DuplicatedNamePostfix;
                nodeCopy.selectableDataPoints = cycleNode.selectableDataPoints;
                nodeCopy.links = cycleNode.links;
                nodeCopy.cloneLink = cycleNode;
                cycleNode.cloneLink = nodeCopy;

                // create a clone of the node and save a link to each other. In selection behavior, selection of clone lead to select original and visa versa
                nodeCopy.links = cycleNode.links.filter((link: SankeyDiagramLink) => {
                    if (link.source === cycleNode || link.source === link.destination) {
                        return true;
                    }
                    return false;
                });

                 // copy only! output links to new node;
                 nodeCopy.links.forEach((link: SankeyDiagramLink) => {
                    link.source = nodeCopy;
                });

                // remove output links from original node
                cycleNode.links = cycleNode.links.filter((link: SankeyDiagramLink) => {
                    if (link.destination === cycleNode || link.destination === link.source) {
                        return true;
                    }

                    return false;
                });
                
                SankeyDiagram.updateValueOfNode(cycleNode);
                SankeyDiagram.updateValueOfNode(nodeCopy);
                nodes.push(nodeCopy);
            });
        }
        return links;
    }

    // in this method we breaking simple cycles
    private processCyclesForBackwardLinks(cycles: SankeyDiagramCycleDictionary, links: SankeyDiagramLink[]): SankeyDiagramLink[] {
        for (const nodeName of Object.keys(cycles)) {
            cycles[nodeName].forEach((cycleNode: SankeyDiagramNode) => {
                // make output links as backward links for node
                const outputLinks = cycleNode.links.filter((link: SankeyDiagramLink) => {
                    if (link.source === cycleNode && link.destination.label.name === nodeName) {
                        return true;
                    }
                    return false;
                });

                outputLinks.forEach((link: SankeyDiagramLink) => {
                    link.direction === SankeyLinkDirrections.Backward;
                    SankeyDiagram.swapNodes(link);
                });

                SankeyDiagram.updateValueOfNode(cycleNode);
            });
        }

        return links;
    }

    private checkNodePositionSettings(nodes: SankeyDiagramNode[], settings: SankeyDiagramSettings) {
        const nodePositions: SankeyDiagramNodePositionSetting[] = settings._nodePositions;

        nodePositions.forEach((position: SankeyDiagramNodePositionSetting) => {
            const check: boolean = nodes.some((node: SankeyDiagramNode) => {
                if (node.label.name === position.name) {
                    return true;
                }

                return false;
            });

            // if check failed then reset positions
            if (!check) {
                settings.nodeComplexSettings.nodePositions.value = "{}";
                settings._nodePositions = [];
            }
        });
    }

    private restoreNodePositions(nodes: SankeyDiagramNode[], settings: SankeyDiagramSettings) {
        nodes.forEach((node: SankeyDiagramNode) => {
            const nodeSettings: SankeyDiagramNodePositionSetting = this.getNodeSettings(node.label.name, settings);
            node.settings = nodeSettings;
        });
    }

    public static dfs(nodes: SankeyDiagramNode[], currNode: SankeyDiagramNode, nodesStatuses: SankeyDiagramNodeStatus[], simpleCycles: SankeyDiagramCycleDictionary): void {
        nodesStatuses[currNode.label.name].status = SankeyDiagramNodeStatus.Processing;

        currNode.links.forEach((link: SankeyDiagramLink) => {
            // consider only output links
            if (link.source !== currNode) {
                return;
            }

            // get node by output link
            const nextNode: SankeyDiagramNode = link.destination;
            // move to next not visited node
            if (nodesStatuses[nextNode.label.name].status === SankeyDiagramNodeStatus.NotVisited) {
                SankeyDiagram.dfs(nodes, nextNode, nodesStatuses, simpleCycles);
            }
            // if cycle was found
            if (nodesStatuses[nextNode.label.name].status === SankeyDiagramNodeStatus.Processing) {
                // add item to dictionary
                const cycleName: string = nextNode.label.name;

                if (!simpleCycles[cycleName]) {
                    simpleCycles[cycleName] = <SankeyDiagramNode[]>[];
                }

                // push current node always as the last
                simpleCycles[cycleName].push(currNode);
            }
        });

        nodesStatuses[currNode.label.name].status = SankeyDiagramNodeStatus.Visited;
    }

    // Depth-First Search
    private checkCycles(nodes: SankeyDiagramNode[]): SankeyDiagramCycleDictionary {
        const nodesStatuses: SankeyDiagramNodeStatus[] = [];

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

        const simpleCycles: SankeyDiagramCycleDictionary = {};

        nodes.forEach((node: SankeyDiagramNode) => {
            if (nodesStatuses[node.label.name].status === SankeyDiagramNodeStatus.NotVisited &&
                node.links.length > 0) {
                SankeyDiagram.dfs(nodes, node, nodesStatuses, simpleCycles);
            }
        });

        return simpleCycles;
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
        settings._nodePositions.some((nodePositions: SankeyDiagramNodePositionSetting) => {
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

        const tooltips: VisualTooltipDataItem[] = [
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
        node.inputWeight = 0;
        node.outputWeight = 0;
        node.backwardWeight = 0;
        node.selfLinkWeight = 0;
        node.links.forEach((currentLink: SankeyDiagramLink) => {
            node.inputWeight +=
                currentLink.destination === node &&
                currentLink.destination !== currentLink.source &&
                currentLink.direction === SankeyLinkDirrections.Forward
                ?
                currentLink.weight
                :
                SankeyDiagram.DefaultWeightValue;

            node.inputWeight +=
                currentLink.source === node &&
                currentLink.destination !== currentLink.source &&
                currentLink.direction === SankeyLinkDirrections.Backward
                ?
                currentLink.weight
                :
                SankeyDiagram.DefaultWeightValue;

            node.outputWeight +=
                currentLink.source === node &&
                currentLink.destination !== currentLink.source &&
                currentLink.direction === SankeyLinkDirrections.Forward
                ?
                currentLink.weight
                :
                SankeyDiagram.DefaultWeightValue;

            node.outputWeight +=
                currentLink.destination === node &&
                currentLink.destination !== currentLink.source &&
                currentLink.direction === SankeyLinkDirrections.Backward
                ?
                currentLink.weight
                :
                SankeyDiagram.DefaultWeightValue;

            if (currentLink.direction === SankeyLinkDirrections.Backward) {
                node.backwardWeight = currentLink.weight > node.backwardWeight ? currentLink.weight : node.backwardWeight;
            }

            node.selfLinkWeight += currentLink.direction === SankeyLinkDirrections.SelfLink ? currentLink.weight : 0;
        });
    }

    private static getTooltipForNode(
        valueFormatter: IValueFormatter,
        nodeName: string,
        nodeInputWeight: number,
        nodeOutputWeight: number,
        localizationManager: ILocalizationManager
    ): VisualTooltipDataItem[] {

        let formattedNodeInputWeight: string;
        let formattedNodeOutputWeight: string;

        if (valueFormatter && valueFormatter.format) {
            formattedNodeInputWeight = valueFormatter.format(nodeInputWeight);
            formattedNodeOutputWeight = valueFormatter.format(nodeOutputWeight);
        } else {
            formattedNodeInputWeight = nodeInputWeight.toString();
            formattedNodeOutputWeight = nodeOutputWeight.toString();
        }

        const tooltips: VisualTooltipDataItem[] = [
            {
                displayName: localizationManager.getDisplayName("Visual_TooltipDisplayName"),
                value: nodeName
            },
            {
                displayName: localizationManager.getDisplayName("Visual_TooltipDisplayInput"),
                value: formattedNodeInputWeight
            },
            {
                displayName: localizationManager.getDisplayName("Visual_TooltipDisplayOutput"),
                value: formattedNodeOutputWeight
            }
        ];

        return tooltips;
    }

    private parseSettings(dataView: DataView, dataViews: DataView[]): SankeyDiagramSettings {
        const settings: SankeyDiagramSettings = this.formattingSettingsService.populateFormattingSettingsModel(SankeyDiagramSettings, dataViews);

        // detect sorting chosen
        const foundSortedColumn = dataView.metadata.columns.find(col => col.sort !== undefined);
        if (foundSortedColumn) {
            settings.sort = foundSortedColumn.displayName + "|" + foundSortedColumn.sort;
        }

        // change settings from high contrast mode
        settings.labels.fill.value.value = this.colorHelper.getHighContrastColor("foreground", settings.labels.fill.value.value);
        settings.linkLabels.fill.value.value = this.colorHelper.getHighContrastColor("foreground", settings.linkLabels.fill.value.value);
        // node positions
        try {
            settings._nodePositions = <SankeyDiagramNodePositionSetting[]>JSON.parse(settings.nodeComplexSettings.nodePositions.value);
        }
        catch (exception) {
            settings._nodePositions = [];
            settings.nodeComplexSettings.nodePositions.value = "[]";
        }

        // viewport size
        try {
            settings._viewportSize = <ViewportSize>JSON.parse(settings.nodeComplexSettings.viewportSize.value);
        }
        catch (exception) {
            settings._nodePositions = settings._nodePositions || [];
            settings.nodeComplexSettings.viewportSize.value = "{}";
        }
        return settings;
    }

    private computePositions(sankeyDiagramDataView: SankeyDiagramDataView): void {
        let maxColumn: SankeyDiagramColumn,
            columns: SankeyDiagramColumn[];

        const maxXPosition: number = SankeyDiagram.computeXPositions(sankeyDiagramDataView);

        SankeyDiagram.sortNodesByX(sankeyDiagramDataView.nodes);

        let scaleShift: number = 0;
        let minWeight: number = 1;
        let minHeight: number = 1;
        let scaleStepCount: number = 0;

        let minWeightShift: number = 0;
        const minWeightLink = sankeyDiagramDataView.links.find(link => link.weight === Math.min(...sankeyDiagramDataView.links.map(link => link.weight)));
        if (minWeightLink) {
            minWeightShift = minWeightLink.weight;
        }
        if (minWeightShift > 0) {
            minWeightShift = 0;
        }

        const minWeightInData: number = minWeightShift;
        minWeightShift = Math.abs(minWeightShift) + minWeight;
        let maxWeightInData: number = 0;
        const maxWeightLink = sankeyDiagramDataView.links.find(link => link.weight === Math.max(...sankeyDiagramDataView.links.map(link => link.weight)));
        if (maxWeightLink) {
            maxWeightInData = maxWeightLink.weight;
        }

        const minRangeOfScale: number = sankeyDiagramDataView.settings.scale.provideMinHeight.value ? SankeyDiagram.DefaultMinRangeOfScale : SankeyDiagram.MinRangeOfScale;

        while (minHeight <= SankeyDiagram.MinHeightOfNode && scaleStepCount < SankeyDiagram.ScaleStepLimit) {
            let weightScale: ScaleContinuousNumeric<number, number, any>;

            if (sankeyDiagramDataView.settings.scale.lnScale.value) {
                weightScale = d3ScaleLog()
                    .base(Math.E)
                    .domain([Math.exp(SankeyDiagram.MinDomainOfScale + scaleShift), Math.exp(SankeyDiagram.MaxDomainOfScale + scaleShift)])
                    .range([minRangeOfScale, SankeyDiagram.DefaultMaxRangeOfScale]);
            } else {
                weightScale = d3ScaleLinear()
                    .domain([minWeightInData + scaleShift, maxWeightInData + scaleShift])
                    .range([minRangeOfScale, SankeyDiagram.DefaultMaxRangeOfScale]);
            }

            sankeyDiagramDataView.links.forEach((l) => {
                l.weight = weightScale(l.weight + minWeightShift);

                if (Number.NEGATIVE_INFINITY === l.weight || Number.POSITIVE_INFINITY === l.weight || isNaN(l.weight)) {
                    l.weight = 0;
                }
            });

            if (sankeyDiagramDataView.links.some((link: SankeyDiagramLink) => link.weight <= SankeyDiagram.NegativeValueRange)) {
                let minWeight: number = sankeyDiagramDataView.links[0].weight;
                sankeyDiagramDataView.links.forEach((link: SankeyDiagramLink) => {
                    if (link.weight <= minWeight) {
                        minWeight = link.weight;
                    }
                });

                minWeight = Math.abs(minWeight);
                // shift weight values to eliminate negative values
                sankeyDiagramDataView.links.forEach((link: SankeyDiagramLink) => {
                    link.weight += minWeight;
                });
            }

            sankeyDiagramDataView.nodes.forEach((node: SankeyDiagramNode) => {
                SankeyDiagram.updateValueOfNode(node);
            });

            columns = this.getColumns(sankeyDiagramDataView.nodes);
            maxColumn = SankeyDiagram.getMaxColumn(columns);

            minWeight = d3Min(sankeyDiagramDataView.nodes.filter((n) => Math.max(n.inputWeight, n.outputWeight) > 0).map((n) => Math.max(n.inputWeight, n.outputWeight)));
            minWeight = minWeight || SankeyDiagram.DefaultWeightOfLink;
            sankeyDiagramDataView.settings._scale.y = this.getScaleByAxisY(maxColumn.sumValueOfNodes);

            minHeight = minWeight * sankeyDiagramDataView.settings._scale.y;

            scaleShift += SankeyDiagram.ScaleStep;
            scaleStepCount++;
        }
        sankeyDiagramDataView.settings._scale.x = this.getScaleByAxisX(maxXPosition);

        SankeyDiagram.scalePositionsByAxes(
            sankeyDiagramDataView.settings.sort,
            sankeyDiagramDataView.nodes,
            columns,
            sankeyDiagramDataView.settings._scale,
            this.viewport.height,
            sankeyDiagramDataView.settings.cyclesLinks.selfLinksWeight.value && sankeyDiagramDataView.settings.cyclesLinks.drawCycles.value.value === CyclesDrawType.Backward
        );

        this.computeYPosition(
            sankeyDiagramDataView.nodes,
            sankeyDiagramDataView.settings._scale.y,
            sankeyDiagramDataView.settings.cyclesLinks.selfLinksWeight.value && sankeyDiagramDataView.settings.cyclesLinks.drawCycles.value.value === CyclesDrawType.Backward
        );

        this.applySavedPositions(sankeyDiagramDataView);

        this.computeBordersOfTheNode(sankeyDiagramDataView);
        SankeyDiagram.computeIntersections(sankeyDiagramDataView);
    }

    private applySavedPositions(sankeyDiagramDataView: SankeyDiagramDataView) {
        // if size were changed shift positions of nodes
        const viewPort: ViewportSize = sankeyDiagramDataView.settings._viewportSize;
        let scaleHeight: number = 1;
        if (+viewPort.height !== this.viewport.height && viewPort.height && +viewPort.height !== 0) {
            scaleHeight = this.viewport.height / +viewPort.height;
        }
        let scaleWidth: number = 1;
        if (+viewPort.width !== this.viewport.width && viewPort.width && +viewPort.width !== 0) {
            scaleWidth = this.viewport.width / +viewPort.width;
        }

        sankeyDiagramDataView.nodes.forEach((node: SankeyDiagramNode) => {
            if (node.settings !== null) {
                node.x = (+node.settings.x) * scaleWidth;
                node.y = (+node.settings.y) * scaleHeight;
            }
        });
    }

    private computeBordersOfTheNode(sankeyDiagramDataView: SankeyDiagramDataView): void {
        sankeyDiagramDataView.nodes.forEach((node: SankeyDiagramNode) => {
            const textHeight: number = textMeasurementService.estimateSvgTextHeight({
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

    private static getUniqueLinks(links: SankeyDiagramLink[]) {
        const unique = {};

        links.forEach((link: SankeyDiagramLink) => {
            unique[link.source.label.name + link.destination.label.name + link.direction] = link;
        });

        const newarray = [];
        for (const key of Object.keys(unique)) {
            newarray.push(unique[key]);
        }

        return newarray;
    }

    private static computeXPositions(sankeyDiagramDataView: SankeyDiagramDataView): number {
        let nodes: SankeyDiagramNode[] = sankeyDiagramDataView.nodes,
            nextNodes: SankeyDiagramNode[] = [],
            previousNodes: SankeyDiagramNode[] = [],
            x: number = SankeyDiagram.DefaultPosition,
            isRecursiveDependencies: boolean = false;

        while (nodes.length > 0) {
            nextNodes = [];

            nodes.forEach((currentNode: SankeyDiagramNode) => {
                currentNode.x = x;

                // put all destination nodes from current node to nextNodes
                currentNode.links.forEach((link: SankeyDiagramLink) => {
                    if (currentNode === link.source && currentNode !== link.destination) {
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
        const columns: SankeyDiagramColumn[] = [];

        nodes.forEach((node: SankeyDiagramNode) => {
            if (!columns[node.x]) {
                columns[node.x] = {
                    countOfNodes: SankeyDiagram.DefaultCountOfNodes,
                    sumValueOfNodes: SankeyDiagram.DefaultSumValueOfNodes
                };
            }

            columns[node.x].sumValueOfNodes += Math.max(node.inputWeight, node.outputWeight);
            columns[node.x].countOfNodes++;

            let nodeBackwardWeight = 0;
            let nodeSelflinkWeight = 0;

            // if node containg backward link it influence to node position (nodes shifts to down)
            if (node.links.some((link: SankeyDiagramLink) => {
                return link.direction === SankeyLinkDirrections.Backward ? true : false;
            })) {
                nodeBackwardWeight = node.backwardWeight;
                columns[node.x].countOfNodes++;
            }

            if (node.links.some((link: SankeyDiagramLink) => {
                return link.direction === SankeyLinkDirrections.SelfLink ? true : false;
            })) {
                nodeSelflinkWeight = node.selfLinkWeight;
                columns[node.x].sumValueOfNodes += node.selfLinkWeight;
                columns[node.x].countOfNodes++;
            }

            columns[node.x].sumValueOfNodes += nodeBackwardWeight > nodeSelflinkWeight ? nodeBackwardWeight : nodeSelflinkWeight;
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

    private static sortColumns(
        nodes: SankeyDiagramNode[],
        columns: SankeyDiagramColumn[],
        ascending: boolean,
        sortBy: string): SankeyDiagramNode[] {

        let sortedNodes: SankeyDiagramNode[] = [];
        let current: number = 0;



        columns.forEach(col => {
            const sortedColumn = nodes
                .slice(current, current + col.countOfNodes)
                .sort((a, b) => {
                    let x, y;
                    if (sortBy === "name") {
                        x = a.label.name;
                        y = b.label.name;
                    } else if (sortBy === "weight") {
                        x = Math.max(a.inputWeight, a.outputWeight);
                        y = Math.max(b.inputWeight, b.outputWeight);
                    }
                    return (ascending ? 1 : -1) * ((x < y) ? -1 : ((x > y) ? 1 : 0));
                });
            sortedNodes = [...sortedNodes, ...sortedColumn];
            current += col.countOfNodes;
        });

        return sortedNodes;
    }

    /*
        This method scales positions and compute positions of node on each column
    */
    private static scalePositionsByAxes(
        sort: string,
        nodes: SankeyDiagramNode[],
        columns: SankeyDiagramColumn[],
        scale: SankeyDiagramScaleSettings,
        viewportHeight: number, ignoreSelfLinkWeight: boolean): void {
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

            let selfLinkHeight: number = d3Max(node.links.filter(l => l.direction === SankeyLinkDirrections.SelfLink).map(l => l.weight));

            if (!selfLinkHeight) {
                selfLinkHeight = 0;
            }
            if (ignoreSelfLinkWeight && selfLinkHeight > 0) {
                selfLinkHeight = node.width;
            }

            node.height = (Math.max(node.inputWeight, node.outputWeight, node.inputWeight + selfLinkHeight, node.outputWeight + selfLinkHeight)
            ) * scale.y;

            const backwardPsudoNodeSpace = d3Max([node.backwardWeight, node.selfLinkWeight]) * scale.y;

            node.y = shiftByAxisY + offsetByY * index + backwardPsudoNodeSpace;
            shiftByAxisY += node.height + backwardPsudoNodeSpace;
            index++;
        });
    }

    // TODO: Update this method to improve a distribution by height.
    private computeYPosition(
        nodes: SankeyDiagramNode[],
        scale: number,
        selfLinksWeight: boolean): void {

        // let uniqueNodes = SankeyDiagram.getUniqueNodes(nodes);
        nodes.forEach((node: SankeyDiagramNode) => {
            node.links = SankeyDiagram.getUniqueLinks(node.links);
            node.links = node.links.sort((firstLink: SankeyDiagramLink, secondLink: SankeyDiagramLink) => {

                const firstY: number = firstLink.source === node
                    ? firstLink.destination.y
                    : firstLink.source.y;

                const secondY: number = secondLink.source === node
                    ? secondLink.destination.y
                    : secondLink.source.y;

                return firstY - secondY;
            });

            let shiftByAxisYOfLeftLink: number = SankeyDiagram.DefaultOffset,
                shiftByAxisYOfRightLink: number = SankeyDiagram.DefaultOffset;

            node.links = node.links.sort((a: SankeyDiagramLink, b: SankeyDiagramLink) => {
                return a.direction < b.direction ? 1 : a.direction > b.direction ? -1 : 0;
            });

            node.links.forEach((link: SankeyDiagramLink) => {
                let shiftByAxisY: number = SankeyDiagram.DefaultOffset;
                link.height = link.weight * scale;

                let fixedLinkHeight: number = link.height;
                if (selfLinksWeight && link.direction === SankeyLinkDirrections.SelfLink) {
                    fixedLinkHeight = node.width;
                }

                if (link.source.x < node.x || link.destination.x < node.x) {
                    if (link.direction !== SankeyLinkDirrections.Backward) {
                        shiftByAxisY = shiftByAxisYOfLeftLink;
                        shiftByAxisYOfLeftLink += fixedLinkHeight;
                    }
                    else {
                        shiftByAxisY = shiftByAxisYOfRightLink;
                        shiftByAxisYOfRightLink += fixedLinkHeight;
                    }
                }
                else {
                    if (link.source.x > node.x || link.destination.x > node.x) {
                        if (link.direction !== SankeyLinkDirrections.Backward) {
                            shiftByAxisY = shiftByAxisYOfRightLink;
                            shiftByAxisYOfRightLink += fixedLinkHeight;
                        }
                        else {
                            shiftByAxisY = shiftByAxisYOfLeftLink;
                            shiftByAxisYOfLeftLink += fixedLinkHeight;
                        }
                    }
                    if (link.source === link.destination) {
                        shiftByAxisYOfRightLink += fixedLinkHeight;
                        shiftByAxisYOfLeftLink += fixedLinkHeight;
                    }
                }

                if (link.source === node) {
                    link.shiftByAxisYSource = shiftByAxisY;
                }
                if (link.destination === node) {
                    link.shiftByAxisYDestination = shiftByAxisY;
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
        const linksSelection: Selection<SankeyDiagramLink> = this.renderLinks(sankeyDiagramDataView);
        this.renderLinkLabels(sankeyDiagramDataView);

        this.renderTooltip(linksSelection);

        const nodesSelection: Selection<SankeyDiagramNode> = this.renderNodes(sankeyDiagramDataView);

        this.renderTooltip(nodesSelection);

        this.bindSelectionHandler(nodesSelection, linksSelection);

        this.updateSelectionState(nodesSelection, linksSelection);
    }

    private renderNodes(sankeyDiagramDataView: SankeyDiagramDataView): Selection<SankeyDiagramNode> {
        const nodeElements: Selection<SankeyDiagramNode> = this.main
            .select(SankeyDiagram.NodesSelector.selectorName)
            .selectAll(SankeyDiagram.NodeSelector.selectorName);

        const nodesSelectionData = nodeElements
            .data(
                sankeyDiagramDataView.nodes
                    .filter((node: SankeyDiagramNode) => {
                        return node.height > SankeyDiagram.MinSize;
                    })
            );

        nodesSelectionData
            .exit()
            .remove();

        const nodesEnterSelection: Selection<SankeyDiagramNode> = nodesSelectionData
            .enter()
            .append("g");

        nodesEnterSelection
            .append("rect")
            .classed(SankeyDiagram.NodeRectSelector.className, true);

        nodesEnterSelection
            .append("text")
            .classed(SankeyDiagram.NodeLabelSelector.className, true);

        const nodesSelectionMerged = nodesEnterSelection.merge(nodeElements);

        nodesSelectionMerged
            .attr("transform", (node: SankeyDiagramNode) => {
                return translate(node.x, node.y);
            })
            .classed(SankeyDiagram.NodeSelector.className, true);


        let nodeTabIndex: number = 0;

        nodesSelectionMerged
            .select(SankeyDiagram.NodeRectSelector.selectorName)
            .style("fill", (node: SankeyDiagramNode) => node.fillColor)
            .style(
                "stroke", (node: SankeyDiagramNode) => this.colorHelper.isHighContrast ? node.strokeColor :
                    d3Rgb(node.fillColor)
                        .darker(SankeyDiagram.StrokeColorFactor)
                        .toString()
            )
            .attr("tabindex", () => ++nodeTabIndex)
            .attr("role", "option")
            .attr("aria-selected", "false")
            .attr('aria-label', (node: SankeyDiagramNode) => `${node.label.name}`)
            .attr("x", SankeyDiagram.DefaultPosition)
            .attr("y", SankeyDiagram.DefaultPosition)
            .attr("height", (node: SankeyDiagramNode) => node.height < SankeyDiagram.MinHeightOfNode ? SankeyDiagram.MinHeightOfNode : node.height)
            .attr("width", (node: SankeyDiagramNode) => node.width);

        nodesSelectionMerged
            .select(SankeyDiagram.NodeLabelSelector.selectorName)
            .attr("x", (node: SankeyDiagramNode) => node.left - node.x)
            .attr("y", (node: SankeyDiagramNode) => node.top - node.y)
            .attr("dy", SankeyDiagram.DefaultDy)
            .style("fill", (node: SankeyDiagramNode) => node.label.color)
            .style("font-family", this.textProperties.fontFamily)
            .style("font-size", this.textProperties.fontSize)
            .style("display", (node: SankeyDiagramNode) => {
                const labelPositionByAxisX: number = this.getCurrentPositionOfLabelByAxisX(node);

                const isNotVisibleLabel: boolean =
                    (labelPositionByAxisX >= this.viewport.width ||
                        labelPositionByAxisX <= SankeyDiagram.MinSize ||
                        (node.height + SankeyDiagram.NodeMargin) < node.label.height) && !sankeyDiagramDataView.settings.labels.forceDisplay.value;

                if (isNotVisibleLabel || !sankeyDiagramDataView.settings.labels.show.value
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

        function dragstarted(event: D3DragEvent<Element, SankeyDiagramNode, SankeyDiagramNode>) {
            event.sourceEvent.stopPropagation();
        }

        const minHeight: number = d3Min(sankeyDiagramDataView.links.map(l => l.height));

        // eslint-disable-next-line
        let self = this;

        function dragged(event: DragEvent, node: SankeyDiagramNode) {
            node.x = event.x;
            node.y = event.y;
            if (node.x < 0) {
                node.x = 0;
            }
            if (node.y < 0) {
                node.y = 0;
            }
            if (node.x + node.width > self.viewport.width) {
                node.x = self.viewport.width - node.width;
            }
            if (node.y + node.height > self.viewport.height) {
                node.y = self.viewport.height - node.height;
            }
            node.settings = {
                x: node.x.toFixed(2), y: node.y.toFixed(2), name: node.label.name
            };
            // Update each link related with this node
            self.main.select(SankeyDiagram.LinksSelector.selectorName)
                .selectAll(SankeyDiagram.LinkSelector.selectorName)
                .filter((currentLink: SankeyDiagramLink) => {
                    return currentLink.source === node || currentLink.destination === node;
                }).attr(
                    // get updated path params based on actual positions of node
                    "d", (link: SankeyDiagramLink) => {
                        if (link.direction === SankeyLinkDirrections.Forward) {
                            return self.getSvgPathForForwardLink(link);
                        }
                        if (link.direction === SankeyLinkDirrections.Backward) {
                            if (link.source.x + link.source.width > link.destination.x) {
                                return self.getSvgPathForForwardLink(link);
                            }
                            return self.getSvgPathForBackwardLink(link, minHeight);
                        }
                        if (link.direction === SankeyLinkDirrections.SelfLink) {
                            return self.getSvgPathForSelfLink(link, minHeight);
                        }
                    }
                );  
            // Update each link label related with this node
            self.root.select("defs")
                .selectAll(SankeyDiagram.LinkLabelPathsSelector.selectorName)
                .filter(function (currentLink: SankeyDiagramLink) {
                    return currentLink.source === node || currentLink.destination === node;
                })
                .attr(
                    "d", (link: SankeyDiagramLink) => {
                        if (link.direction === SankeyLinkDirrections.Forward) {
                            return self.getLinkLabelSvgPath(link);
                        }
                    }
                );

            // Translate the object on the actual moved point
            d3Select(this).attr("transform", translate(node.x, node.y));
        }

        function dragend() {
            self.saveNodePositions(self.dataView.nodes);
            self.saveViewportSize();
        }

        const drag = d3Drag().on("start", dragstarted).on("drag", dragged).on("end", dragend);
        nodesSelectionMerged.call(drag);
        return nodesSelectionMerged;
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
        const nodePositions: SankeyDiagramNodePositionSetting[] = [];
        nodes.forEach((node: SankeyDiagramNode) => {
            if (node.height === 0) {
                return;
            }
            const settings: SankeyDiagramNodePositionSetting = <SankeyDiagramNodePositionSetting>{
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
        const linksElements: Selection<SankeyDiagramLink> = this.main
            .select(SankeyDiagram.LinksSelector.selectorName)
            .selectAll(SankeyDiagram.LinkSelector.selectorName);

        const linksSelectionData: UpdateSelection<SankeyDiagramLink> =
            linksElements
                .data(
                    sankeyDiagramDataView.links.filter((link: SankeyDiagramLink) => {
                        return link.height > SankeyDiagram.MinSize;
                    }).sort((a: SankeyDiagramLink, b: SankeyDiagramLink) => {
                        // sort links to draw forward links in the first, backward links draw as second and selflinks as the last
                        // in this case self links will be on front side
                        return a.direction < b.direction ? -1 : a.direction > b.direction ? 1 : 0;
                    })
                );

        linksSelectionData
            .exit()
            .remove();

        const linksElementsEnter = linksSelectionData
            .enter()
            .append("path");

        const linksElementsMerged = linksElementsEnter.merge(linksElements);

        linksElementsMerged
            .classed(SankeyDiagram.LinkSelector.className, true)
            .classed(SankeyDiagram.BackwardLinkSelector.className, (link: SankeyDiagramLink) => link.direction === SankeyLinkDirrections.Backward)
            .classed(SankeyDiagram.SelftLinkSelector.className, (link: SankeyDiagramLink) => link.direction === SankeyLinkDirrections.SelfLink);


        const minHeight: number = d3Min(sankeyDiagramDataView.links.map(l => l.height));
        let linkTabIndex: number = sankeyDiagramDataView.nodes.length;

        linksElementsMerged
            .attr(
                "d", (link: SankeyDiagramLink) => {
                    if (link.direction === SankeyLinkDirrections.Forward) {
                        return this.getSvgPathForForwardLink(link);
                    }
                    if (link.direction === SankeyLinkDirrections.Backward) {
                        if (link.source.x + link.source.width > link.destination.x) {
                            return this.getSvgPathForForwardLink(link);
                        }
                        return this.getSvgPathForBackwardLink(link, minHeight);
                    }
                    if (link.direction === SankeyLinkDirrections.SelfLink) {
                        return this.getSvgPathForSelfLink(link, minHeight);
                    }
                }
            )
            .attr(
                "id", (link: SankeyDiagramLink) => {
                    return SankeyDiagram.createLinkId(link);
                }
            )
            .attr("tabindex", () => ++linkTabIndex)
            .attr("role", "option")
            .attr("aria-selected", "false")
            .attr('aria-label', (link: SankeyDiagramLink) => `${link.source.label.name} to ${link.destination.label.name} weighted at ${link.weight}`)
            .style("stroke", (link: SankeyDiagramLink) => link.strokeColor)
            .style("fill", (link: SankeyDiagramLink) => link.fillColor);

        return linksElementsMerged;
    }

    public static createLinkId(link: SankeyDiagramLink, addLinkLabelPath: boolean = false): string {
        return (addLinkLabelPath ? `linkLabelPaths` : ``) + `${('_' + link.source.label.name || "")}-${link.direction}-${('_' + link.destination.label.name || "")}`;
    }

    private renderLinkLabels(sankeyDiagramDataView: SankeyDiagramDataView): void {
        // create labels on link as A - B : Value
        const linkTextData: SankeyDiagramLink[] = sankeyDiagramDataView.links.filter((link: SankeyDiagramLink) => {
            return link.height > SankeyDiagram.MinSize && this.dataView.settings.linkLabels.show.value;
        });

        const linkArrowData: SankeyDiagramLink[] = sankeyDiagramDataView.links.filter((link: SankeyDiagramLink) => {
            return link.height > SankeyDiagram.MinSize && link.direction !== SankeyLinkDirrections.SelfLink;
        });

        // add defs element to svg
        const svgDefs: Selection<any> = this.root
            .selectAll("defs");

        const svgDefsSelectionData: UpdateSelection<number> = svgDefs.data([1]);
        const svgDefsSelectionEnter = svgDefsSelectionData
            .enter()
            .append("defs");

        svgDefsSelectionData
            .exit()
            .remove();

        const svgDefsSelectionMerged = svgDefsSelectionEnter.merge(svgDefs);

        const singleDefsElement: Selection<any> = d3Select(svgDefsSelectionMerged.node());

        // add text path for lables
        const linkLabelPaths: Selection<any> = singleDefsElement.selectAll(SankeyDiagram.LinkLabelPathsSelector.selectorName);

        const linkLabelPathsSelectionData: UpdateSelection<SankeyDiagramLink> = linkLabelPaths.data(linkArrowData);

        linkLabelPathsSelectionData
            .exit()
            .remove();

        const linkLabelPathsSelectionEnter = linkLabelPathsSelectionData
            .enter()
            .append("path");

        const linkLabelPathsSelectionMerged = linkLabelPathsSelectionEnter.merge(linkLabelPaths);

        linkLabelPathsSelectionMerged
            .classed(SankeyDiagram.LinkLabelPathsSelector.className, true)
            .attr(
                "d", (link: SankeyDiagramLink) => {
                    if (link.direction === SankeyLinkDirrections.Forward) {
                        return this.getLinkLabelSvgPath(link);
                    }
                }
            )
            .attr(
                "id", (link: SankeyDiagramLink) => {
                    return SankeyDiagram.createLinkId(link, true);
                }
            );

        // add text by using paths from defs
        const linkLabelTexts: Selection<any> = this.main
            .select(SankeyDiagram.LinksSelector.selectorName)
            .selectAll(SankeyDiagram.LinkLabelTextsSelector.selectorName);

        const linkLabelTextSelectionData: UpdateSelection<SankeyDiagramLink> = linkLabelTexts
            .data(linkTextData);

        linkLabelTextSelectionData
            .exit()
            .remove();

        const linkLabelTextSelectionEnter = linkLabelTextSelectionData
            .enter()
            .append("text");

        const linkLabelTextSelectionMerged = linkLabelTextSelectionEnter.merge(linkLabelTexts);

        linkLabelTextSelectionMerged
            .attr("text-anchor", "middle")
            .classed(SankeyDiagram.LinkLabelTextsSelector.className, true);

        const textPathSelection: UpdateSelection<SankeyDiagramLink> = linkLabelTextSelectionMerged
            .selectAll("textPath");

        const textPathSelectionData = textPathSelection.data(data => [data]);

        textPathSelectionData
            .exit()
            .remove();

        const textPathSelectionEnter = textPathSelectionData
            .enter()
            .append("textPath");

        const textPathSelectionMerged = textPathSelectionEnter.merge(textPathSelection);

        textPathSelectionMerged
            .attr("startOffset", "50%")
            .attr(
                "href", (link: SankeyDiagramLink) => {
                    return `#${SankeyDiagram.createLinkId(link, true)}`;
                })
            .style("font-size", this.dataView.settings.linkLabels.fontSize.value)
            .style("fill", this.dataView.settings.linkLabels.fill.value.value)
            .text((link: SankeyDiagramLink) => (link.label && (link.label.length > 0)) ? link.label :
                `${link.source.label.name || ""}-${link.destination.label.name || ""}:${(link.tooltipInfo[2] || { value: "" }).value}`
            );
    }

    private getLinkLabelSvgPath(link: SankeyDiagramLink): string {
        let x0: number, x1: number;

        if (link.destination.x < link.source.x) {
            x0 = link.source.x - 10;
            x1 = link.destination.x + link.destination.width - 10;
        } else {
            x0 = link.source.x + link.source.width + 10;
            x1 = link.destination.x - 10;
        }

        const xi: (t: number) => number = d3InterpolateNumber(x0, x1);
        const x2: number = xi(this.curvatureOfLinks);
        const x3: number = xi(1 - this.curvatureOfLinks);

        const y0: number = link.source.y - (link.direction === SankeyLinkDirrections.Backward ? link.height + SankeyDiagram.NodeAndBackwardLinkDistance : 0) + link.shiftByAxisYSource + link.height / SankeyDiagram.MiddleFactor;
        const y1: number = link.destination.y - (link.direction === SankeyLinkDirrections.Backward ? link.height + SankeyDiagram.NodeAndBackwardLinkDistance : 0) + (link.shiftByAxisYDestination || 0) + link.height / SankeyDiagram.MiddleFactor;

        return `M ${x0} ${y0} C ${x2} ${y0}, ${x3} ${y1}, ${x1} ${y1}`;
    }

    private getSvgPathForSelfLink(link: SankeyDiagramLink, minHeight: number) {
        let pathParams: string = "";
        const distanceBetweenLinks: number = 3;
        const distanceFromNodeToLinks: number = 5;

        let fixedLinkHeight = link.height - distanceBetweenLinks;

        if (this.dataView.settings.cyclesLinks.selfLinksWeight.value && this.dataView.settings.cyclesLinks.drawCycles.value.value === CyclesDrawType.Backward) {
            fixedLinkHeight = Math.min(link.destination.width, minHeight);
        }

        const linkKneeSize: number = Math.min(link.destination.width, minHeight);

        let y0: number,
            y1: number;

        const x0 = link.source.x + link.source.width / 2;
        const x1 = link.destination.x; 

        // drawing area as combination of 4 lines in one path element of svg to fill this area with required color

        y0 = link.source.y
            - (fixedLinkHeight + SankeyDiagram.NodeAndBackwardLinkDistance)
            + link.shiftByAxisYSource + (fixedLinkHeight) / SankeyDiagram.MiddleFactor
            - (fixedLinkHeight) / 2;
        y1 = link.destination.y
            - (fixedLinkHeight + SankeyDiagram.NodeAndBackwardLinkDistance)
            + (link.shiftByAxisYDestination || 0)
            + (fixedLinkHeight) / SankeyDiagram.MiddleFactor - (fixedLinkHeight) / 2;

        pathParams += `M ${x0} ${y0}`;

        pathParams +=
            `C ${link.destination.x + link.destination.width / 2} ${y1},` +
            ` ${link.destination.x + distanceFromNodeToLinks + link.destination.width + linkKneeSize} ${y1},` +
            ` ${link.destination.x + distanceFromNodeToLinks + link.destination.width + linkKneeSize} ${y1 + fixedLinkHeight}`;

        // right border of link
        y0 = link.destination.y - (fixedLinkHeight + SankeyDiagram.NodeAndBackwardLinkDistance)
            + (link.shiftByAxisYDestination || 0) + (fixedLinkHeight) / SankeyDiagram.MiddleFactor + (fixedLinkHeight - distanceBetweenLinks) / 2;
        y1 = link.destination.y - (fixedLinkHeight + SankeyDiagram.NodeAndBackwardLinkDistance)
            + (link.shiftByAxisYDestination || 0) + (fixedLinkHeight) / SankeyDiagram.MiddleFactor - (fixedLinkHeight - distanceBetweenLinks) / 2;

        let limit = y1 + link.destination.width + (fixedLinkHeight) * 2 - link.destination.width - distanceBetweenLinks;
        if (limit > link.destination.y + fixedLinkHeight - linkKneeSize - distanceBetweenLinks) {
            limit = link.destination.y + fixedLinkHeight - linkKneeSize - distanceBetweenLinks;
        }

        pathParams +=
            `C ${link.destination.x + distanceFromNodeToLinks + link.destination.width + linkKneeSize} ` +
            `${link.destination.y}, ` +
            `${link.destination.x + distanceFromNodeToLinks + link.destination.width + linkKneeSize} ${link.destination.y + fixedLinkHeight} ,` +
            `${link.destination.x + link.destination.width} ${link.destination.y + fixedLinkHeight - SankeyDiagram.DistanceBetweenLinks / 2}`;

        pathParams += `L ${link.destination.x + link.destination.width} ${link.destination.y + distanceBetweenLinks}`;

        pathParams += `C ${link.destination.x + link.destination.width} ${link.destination.y + distanceBetweenLinks},`;
        pathParams += `${link.destination.x + distanceFromNodeToLinks + link.destination.width} ${link.destination.y + distanceBetweenLinks},`;
        pathParams += `${link.destination.x + distanceFromNodeToLinks + link.destination.width} ${link.destination.y - SankeyDiagram.NodeAndBackwardLinkDistance / 2}`;

        pathParams += `C ${link.destination.x + distanceFromNodeToLinks + link.destination.width} ${link.destination.y - SankeyDiagram.NodeAndBackwardLinkDistance / 2},`;
        pathParams += `${link.destination.x + distanceFromNodeToLinks + link.destination.width} ${link.destination.y - SankeyDiagram.NodeAndBackwardLinkDistance},`;
        pathParams += `${link.destination.x + link.destination.width} ${link.destination.y - SankeyDiagram.NodeAndBackwardLinkDistance}`;

        pathParams += `L ${x1} ${link.source.y - SankeyDiagram.NodeAndBackwardLinkDistance}`;

        pathParams += `C ${x1} ${link.source.y - SankeyDiagram.NodeAndBackwardLinkDistance},`;
        pathParams += `${x1 - distanceFromNodeToLinks} ${link.source.y - SankeyDiagram.NodeAndBackwardLinkDistance},`;
        pathParams += `${x1 - distanceFromNodeToLinks} ${link.source.y - SankeyDiagram.NodeAndBackwardLinkDistance / 2}`;

        pathParams += `C ${x1 - distanceFromNodeToLinks} ${link.source.y - SankeyDiagram.NodeAndBackwardLinkDistance / 2},`;
        pathParams += ` ${x1 - distanceFromNodeToLinks} ${link.source.y + distanceBetweenLinks},`;
        pathParams += ` ${link.source.x} ${link.source.y + distanceBetweenLinks}`;

        limit = y0 + SankeyDiagram.NodeAndBackwardLinkDistance + fixedLinkHeight;
        if (limit > link.source.y + link.source.height - distanceBetweenLinks) {
            limit = link.source.y + link.source.height - distanceBetweenLinks;
        }

        pathParams += `L ${link.source.x} ${limit}`;

        pathParams +=
            `C ${link.source.x} ${limit},` +
            `${link.source.x - linkKneeSize - distanceFromNodeToLinks} ${limit},` +
            `${link.source.x - linkKneeSize - distanceFromNodeToLinks} ${limit - fixedLinkHeight}`;

        // left border of link
        y1 = link.source.y - (fixedLinkHeight + SankeyDiagram.NodeAndBackwardLinkDistance)
            + (link.shiftByAxisYDestination || 0) + (fixedLinkHeight) / SankeyDiagram.MiddleFactor - (fixedLinkHeight) / 2;

        pathParams +=
            `C ${link.source.x - distanceFromNodeToLinks - linkKneeSize} ${limit - fixedLinkHeight},` +
            `${link.source.x - distanceFromNodeToLinks - linkKneeSize} ${y1},` +
            `${link.source.x + link.source.width / 2} ${y1}`;

        // close path to get closed area
        pathParams += ` Z`;

        return pathParams;
    }

    private getSvgPathForBackwardLink(link: SankeyDiagramLink, minHeight: number) {
        let pathParams: string = "";

        const fixedLinkHeight: number = link.height - SankeyDiagram.DistanceBetweenLinks;
        const linkKneeSize: number = Math.max(fixedLinkHeight, minHeight);

        let xi: (t: number) => number,
            x2: number,
            x3: number,
            y0: number,
            y1: number,
            curveRadius: number,
            curveCenterY: number,
            curveCenterX: number,
            linkInnerKneeSize: number,
            fixedLinkKneeSize: number;

        // drawing area as combination of 4 lines in one path element of svg to fill this area with required color

        // upper border of link
        const x0: number = link.source.x + link.source.width;
        const x1: number = link.destination.x;
        xi = d3InterpolateNumber(x0, x1);
        x2 = xi(this.curvatureOfLinks);
        x3 = xi(1 - this.curvatureOfLinks);
        y0 = link.source.y - (fixedLinkHeight + SankeyDiagram.NodeAndBackwardLinkDistance);
        y1 = link.destination.y - (fixedLinkHeight + SankeyDiagram.NodeAndBackwardLinkDistance);

        pathParams += ` M ${x0} ${y0} C ${x2} ${y0}, ${x3} ${y1}, ${x1} ${y1}`;
        
        // right border of link
        curveCenterX = link.destination.x + link.destination.width;
        curveRadius = fixedLinkHeight + (SankeyDiagram.NodeAndBackwardLinkDistance + link.shiftByAxisYDestination)/2;
        curveCenterY = link.destination.y - SankeyDiagram.NodeAndBackwardLinkDistance - fixedLinkHeight + curveRadius;
        linkInnerKneeSize = (link.destination.selfLinkWeight? Math.min(link.destination.width, minHeight) + SankeyDiagram.DistanceBetweenLinks : 0) + SankeyDiagram.NodeAndBackwardLinkDistance;
        fixedLinkKneeSize = linkKneeSize + SankeyDiagram.NodeAndBackwardLinkDistance;

        if (fixedLinkKneeSize - linkInnerKneeSize < link.destination.width){
            fixedLinkKneeSize = link.destination.width + linkInnerKneeSize;
        }
        
        pathParams +=
            `C ${curveCenterX - link.destination.width/2} ${curveCenterY - curveRadius}, ` +
            `${curveCenterX + fixedLinkKneeSize} ${curveCenterY - curveRadius}, ` +
            `${curveCenterX + fixedLinkKneeSize} ${curveCenterY}`; 

        pathParams +=
            `C ${curveCenterX + fixedLinkKneeSize} ${curveCenterY},` +
            ` ${curveCenterX + fixedLinkKneeSize} ${link.destination.y + fixedLinkHeight + link.shiftByAxisYDestination + SankeyDiagram.DistanceBetweenLinks/2} ,` +
            ` ${curveCenterX} ${link.destination.y + fixedLinkHeight + link.shiftByAxisYDestination}`;

        pathParams += `L ${curveCenterX} ${link.destination.y + link.shiftByAxisYDestination + SankeyDiagram.DistanceBetweenLinks/2}`;

        curveRadius = (link.shiftByAxisYDestination + SankeyDiagram.NodeAndBackwardLinkDistance)/2; 
        curveCenterY = link.destination.y - SankeyDiagram.NodeAndBackwardLinkDistance + curveRadius;
       
        pathParams +=
            `C ${curveCenterX - link.destination.width/2} ${link.destination.y + link.shiftByAxisYDestination + SankeyDiagram.DistanceBetweenLinks/2},` +
            ` ${curveCenterX + linkInnerKneeSize} ${link.destination.y + link.shiftByAxisYDestination + SankeyDiagram.DistanceBetweenLinks/2} ,` +
            ` ${curveCenterX + linkInnerKneeSize} ${curveCenterY}`;      

        pathParams +=
            `C ${curveCenterX + linkInnerKneeSize} ${curveCenterY}, ` +
            `${curveCenterX + linkInnerKneeSize} ${link.destination.y - SankeyDiagram.NodeAndBackwardLinkDistance}, ` +
            `${curveCenterX - link.destination.width/2} ${link.destination.y - SankeyDiagram.NodeAndBackwardLinkDistance}`; 
        // bottom border of link
        xi = d3InterpolateNumber(x0, x1);
        x2 = xi(this.curvatureOfLinks);
        x3 = xi(1 - this.curvatureOfLinks);
        y0 = link.source.y - SankeyDiagram.NodeAndBackwardLinkDistance;
        y1 = link.destination.y - SankeyDiagram.NodeAndBackwardLinkDistance;

        pathParams += `C ${x2} ${y1}, ${x3} ${y0}, ${link.source.x + link.source.width/2} ${y0}`;

        // left border of link
        curveCenterX = link.source.x;
        curveRadius = (link.shiftByAxisYSource + SankeyDiagram.NodeAndBackwardLinkDistance)/2;
        curveCenterY = link.source.y - SankeyDiagram.NodeAndBackwardLinkDistance + curveRadius;
        linkInnerKneeSize = (link.source.selfLinkWeight? Math.min(link.source.width, minHeight) + SankeyDiagram.DistanceBetweenLinks : 0) + SankeyDiagram.NodeAndBackwardLinkDistance;
        fixedLinkKneeSize = linkKneeSize + SankeyDiagram.NodeAndBackwardLinkDistance;

        if (fixedLinkKneeSize - linkInnerKneeSize < link.source.width){
            fixedLinkKneeSize = link.source.width + linkInnerKneeSize;
        }
        pathParams +=
            `C ${curveCenterX + link.source.width/2} ${curveCenterY - curveRadius}, ` +
            `${curveCenterX - linkInnerKneeSize} ${curveCenterY - curveRadius}, ` +
            `${curveCenterX - linkInnerKneeSize} ${curveCenterY}`;

        pathParams +=
            `C ${curveCenterX - linkInnerKneeSize} ${curveCenterY}, ` +
            `${curveCenterX - linkInnerKneeSize} ${link.source.y + link.shiftByAxisYSource + SankeyDiagram.DistanceBetweenLinks/2}, ` +
            `${curveCenterX + link.source.width/2} ${link.source.y + link.shiftByAxisYSource + SankeyDiagram.DistanceBetweenLinks/2}`;

        pathParams += `L ${curveCenterX} ${link.source.y + link.shiftByAxisYSource + SankeyDiagram.DistanceBetweenLinks/2}`;
        pathParams += `L ${curveCenterX} ${link.source.y + fixedLinkHeight + link.shiftByAxisYSource}`;

        curveRadius = fixedLinkHeight + (SankeyDiagram.NodeAndBackwardLinkDistance + link.shiftByAxisYSource)/2;
        curveCenterY = link.source.y - SankeyDiagram.NodeAndBackwardLinkDistance - fixedLinkHeight + curveRadius;

        pathParams +=
            `C ${curveCenterX} ${link.source.y + fixedLinkHeight + link.shiftByAxisYSource},` +
            ` ${curveCenterX - fixedLinkKneeSize} ${link.source.y + fixedLinkHeight + link.shiftByAxisYSource + SankeyDiagram.DistanceBetweenLinks/2} ,` +
            ` ${curveCenterX - fixedLinkKneeSize} ${curveCenterY}`;

        pathParams +=
            `C ${curveCenterX - fixedLinkKneeSize} ${curveCenterY},` +
            ` ${curveCenterX - fixedLinkKneeSize} ${curveCenterY - curveRadius} ,` +
            ` ${curveCenterX + link.source.width/2} ${curveCenterY - curveRadius}`;     

        // close path to get closed area
        pathParams += ` Z`;

        return pathParams;
    }

    private getSvgPathForForwardLink(link: SankeyDiagramLink): string {
        let pathParams: string = "";
        const distanceBetweenLinks: number = 3;

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
        xi = d3InterpolateNumber(x0, x1);
        x2 = xi(this.curvatureOfLinks);
        x3 = xi(1 - this.curvatureOfLinks);
        y0 = link.source.y + link.shiftByAxisYSource + link.height / SankeyDiagram.MiddleFactor - (link.height - distanceBetweenLinks) / 2;
        y1 = link.destination.y + link.shiftByAxisYDestination + link.height / SankeyDiagram.MiddleFactor - (link.height - distanceBetweenLinks) / 2;

        pathParams += ` M ${x0} ${y0} C ${x2} ${y0}, ${x3} ${y1}, ${x1} ${y1}`;

        // right border of link
        y0 = link.destination.y + link.shiftByAxisYDestination + (link.height - distanceBetweenLinks) / SankeyDiagram.MiddleFactor + (link.height - distanceBetweenLinks) / 2;
        y1 = link.destination.y + link.shiftByAxisYDestination + (link.height - distanceBetweenLinks) / SankeyDiagram.MiddleFactor - (link.height - distanceBetweenLinks) / 2;

        pathParams += ` L ${x1} ${y0}`;

        // bottom border of link
        xi = d3InterpolateNumber(x0, x1);
        x2 = xi(this.curvatureOfLinks);
        x3 = xi(1 - this.curvatureOfLinks);
        y0 = link.source.y + link.shiftByAxisYSource + (link.height - distanceBetweenLinks) / SankeyDiagram.MiddleFactor + (link.height - distanceBetweenLinks) / 2;
        y1 = link.destination.y + link.shiftByAxisYDestination + (link.height - distanceBetweenLinks) / SankeyDiagram.MiddleFactor + (link.height - distanceBetweenLinks) / 2;

        pathParams += ` L ${x1} ${y1} C ${x2} ${y1}, ${x3} ${y0}, ${x0} ${y0}`;

        // left border of link
        y0 = link.source.y + link.shiftByAxisYSource + (link.height - distanceBetweenLinks) / SankeyDiagram.MiddleFactor + (link.height - distanceBetweenLinks) / 2;
        y1 = link.source.y + link.shiftByAxisYSource + (link.height - distanceBetweenLinks) / SankeyDiagram.MiddleFactor - (link.height - distanceBetweenLinks) / 2;

        // close path to get closed area
        pathParams += ` Z`;

        return pathParams;
    }

    private renderTooltip(selection: Selection<SankeyDiagramNode | SankeyDiagramLink>): void {
        if (!this.tooltipServiceWrapper) {
            return;
        }

        this.tooltipServiceWrapper.addTooltip(
            selection,
            (data: TooltipEnabledDataPoint) => data.tooltipInfo,
            (data: SankeyDiagramNode | SankeyDiagramLink) => data.identity
        );
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
            interactivityService: this.interactivityService,
            behavior: this.behavior,
            dataPoints: this.getSelectableDataPoints(),
            interactivityServiceOptions: {
                overrideSelectionFromData: true
            }
        };

        this.interactivityService.bind(behaviorOptions);
    }

    public onClearSelection(): void {
        if (this.interactivityService) {
            this.interactivityService.clearSelection();
        }
    }
}
