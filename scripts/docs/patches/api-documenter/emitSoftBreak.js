const { MarkdownEmitter } = require("@microsoft/api-documenter/lib/markdown/MarkdownEmitter");

const prev_writeNode = MarkdownEmitter.prototype.writeNode;

MarkdownEmitter.prototype.writeNode = function (docNode, context, docNodeSiblings) {
    const writer = context.writer;
    switch (docNode.kind) {
        case "SoftBreak":
            writer.writeLine();
            return;
    }
    prev_writeNode.call(this, docNode, context, docNodeSiblings);
};