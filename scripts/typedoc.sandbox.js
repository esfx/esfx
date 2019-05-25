// @ts-check
const typedoc = require("gulp-typedoc");
const { Application } = require("typedoc");
const { Component } = require("typedoc/dist/lib/utils/component");
const { DiscoverEvent, OptionsComponent } = require("typedoc/dist/lib/utils/options/options");
const { OptionsReadMode } = require("typedoc/dist/lib/utils/options");
const { ParameterType } = require("typedoc/dist/lib/utils/options/declaration");
const { Renderer } = require("typedoc/dist/lib/output/renderer");

const applicationCustomOptions = Symbol();
const savedBootstrap = Application.prototype["bootstrap"];
Application.prototype["bootstrap"] = function (options) {
    this[applicationCustomOptions] = options;
    const result = savedBootstrap.apply(this, arguments);
    this[applicationCustomOptions] = undefined;
    return result;
};

// gulp-typedoc does not correctly handle custom options
let GulpOptionsReader = class GulpOptionsReader extends OptionsComponent {
    initialize() {
        this.listenTo(this.owner, DiscoverEvent.DISCOVER, this.onDiscover, -200);
    }

    /** @param {DiscoverEvent} event */
    onDiscover(event) {
        if (event.mode !== OptionsReadMode.Fetch) return;
        const customOptions = this.application[applicationCustomOptions];
        if (customOptions) {
            const owner = this.owner;
            const handledOptions = this.application.options.getRawValues();
            for (const key of Object.keys(customOptions)) {
                if (handledOptions.hasOwnProperty(key)) continue;
                const value = customOptions[key];
                const declaration = owner.getDeclaration(key);
                if (!declaration) {
                    event.addError('Unknown option: %s', key);
                }
                else {
                    if (declaration.type !== ParameterType.Boolean && !value) {
                        event.addError('Option "%s" expects an argument.', declaration.name);
                        continue;
                    }
                    event.data[declaration.name] = value;
                }
            }
        }
    }
}

GulpOptionsReader = Component({
    name: "options:gulp"
})(GulpOptionsReader) || GulpOptionsReader;

/**
 * @param {import("gulp-typedoc").Options & ExtendedOptions & PluginOptions} options
 */
module.exports = function (options) {
    return typedoc(options);
}

/**
 * @typedef ExtendedOptions
 * @property {string} [tsconfig]
 * @property {string[]} [plugin]
 * @property {boolean} [excludeNotExported]
 * 
 * @typedef {{ [key: string]: any }} PluginOptions
 */
void 0;
