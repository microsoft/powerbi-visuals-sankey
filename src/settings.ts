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

import { formattingSettings, formattingSettingsInterfaces } from "powerbi-visuals-utils-formattingmodel";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";
import {
    ButtonPosition,
    SankeyDiagramLink,
    SankeyDiagramNode,
    SankeyDiagramNodeSetting
} from "./dataInterfaces";
import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";

import FormattingSettingsCards = formattingSettings.Cards;
import FormattingSettingsSimpleCard = formattingSettings.SimpleCard;
import FormattingSettingsCompositeCard = formattingSettings.CompositeCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
import ContainerItem = formattingSettings.ContainerItem;
import ILocalizedItemMember = formattingSettingsInterfaces.ILocalizedItemMember;

export enum CyclesDrawType {
    Duplicate,
    Backward,
    DuplicateOptimized
}

export enum LinkMatchType{
    Source = "source",
    Destination = "destination"
}

export interface ViewportSize {
    height?: string;
    width?: string;
}

interface IButtonSettings {
    fill: string;
    stroke: string;
    textFill: string;
    text: string;
    width: number;
    height: number;
}

interface IHandleHighContrastMode {
    handleHighContrastMode? (colorHelper: ColorHelper): void;
}

export const buttonDefaults: IButtonSettings = {
    fill: "#DCDCDC",
    stroke: "#A9A9A9",
    textFill: "#333",
    text: "Reset",
    width: 40,
    height: 15
};

export const buttonPositionOptions: ILocalizedItemMember[] = [
    { value: ButtonPosition.Top, displayNameKey: "Visual_Top" },
    { value: ButtonPosition.TopCenter, displayNameKey: "Visual_TopCenter" },
    { value: ButtonPosition.TopRight, displayNameKey: "Visual_TopRight" },
    { value: ButtonPosition.Bottom, displayNameKey: "Visual_Bottom" },
    { value: ButtonPosition.BottomCenter, displayNameKey: "Visual_BottomCenter" },
    { value: ButtonPosition.BottomRight, displayNameKey: "Visual_BottomRight" }
];

export const duplicateNodesOptions: ILocalizedItemMember[] = [
    { value: CyclesDrawType.Duplicate, displayNameKey: "Visual_Duplicate" },
    { value: CyclesDrawType.Backward, displayNameKey: "Visual_DrawBackwardLink" },
    { value: CyclesDrawType.DuplicateOptimized, displayNameKey: "Visual_DuplicateOptimized" }
];

export const matchSourceOrDestinationOptions: ILocalizedItemMember[] = [
    { value: LinkMatchType.Source, displayNameKey: "Visual_Source" },
    { value: LinkMatchType.Destination, displayNameKey: "Visual_Destination" }
]

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

export class BaseFontSettingsCard extends FormattingSettingsCompositeCard implements IHandleHighContrastMode {
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

    constructor(cardName: string, defaultFontSize?: number) {
        super();
        this.name = cardName;
        this.fontGroup.name = `${cardName}Values`;
        this.fontSize.value = defaultFontSize ?? FontSettingsOptions.DefaultFontSize;
        this.topLevelSlice = this.show;
    }

    public groups: FormattingSettingsSlice[] = [this.fontGroup];

    public handleHighContrastMode(colorHelper: ColorHelper): void {
        this.fill.value.value = colorHelper.getHighContrastColor("foreground", this.fill.value.value);
        this.fill.disabled = colorHelper.isHighContrast ? true : this.fill.disabled;
        this.fill.disabledReasonKey = "Visual_ColorDisabledDescription";
    }
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

export class LinkOutlineSettings extends FormattingSettingsSimpleCard implements IHandleHighContrastMode {
    public name: string = "linkOutline";
    public displayName: string = "Outline";
    public displayNameKey: string = "Visual_Border";
    public show = new formattingSettings.ToggleSwitch({
        name: "showBorder",
        displayNameKey: "Visual_ShowLinkOutline",
        value: true
    });
    public width = new formattingSettings.NumUpDown({
        name: "borderWidth",
        displayName: "Width",
        displayNameKey: "Visual_Width",
        value: 1,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: 1,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: 5
            }
        }
    });
    public color = new formattingSettings.ColorPicker({
        name: "borderColor",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        value: { value: null }
    });
    public topLevelSlice: formattingSettings.ToggleSwitch = this.show;
    public slices: FormattingSettingsSlice[] = [this.color, this.width];

    constructor(disabled: boolean = false) {
        super();
        this.disabled = disabled;
        this.disabledReasonKey = "Visual_BorderDisabledReason";
    }

    public handleHighContrastMode(colorHelper: ColorHelper): void {
        this.color.value.value = colorHelper.getHighContrastColor("foreground", this.color.value.value);
        this.color.disabled = colorHelper.isHighContrast ? true : this.color.visible;
        this.color.disabledReasonKey = "Visual_ColorDisabledDescription";
    }
}

