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


// powerbi.extensibility.utils.test
import {
    VisualBuilderBase
} from "powerbi-visuals-utils-testutils";

// SankeyDiagram1446463184954
import {
    SankeyDiagram as VisualClass
} from "../src/sankeyDiagram";

import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

export class VisualBuilder extends VisualBuilderBase<VisualClass> {
    constructor(width: number, height: number) {
        super(width, height, "SankeyDiagram1446463184954");
    }

    protected build(options: VisualConstructorOptions) {
        return new VisualClass(options);
    }

    public get instance(): VisualClass {
        return this.visual;
    }

    public get mainElement(): HTMLElement {
        // return this.element.children("svg.sankeyDiagram");
        return this.element.querySelector("svg.sankeyDiagram");
    }

    public get nodesElement(): HTMLElement {
        return this.mainElement
            .querySelector("g.nodes");
    }

    public get nodeElements(): NodeListOf<HTMLElement> {
        return this.nodesElement.querySelectorAll("g.node");
    }

    public get nodeRectElements(): NodeListOf<HTMLElement> {
        return this.nodesElement.querySelectorAll("rect.nodeRect");
    }

    // g.links element containing all the links 
    public get linksElement(): HTMLElement {
        return this.mainElement
            .querySelector("g.links");
    }

    // all links objects displayed in the visual
    public get linkElements(): NodeListOf<HTMLElement> {
        return this.linksElement.querySelectorAll("path.link");
    }

    public get resetButton(): SVGElement {
        return this.mainElement.querySelector("g.resetButton");
    }
}