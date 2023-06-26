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

import FormattingSettingsCard = formattingSettings.Card;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

import ISelectionId = powerbiVisualsApi.visuals.ISelectionId;
import IEnumMember = powerbi.IEnumMember;

export enum CyclesDrawType {
    Duplicate,
    Backward
}

export interface ViewportSize {
    height?: string;
    width?: string;
}

export const duplicateNodesOptions : IEnumMember[] = [
    {value : 0, displayName : "Duplicate"},
    {value : 1, displayName : "Draw backward link"}
];

export class FontSizeDefaultOptions {
    public static DefaultFontSize: number = 12;
    public static MinFontSize: number = 8;
    public static MaxFontSize: number = 60;
}

export class SankeyDiagramScaleSettings {
    public x: number = 1;
    public y: number = 1;
}

export class SankeyComplexSettings {
    public nodePositions: string = "[]";
    public viewportSize: string = "{}";
}

export class DataLabelsSettings extends FormattingSettingsCard {
    public static DefaultFontFamily: string = "Arial";
    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true,
        topLevelToggle: true
    });

    public fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayName: "Color",
        displayNameKey: "Visual_LabelsFill",
        value: { value: "#000000" }
    });

    public fontFamily = new formattingSettings.FontPicker({
        name: "fontFamily",
        displayName: "Font Family",
        displayNameKey: "Visual_FontFamily",
        value: DataLabelsSettings.DefaultFontFamily
    });

    public fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text Size",
        displayNameKey: "Visual_TextSize",
        value: FontSizeDefaultOptions.DefaultFontSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: FontSizeDefaultOptions.MinFontSize,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: FontSizeDefaultOptions.MaxFontSize,
            }
        }
    });

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

    public name: string = "labels";
    public displayName: string = "Data labels";
    public displayNameKey: string = "Visual_DataPointsLabels";
    public slices: FormattingSettingsSlice[] = [this.show, this.fill, this.fontFamily, this.fontSize, this.forceDisplay, this.unit];
}

export class LinkLabelsSettings extends FormattingSettingsCard {
    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: false,
        topLevelToggle: true
    });

    public fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayName: "Color",
        displayNameKey: "Visual_LabelsFill",
        value: { value: "#000000" }
    });

    public fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text Size",
        displayNameKey: "Visual_TextSize",
        value: FontSizeDefaultOptions.DefaultFontSize,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: FontSizeDefaultOptions.MinFontSize,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: FontSizeDefaultOptions.MaxFontSize,
            }
        }
    });

    public name: string = "linkLabels";
    public displayName: string = "Data link labels";
    public displayNameKey: string = "Visual_DataPointsLinkLabels";
    public slices: FormattingSettingsSlice[] = [this.show, this.fill, this.fontSize];
}

export class LinksSettings extends FormattingSettingsCard {
    public name: string = "links";
    public displayName: string = "Links";
    public displayNameKey: string = "Visual_Links";
    public slices: FormattingSettingsSlice[] = [];
}

export class NodesSettings extends FormattingSettingsCard {
    public name: string = "nodes";
    public displayName: string = "Nodes";
    public displayNameKey: string = "Visual_Nodes";
    public slices: FormattingSettingsSlice[] = [];
}

export class ScaleSettings extends FormattingSettingsCard {
    public provideMinHeight = new formattingSettings.ToggleSwitch({
        name: "provideMinHeight",
        displayName: "Provide min optimal height of node",
        displayNameKey: "Visual_MinOptimalHeight",
        value: true
    });

    public lnScale = new formattingSettings.ToggleSwitch({
        name: "lnScale",
        displayName: "Enable logarithmic scale",
        displayNameKey: "Visual_ScaleSettings",
        value: false
    });

    public name: string = "scaleSettings";
    public displayName: string = "Scale settings";
    public displayNameKey: string = "Visual_SankeyScaleSettings";
    public slices: FormattingSettingsSlice[] = [this.provideMinHeight, this.lnScale];
}

export class NodeComplexSettings extends FormattingSettingsCard {
    public nodePositions = new formattingSettings.ReadOnlyText({
        name: "nodePositions",
        displayNameKey: "Visual_NodePositions",
        value: ""
    }); 

    public viewportSize = new formattingSettings.ReadOnlyText({
        name: "viewportSize",
        displayNameKey: "Visual_ViewportSize",
        value: ""
    });

    public name: string = "nodeComplexSettings";
    public displayNameKey: string = "Visual_SankeySettings";
    public slices: FormattingSettingsSlice[] = [this.nodePositions, this.viewportSize];
}

export class CyclesLinkSettings extends FormattingSettingsCard {
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
    public nodesColorSelector: NodesSettings = new NodesSettings();
    public scale: ScaleSettings = new ScaleSettings();
    public cyclesLinks: CyclesLinkSettings = new CyclesLinkSettings();
    public nodeComplexSettings: NodeComplexSettings = new NodeComplexSettings();
    public cards: FormattingSettingsCard[] = [this.labels, this.linkLabels, this.linksColorSelector, this.nodesColorSelector, this.scale, this.cyclesLinks, this.nodeComplexSettings];

    populateNodesColorSelector(nodes: SankeyDiagramNode[]) {
        const slices = this.nodesColorSelector.slices;
        if (nodes) {
            nodes.forEach(node => {
                if(slices.some((nodeColorSelector: FormattingSettingsSlice) => nodeColorSelector.displayName === node.label.formattedName)){
                    return;
                }
                slices.push(new formattingSettings.ColorPicker({
                    name: "fill",
                    displayName: node.label.formattedName,
                    value: { value: node.fillColor },
                    selector: ColorHelper.normalizeSelector((<ISelectionId>node.identity).getSelector())
                }));
            });
            slices.sort((firstColorSelector: FormattingSettingsSlice, secondColorSelector: FormattingSettingsCard) => firstColorSelector.displayName.localeCompare(secondColorSelector.displayName));
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
                    selector: ColorHelper.normalizeSelector((<ISelectionId>link.identity).getSelector())
                }));
            });
        }
    }

    removeNodeComplexSettingsFromPane(){
        this.cards = [this.labels, this.linkLabels, this.linksColorSelector, this.nodesColorSelector, this.scale, this.cyclesLinks];
    }
}