export class LinkColorContainerItem extends ContainerItem implements IHandleHighContrastMode {
    public static DefaultColorOfLink: string = "#4F4F4F";

    public fill?: formattingSettings.ColorPicker;
    public groups?: formattingSettings.Group[] = [];
    public border: LinkOutlineSettings;
    public color: formattingSettings.Group;

    constructor(link?: SankeyDiagramLink) {
        super();
        this.displayName = link ? `${link.source.label.formattedName} - ${link.destination.label.formattedName}` : "All";
        this.displayNameKey = link ? undefined : "Visual_All";
        this.fill = new formattingSettings.ColorPicker({
            name: "fill",
            displayName: "Color",
            displayNameKey: "Visual_Color",
            value: { value: link ? link.fillColor : LinkColorContainerItem.DefaultColorOfLink },
            selector: link ? ColorHelper.normalizeSelector(link.selectionId.getSelector()) : dataViewWildcard.createDataViewWildcardSelector(dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals),
            instanceKind: link ? undefined : powerbi.VisualEnumerationInstanceKinds.ConstantOrRule,
            altConstantSelector: link ? undefined : null
        });

        this.border = new LinkOutlineSettings(link ? true : false);
        this.color = new formattingSettings.Group({
            name: "linkColorGroup",
            displayNameKey: "Visual_Color",
            slices: [this.fill]
        });

        this.groups = [this.color, this.border];
    }

    public handleHighContrastMode(colorHelper: ColorHelper): void {
        this.fill.value.value = colorHelper.getHighContrastColor("foreground", this.fill.value.value);
        this.color.disabled = colorHelper.isHighContrast ? true : this.groups[0].visible;
        this.color.disabledReasonKey = "Visual_ColorDisabledDescription";

        this.border.handleHighContrastMode(colorHelper);
    }
}

export class LinksSettings extends FormattingSettingsSimpleCard implements IHandleHighContrastMode {
    public name: string = "links";
    public displayName: string = "Links";
    public displayNameKey: string = "Visual_Links";
    onPreProcess(): void {
        this.matchSourceOrDestination.visible = this.matchNodeColors.value;
        this.defaultContainerItem.fill.disabled = this.matchNodeColors.value;
    }

    public matchNodeColors = new formattingSettings.ToggleSwitch({
        name: "matchNodeColors",
        displayName: "Match Node Colors",
        displayNameKey: "Visual_LinkMatchNodeColors",
        value: false
    });

    public matchSourceOrDestination = new formattingSettings.ItemDropdown({
        name: "matchSourceOrDestination",
        displayName: "Match Color To",
        displayNameKey: "Visual_MatchColorTo",
        items: matchSourceOrDestinationOptions,
        value: matchSourceOrDestinationOptions[0],
        visible: false
    });

    public defaultContainerItem: LinkColorContainerItem = new LinkColorContainerItem();
    public container?: formattingSettings.Container = new formattingSettings.Container({
        displayNameKey: "Visual_Links",
        containerItems: [this.defaultContainerItem]
    });

    constructor(){
        super();
        this.defaultContainerItem.groups[0].slices.push(this.matchNodeColors, this.matchSourceOrDestination);
    }

    public handleHighContrastMode(colorHelper: ColorHelper): void {
        this.container.containerItems.forEach((item: LinkColorContainerItem) => {
            item?.handleHighContrastMode(colorHelper);
        });
    }
}

class NodesContainerItem extends ContainerItem implements IHandleHighContrastMode {
    public groups: formattingSettings.Group[] = [];
    public fill?: formattingSettings.ColorPicker;
    public color: formattingSettings.Group;
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

