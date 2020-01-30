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
} from "../src/sankeydiagram";

import  powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

export class SankeyDiagramBuilder extends VisualBuilderBase<VisualClass> {
    constructor(width: number, height: number) {
        super(width, height, "SankeyDiagram1446463184954");
    }

    private instances: any;

    getPropertyInstances () {
        return this.instances;
    }

    protected build(options: VisualConstructorOptions) {
        options.host.persistProperties = (instances) => {
            this.instances = instances.merge[0];
        };
        return new VisualClass(options);
    }

    public get instance(): VisualClass {
        return this.visual;
    }

    public get mainElement(): JQuery {
        return this.element.children("svg.sankeyDiagram");
    }

    public get nodesElement(): JQuery {
        return this.mainElement
            .children("g")
            .children("g.nodes");
    }

    public get nodeElements(): JQuery {
        return this.nodesElement.children("g.node");
    }

    public get linksElement(): JQuery {
        return this.mainElement
            .children("g")
            .children("g.links");
    }

    public get linkElements(): JQuery {
        return this.linksElement.children("path.link");
    }
}
