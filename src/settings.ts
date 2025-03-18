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
import powerbiVisualsApi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";
import {
    SankeyDiagramLink,
    SankeyDiagramNode,
    SankeyDiagramNodePositionSetting
} from "./dataInterfaces";

import FormattingSettingsCards = formattingSettings.Cards;
import FormattingSettingsSimpleCard = formattingSettings.SimpleCard;
import FormattingSettingsCompositeCard = formattingSettings.CompositeCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

import ISelectionId = powerbiVisualsApi.visuals.ISelectionId;
import IEnumMember = powerbi.IEnumMember;

export enum CyclesDrawType {
    Duplicate,
    Backward,
    DuplicateOptimized
}

export interface ViewportSize {
    height?: string;
    width?: string;
}

export const duplicateNodesOptions : IEnumMember[] = [
    {value : CyclesDrawType.Duplicate, displayName : "Duplicate"},
    {value : CyclesDrawType.Backward, displayName : "Draw backward link"},
    {value : CyclesDrawType.DuplicateOptimized, displayName : "Duplicate optimized"}
];

export class FontSettingsOptions {
    public static DefaultFontSize: number = 12;
    public static MinFontSize: number = 8;
    public static MaxFontSize: number = 60;
    public static DefaultFontFamily: string = "Arial";
    public static DefaultNormalValue: string = "normal";
    public static BoldValue: string = "bold";
    public static ItalicValue: string = "italic";
    public static UnderlineValue: string = "underline";
    public static DefaultNoneValue: string = "none";
    public static DefaultFillValue: string = "#000000";
}

export class NodeWidthDefaultOptions {
    public static DefaultWidth: number = 10;
    public static MinWidth: number = 10;
    public static MaxWidth: number = 30;
}

export class SankeyDiagramScaleSettings {
    public x: number = 1;
    public y: number = 1;
}

export class SankeyComplexSettings {
    public nodePositions: string = "[]";
    public viewportSize: string = "{}";
}

export class BaseFontSettingsCard extends FormattingSettingsCompositeCard {
    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true,
    });

    public fontFamily = new formattingSettings.FontPicker({
        name: "fontFamily",
        value: "Arial, sans-serif"
    });

    public fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text Size",
        displayNameKey: "Visual_TextSize",
        value: FontSettingsOptions.DefaultFontSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: FontSettingsOptions.MinFontSize,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: FontSettingsOptions.MaxFontSize,
            }
        }
    });

    public bold = new formattingSettings.ToggleSwitch({
        name: "fontBold",
        value: false,
    });

    public italic = new formattingSettings.ToggleSwitch({
        name: "fontItalic",
        value: false,
    });

    public underline = new formattingSettings.ToggleSwitch({
        name: "fontUnderline",
        value: false,
    });

    public fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayNameKey: "Visual_Color",
        value: { value: "#000000" },
    });

    private fontControl = new formattingSettings.FontControl({
        name: "font",
        displayName: "Font",
        displayNameKey: "Visual_Font",
        fontFamily: this.fontFamily,
        fontSize: this.fontSize,
        bold: this.bold,
        underline: this.underline,
        italic: this.italic,
    });

    protected fontGroup = new formattingSettings.Group({
        name: "fontGroup",
        displayNameKey: "Visual_Values",
        slices: [this.fontControl, this.fill],
    });

    constructor(cardName: string, defaultFontSize?: number){
        super();
        this.name = cardName;
        this.fontGroup.name = `${cardName}Values`;
        this.fontSize.value = defaultFontSize ?? FontSettingsOptions.DefaultFontSize;
        this.topLevelSlice = this.show;
    }

    public groups: FormattingSettingsSlice[] = [ this.fontGroup ];
}

export class DataLabelsSettings extends BaseFontSettingsCard {
    public forceDisplay = new formattingSettings.ToggleSwitch({
        name: "forceDisplay",
        displayName: "Force display",
        displayNameKey: "Visual_Force_Display",
        description: "Display all labels anyway",
        descriptionKey: "Visual_Description_Force_Display",
        value: false
    });

    public unit = new formattingSettings.AutoDropdown({
        name: "unit",
        displayName: "Display units",
        displayNameKey: "Visual_Display_Units",
        value: 0
    });

    constructor() {
        const cardName: string = "labels";
        super(cardName);

        this.displayNameKey = "Visual_DataPointsLabels";
        this.fontGroup.slices?.push(this.unit, this.forceDisplay);
    }
}

export class LinkLabelsSettings extends BaseFontSettingsCard {
    public static DefaultFontSize: number = 9;
    constructor() {
        const cardName: string = "linkLabels";
        super(cardName, LinkLabelsSettings.DefaultFontSize);

        this.displayNameKey = "Visual_DataPointsLinkLabels";
        this.show.value = false;
    }
}

export class LinksSettings extends FormattingSettingsSimpleCard {
    public name: string = "links";
    public displayName: string = "Links";
    public displayNameKey: string = "Visual_Links";
    public slices: FormattingSettingsSlice[] = [];
}

export class NodesSettings extends FormattingSettingsSimpleCard {
    public name: string = "nodes";
    public displayName: string = "Nodes";
    public displayNameKey: string = "Visual_Nodes";

    public nodeWidth = new formattingSettings.NumUpDown({
        name: "nodesWidth",
        displayName: "Width",
        displayNameKey: "Visual_Width",
        value: NodeWidthDefaultOptions.DefaultWidth,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: NodeWidthDefaultOptions.MinWidth,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: NodeWidthDefaultOptions.MaxWidth
            }
        }
    });
    public slices: FormattingSettingsSlice[] = [this.nodeWidth];
}