    constructor(node?: SankeyDiagramNode) {
        super();
        this.displayName = node ? node.label.formattedName : "All";
        this.displayNameKey = node ? undefined : "Visual_All";
        this.fill = new formattingSettings.ColorPicker({
            name: "fill",
            displayNameKey: "Visual_Color",
            value: { value: node ? node.fillColor : undefined },
            selector: node ? ColorHelper.normalizeSelector(node.selectionId.getSelector()) : undefined
        });

        this.color = new formattingSettings.Group({
                name: "nodeColorGroup",
                displayNameKey: "Visual_Color",
                slices: [this.fill]
        });
        this.groups = [ this.color,
            new formattingSettings.Group({
                name: "nodeOptionGroup",
                disabled: node ? true : false,
                disabledReasonKey: "Visual_NodeWidthDisabledReason",
                displayNameKey: "Visual_Option",
                slices: [this.nodeWidth]
            })
        ];
    }

    public handleHighContrastMode(colorHelper: ColorHelper): void {
        this.fill.value.value = colorHelper.getHighContrastColor("foreground", this.fill.value.value);
        this.color.disabled = colorHelper.isHighContrast ? true : this.color.disabled;
        this.color.disabledReasonKey = "Visual_ColorDisabledDescription";
    }
}

export class NodesSettings extends FormattingSettingsSimpleCard implements IHandleHighContrastMode {
    public name: string = "nodes";
    public displayName: string = "Nodes";
    public displayNameKey: string = "Visual_Nodes";

    public defaultContainerItem: NodesContainerItem = new NodesContainerItem();

    public handleHighContrastMode(colorHelper: ColorHelper): void {
        this.container.containerItems.forEach((item: NodesContainerItem) => {
            item?.handleHighContrastMode(colorHelper);
        });
    }

    public container: formattingSettings.Container = new formattingSettings.Container({
        displayNameKey: "Visual_Nodes",
        containerItems: [this.defaultContainerItem]
    });
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

class PersistPropertiesGroup extends FormattingSettingsSimpleCard {
    public name: string = "persistProperties";
    public displayNameKey: string = "Visual_NodePositions";
    public collapsible: boolean = false;
    public visible: boolean = true;

    public _nodePositions: SankeyDiagramNodeSetting[] = [];
    public _viewportSize: ViewportSize = {};

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

export class ButtonSettings extends FormattingSettingsSimpleCard {
    public name: string = "button";
    public displayNameKey: string = "Visual_ResetButton";
    public descriptionKey: string = "Visual_ResetButonDescription";
    public show = new formattingSettings.ToggleSwitch({
        name: "showResetButon",
        displayNameKey: "Visual_ShowResetButton",
        value: false
    });

    public position = new formattingSettings.ItemDropdown({
        name: "position",
        displayNameKey: "Visual_Position",
        items: buttonPositionOptions,
        value: buttonPositionOptions[5]
    });

    topLevelSlice: formattingSettings.ToggleSwitch = this.show;
    slices: formattingSettings.Slice[] = [this.position];
}

export class NodeComplexSettings extends FormattingSettingsCompositeCard {
    public persistProperties: PersistPropertiesGroup = new PersistPropertiesGroup();
    public button: ButtonSettings = new ButtonSettings();

    public name: string = "nodeComplexSettings";
    public displayNameKey: string = "Visual_Sorting";
    public groups: FormattingSettingsCards[] = [this.persistProperties, this.button];
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
    public sort: string = "";

    public labels: DataLabelsSettings = new DataLabelsSettings();
    public linkLabels: LinkLabelsSettings = new LinkLabelsSettings();
    public links: LinksSettings = new LinksSettings();
    public nodes: NodesSettings = new NodesSettings();
    public scale: ScaleSettings = new ScaleSettings();
    public cyclesLinks: CyclesLinkSettings = new CyclesLinkSettings();
    public nodeComplexSettings: NodeComplexSettings = new NodeComplexSettings();
    public cards: FormattingSettingsCards[] = [this.labels, this.linkLabels, this.links, this.nodes, this.scale, this.cyclesLinks, this.nodeComplexSettings];

    populateNodesColorSelector(nodes: SankeyDiagramNode[]) {
        const containerItems = this.nodes.container.containerItems;
        nodes?.forEach(node => containerItems.push(new NodesContainerItem(node)));
    }

    populateLinksColorSelector(links: SankeyDiagramLink[]) {
        const containerItems = this.links.container.containerItems;
        links?.forEach(link => containerItems.push(new LinkColorContainerItem(link)));
    }

    handleHighContrastMode(colorHelper: ColorHelper): void {
        this.cards.forEach((card: FormattingSettingsCards) => {
            const highContrastCard = card as IHandleHighContrastMode;
            if (highContrastCard.handleHighContrastMode) {
                highContrastCard.handleHighContrastMode(colorHelper);
            }
        });
    }
}