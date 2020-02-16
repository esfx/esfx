// @ts-check
const { TSDocEmitter } = require("@microsoft/tsdoc/lib/emitters/TSDocEmitter");
const { TrimSpacesTransform } = require("@microsoft/tsdoc/lib/transforms/TrimSpacesTransform");
const { DocParagraph } = require("@microsoft/tsdoc/lib/nodes/DocParagraph");

TrimSpacesTransform.transform = function (docParagraph) {
    if (docParagraph.nodes.length > 0 && 
        docParagraph.nodes[docParagraph.nodes.length - 1].kind === "SoftBreak") {
        const transformedNodes = docParagraph.nodes.slice(0, -1);
        const transformedParagraph = new DocParagraph({
            configuration: docParagraph.configuration
        });
        transformedParagraph.appendNodes(transformedNodes);
        return transformedParagraph;
    }
    return docParagraph;
};

// @ts-ignore
const save_renderNode = TSDocEmitter.prototype._renderNode;

// @ts-ignore
TSDocEmitter.prototype._renderNode = function(docNode) {
    if (docNode === undefined) {
        return;
    }
    switch (docNode.kind) {
        case "SoftBreak":
            // @ts-ignore
            this._writeNewline();
            break;
        default:
            save_renderNode.call(this, docNode);
            break;
    }
};