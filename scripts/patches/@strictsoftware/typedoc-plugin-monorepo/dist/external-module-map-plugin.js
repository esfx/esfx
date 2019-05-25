var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "path", "fs", "marked", "typedoc/dist/lib/converter/components", "typedoc/dist/lib/converter/converter", "typedoc/dist/lib/converter/plugins/CommentPlugin", "typedoc/dist/lib/models/comments", "typedoc/dist/lib/utils/options"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const path = require("path");
    const fs = require("fs");
    // const marked = require("marked");
    const components_1 = require("typedoc/dist/lib/converter/components");
    const converter_1 = require("typedoc/dist/lib/converter/converter");
    const CommentPlugin_1 = require("typedoc/dist/lib/converter/plugins/CommentPlugin");
    const comments_1 = require("typedoc/dist/lib/models/comments");
    const options_1 = require("typedoc/dist/lib/utils/options");
    // marked.setOptions({
    //     renderer: new marked.Renderer(),
    //     highlight: function (code) {
    //         return require('highlight.js').highlightAuto(code).value;
    //     },
    //     pedantic: false,
    //     gfm: true,
    //     tables: true,
    //     breaks: false,
    //     sanitize: false,
    //     smartLists: true,
    //     smartypants: false,
    // });
    /**
     * This plugin allows you to provide a mapping regexp between your source folder structure, and the module that should be
     * reported in typedoc. It will match the first capture group of your regex and use that as the module name.
     *
     * Based on https://github.com/christopherthielen/typedoc-plugin-external-module-name
     *
     *
     */
    let ExternalModuleMapPlugin = class ExternalModuleMapPlugin extends components_1.ConverterComponent {
        initialize() {
            this.modules = new Set();
            this.options = this.application.options;
            this.listenTo(this.owner, {
                [converter_1.Converter.EVENT_BEGIN]: this.onBegin,
                [converter_1.Converter.EVENT_CREATE_DECLARATION]: this.onDeclarationBegin,
                [converter_1.Converter.EVENT_RESOLVE_BEGIN]: this.onBeginResolve,
            });
        }
        /**
         * Triggered when the converter begins converting a project.
         *
         * @param context  The context object describing the current state the converter is in.
         */
        onBegin(context) {
            this.moduleRenames = [];
            this.options.read({}, options_1.OptionsReadMode.Prefetch);
            this.externalmap = (this.options.getValue('external-modulemap'));
            if (!!this.externalmap) {
                try {
                    console.log("INFO: applying regexp ", this.externalmap, " to calculate module names");
                    this.mapRegEx = new RegExp(this.externalmap);
                    this.isMappingEnabled = true;
                    console.log("INFO: Enabled", this.isMappingEnabled);
                }
                catch (e) {
                    console.log("WARN: external map not recognized. Not processing.", e);
                }
            }
        }
        onDeclarationBegin(context, reflection, node) {
            if (!node || !this.isMappingEnabled)
                return;
            var fileName = node.fileName;
            let match = this.mapRegEx.exec(fileName);
            /*
        
            */
            if (null != match) {
                // console.log(' Mapping ', fileName, ' ==> ', match[1]);
                this.modules.add(match[1]);
                this.moduleRenames.push({
                    renameTo: match[1],
                    reflection: reflection
                });
            }
        }
        /**
         * Triggered when the converter begins resolving a project.
         *
         * @param context  The context object describing the current state the converter is in.
         */
        onBeginResolve(context) {
            let projRefs = context.project.reflections;
            let refsArray = Object.keys(projRefs).reduce((m, k) => { m.push(projRefs[k]); return m; }, []);
            // Process each rename
            this.moduleRenames.forEach(item => {
                let renaming = item.reflection;
                // Find an existing module that already has the "rename to" name.  Use it as the merge target.
                let mergeTarget = refsArray.filter(ref => ref.kind === renaming.kind && ref.name === item.renameTo)[0];
                // If there wasn't a merge target, just change the name of the current module and exit.
                if (!mergeTarget) {
                    renaming.name = item.renameTo;
                    return;
                }
                if (!mergeTarget.children) {
                    mergeTarget.children = [];
                }
                // Since there is a merge target, relocate all the renaming module's children to the mergeTarget.
                let childrenOfRenamed = refsArray.filter(ref => ref.parent === renaming);
                childrenOfRenamed.forEach((ref) => {
                    // update links in both directions
                    //console.log(' merging ', mergeTarget, ref);
                    ref.parent = mergeTarget;
                    mergeTarget.children.push(ref);
                });
                // Now that all the children have been relocated to the mergeTarget, delete the empty module
                // Make sure the module being renamed doesn't have children, or they will be deleted
                if (renaming.children)
                    renaming.children.length = 0;
                CommentPlugin_1.CommentPlugin.removeReflection(context.project, renaming);
            });
            this.modules.forEach((name) => {
                let ref = refsArray
                    .filter(ref => ref.name === name)
                    .find(ref => path.isAbsolute(ref.originalName));
                let root = ref.originalName.replace(new RegExp(`${name}.*`, 'gi'), name);
                try {
                    // tslint:disable-next-line ban-types
                    Object.defineProperty(ref, "kindString", {
                        get() { return "Package"; },
                        set() { return "Package"; },
                    });
                    let readme = fs.readFileSync(path.join(root, 'README.md'));
                    // ref.comment = new comments_1.Comment("", marked(readme.toString()));
                    ref.comment = new comments_1.Comment("", readme.toString());
                }
                catch (e) {
                    console.error(`No README found for module "${name}"`);
                }
            });
        }
    };
    ExternalModuleMapPlugin = __decorate([
        components_1.Component({ name: 'external-module-map' })
    ], ExternalModuleMapPlugin);
    exports.ExternalModuleMapPlugin = ExternalModuleMapPlugin;
});