export class ScaleSettings extends FormattingSettingsSimpleCard {
    public provideMinHeight = new formattingSettings.ToggleSwitch({
        name: "provideMinHeight",
        displayName: "Provide min optimal height of node",
        displayNameKey: "Visual_MinOptimalHeight",
        value: true
    });

    public lnScale = new formattingSettings.ToggleSwitch({
        name: "lnScale",
        displayName: "Enable logarithmic scale",
        displayNameKey: "Visual_LogarithmicScale",
        value: false
    });

    public name: string = "scaleSettings";
    public displayName: string = "Scale settings";
    public displayNameKey: string = "Visual_ScaleSettings";
    public slices: FormattingSettingsSlice[] = [this.provideMinHeight, this.lnScale];
}

export class LinksOrder extends FormattingSettingsSimpleCard {
    public name: string = "linkOrderGroup";
    public displayNameKey: string = "Visual_LinksOrder";

    public shouldReorder= new formattingSettings.ToggleSwitch({
        name: "linksReorder",
        displayNameKey: "Visual_AutoLinksReorder",
        value: false,
    });

    slices: formattingSettings.Slice[] = [this.shouldReorder];
}

class PersistPropertiesGroup extends FormattingSettingsSimpleCard {
    public name: string = "persistProperties";
    public displayNameKey: string = "Visual_NodePositions";
    public collapsible: boolean = false;
    public visible: boolean = true;
    public nodePositions = new formattingSettings.ReadOnlyText({
        name: "nodePositions",
        displayNameKey: "Visual_NodePositions",
        value: "",
        visible: false,
    }); 

    public viewportSize = new formattingSettings.ReadOnlyText({
        name: "viewportSize",
        displayNameKey: "Visual_ViewportSize",
        value: "",
        visible: false,
    });

    public slices: FormattingSettingsSlice[] = [this.nodePositions, this.viewportSize]
}

export class NodeComplexSettings extends FormattingSettingsCompositeCard {
    public persistProperties: PersistPropertiesGroup = new PersistPropertiesGroup();
    public links: LinksOrder = new LinksOrder();

    public name: string = "nodeComplexSettings";
    public displayNameKey: string = "Visual_Sorting";
    public groups: FormattingSettingsCards[] = [this.persistProperties, this.links];
}

export class CyclesLinkSettings extends FormattingSettingsSimpleCard {
    public drawCycles = new formattingSettings.ItemDropdown({
        name: "drawCycles",
        displayName: "Duplicate nodes",
        displayNameKey: "Visual_DuplicateNodes",
        value: duplicateNodesOptions[0],
        items: duplicateNodesOptions
    });

    public selfLinksWeight = new formattingSettings.ToggleSwitch({
        name: "selfLinksWeight",
        displayName: "Ignore weight of self links",
        displayNameKey: "Visual_SelflinkWeight",
        value: false
    });

    public name: string = "cyclesLinks";
    public displayName: string = "Cycles displaying";
    public displayNameKey: string = "Visual_Cycles";
    public slices: FormattingSettingsSlice[] = [this.drawCycles, this.selfLinksWeight];
}

export class SankeyDiagramSettings extends FormattingSettingsModel {
    public _scale: SankeyDiagramScaleSettings = new SankeyDiagramScaleSettings();
    public _nodePositions: SankeyDiagramNodePositionSetting[] = [];
    public _viewportSize: ViewportSize = {};
    public sort: string = "";

    public labels: DataLabelsSettings = new DataLabelsSettings();
    public linkLabels: LinkLabelsSettings = new LinkLabelsSettings();
    public linksColorSelector: LinksSettings = new LinksSettings();
    public nodesSettings: NodesSettings = new NodesSettings();
    public scale: ScaleSettings = new ScaleSettings();
    public cyclesLinks: CyclesLinkSettings = new CyclesLinkSettings();
    public nodeComplexSettings: NodeComplexSettings = new NodeComplexSettings();
    public cards: FormattingSettingsCards[] = [this.labels, this.linkLabels, this.linksColorSelector, this.nodesSettings, this.scale, this.cyclesLinks, this.nodeComplexSettings];

    populateNodesColorSelector(nodes: SankeyDiagramNode[]) {
        const slices = this.nodesSettings.slices;
        if (nodes) {
            nodes.forEach(node => {
                if(slices.some((nodeColorSelector: FormattingSettingsSlice) => nodeColorSelector.displayName === node.label.formattedName)){
                    return;
                }
                slices.push(new formattingSettings.ColorPicker({
                    name: "fill",
                    displayName: node.label.formattedName,
                    value: { value: node.fillColor },
                    selector: ColorHelper.normalizeSelector((<ISelectionId>node.selectionId).getSelector())
                }));
            });
        }
    }

    populateLinksColorSelector(links: SankeyDiagramLink[]) {
        const slices = this.linksColorSelector.slices;
        if (links) {
            links.forEach(link => {
                slices.push(new formattingSettings.ColorPicker({
                    name: "fill",
                    displayName: link.source.label.formattedName + " - " + link.destination.label.formattedName,
                    value: { value: link.fillColor },
                    selector: ColorHelper.normalizeSelector((<ISelectionId>link.selectionId).getSelector())
                }));
            });
        }
    }
}