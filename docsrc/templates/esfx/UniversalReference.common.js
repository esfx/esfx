// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See LICENSE file in the project root for full license information.

var common = require('./common.js');
var classCategory = /** @type {const} */('class');
var namespaceCategory = /** @type {const} */('ns');
var kAliases = /** @type {const} */("ALIAS_LOOKUP_TABLE");

/**
 * @param {ViewModel} model
 */
exports.transform = function (model) {
  if (!model) return

  collectAliases(model);
  handleItem(model, model._gitContribute, model._gitUrlPattern);
  if (model.children) {
    normalizeLanguageValuePairs(model.children).forEach(function (item) {
      handleItem(item, model._gitContribute, model._gitUrlPattern);
    });
  };

  if (model.type) {
    switch (model.type.toLowerCase()) {
      // packages and namespaces are both containers for other elements
      case 'package':
      case 'namespace':
        model.isNamespace = true;
        if (model.children) groupChildren(model, namespaceCategory);
        model[getTypePropertyName(model.type)] = true;
        break;
      case 'class':
      case 'interface':
      case 'struct':
      case 'delegate':
        model.isClass = true;
        if (model.children) groupChildren(model, classCategory);
        model[getTypePropertyName(model.type)] = true;
        break;
      case 'enum':
        model.isEnum = true;
        if (model.children) groupChildren(model, classCategory);
        model[getTypePropertyName(model.type)] = true;
        break;
      default:
        break;
    }
  }

  return model;
}

/**
 * @param {ViewModel} model
 * @param {boolean} ignoreChildren
 */
exports.getBookmarks = function (model, ignoreChildren) {
  if (!model || !model.type || model.type.toLowerCase() === "namespace") return null;

  /** @type {Record<string, string>} */
  var bookmarks = {};

  if (typeof ignoreChildren == 'undefined' || ignoreChildren === false) {
    if (model.children) {
      normalizeLanguageValuePairs(model.children).forEach(function (item) {
        bookmarks[item.uid] = common.getHtmlId(item.uid);
        if (item.overload && item.overload.uid) {
          bookmarks[item.overload.uid] = common.getHtmlId(item.overload.uid);
        }
      });
    }
  }

  // Reference's first level bookmark should have no anchor
  bookmarks[model.uid] = "";
  return bookmarks;
}

/**
 * @param {ViewModel} vm
 */
function handleItemType(vm) {
  vm.inPackage = vm.inPackage || null;
  vm.inNamespace = vm.inNamespace || null;
  vm.inClass = vm.inClass || null;
  vm.inStruct = vm.inStruct || null;
  vm.inInterface = vm.inInterface || null;
  vm.inEnum = vm.inEnum || null;
  vm.inDelegate = vm.inDelegate || null;
  vm.inFunction = vm.inFunction || null;
  vm.inVariable = vm.inVariable || null;
  vm.inTypeAlias = vm.inTypeAlias || null;
  vm.inConstructor = vm.inConstructor || null;
  vm.inField = vm.inField || null;
  vm.inProperty = vm.inProperty || null;
  vm.inMethod = vm.inMethod || null;
  vm.inEvent = vm.inEvent || null;
  vm.inOperator = vm.inOperator || null;
  vm.inEii = vm.inEii || null;
  vm.inMember = vm.inMember || null;
  vm.inFunction = vm.inFunction || null;
}

/**
 * @typedef {{ model: ViewModel, depth: number, distance: number }} AliasMatch
 */

/**
 * @class
 * @constructor
 * @param {ViewModel} model
 * @param {AliasLookupTable} [parentLookupTable]
 * @this {AliasLookupTable}
 */
function AliasLookupTable(model, parentLookupTable) {
  /** @private */
  this._model = model;

  /** @private @type {AliasLookupTable | undefined} */
  this._parent = parentLookupTable;

  /** @private @type {AliasLookupTable[] | undefined} */
  this._children = undefined;

  /** @private @type {Partial<Record<string, AliasMatch | "not-found">>} */
  this._aliases = Object.create(null);

  /** @private @type {Partial<Record<string, AliasMatch | "not-found">>} */
  this._selfCache = Object.create(null);

  /** @private @type {Partial<Record<string, AliasMatch | "not-found">>} */
  this._childCache = Object.create(null);

  /** @private @type {Partial<Record<string, AliasMatch | "not-found">>} */
  this._descendantCache = Object.create(null);

  /** @private @type {Partial<Record<string, AliasMatch | "not-found">>} */
  this._ancestorCache = Object.create(null);

  /** @private @type {Partial<Record<string, AliasMatch | "not-found">>} */
  this._siblingCache = Object.create(null);

  /** @private @type {Partial<Record<string, AliasMatch | "not-found">>} */
  this._neighborCache = Object.create(null);
}

/**
 * @param {ViewModel} childModel
 */
AliasLookupTable.prototype.addChild = function (childModel) {
  var childAliases = new AliasLookupTable(childModel, this);
  if (!this._children) this._children = [];
  this._children.push(childAliases);
  return childAliases;
};

/**
 * @param {string} alias
 */
AliasLookupTable.prototype.lookup = function (alias) {
  var match = this._lookup(alias);
  return match ? match.model.uid : undefined;
};

/**
 * @private
 * @param {ViewModel} model
 * @param {number} depth
 * @param {number} distance
 * @returns {AliasMatch}
 */
AliasLookupTable.prototype._createMatch = function (model, depth, distance) {
  return { model: model, depth: depth, distance: distance };
};

/**
 * @private
 * @param {AliasMatch | undefined} left
 * @param {AliasMatch | undefined} right
 * @returns {AliasMatch | undefined}
 */
AliasLookupTable.prototype._bestMatch = function (left, right) {
  return (
    !left ? right :
    !right ? left :
    left.distance === 0 && right.distance === 0 ? left.depth <= right.depth ? left : right :
    left.depth === 0 && right.depth === 0 ? left.distance <= right.distance ? left : right :
    left.distance < right.distance ? left :
    left.distance > right.distance ? right :
    left.depth < right.depth ? left :
    left.depth > right.depth ? right :
    left
  );
};

/**
 * @private
 * @param {string} alias
 * @returns {AliasMatch | undefined}
 */
AliasLookupTable.prototype._lookupSelf = function (alias) {
  var match = this._selfCache[alias];
  if (match === "not-found") return undefined;
  if (match) return match;

  if (this._model.uid && Array.isArray(this._model.alias) && this._model.alias.indexOf(alias) >= 0) {
    match = this._createMatch(this._model, 0, 0);
  }

  this._selfCache[alias] = match || "not-found";
  return match;
}

/**
 * @private
 * @param {string} alias
 * @returns {AliasMatch | undefined}
 */
AliasLookupTable.prototype._lookupChild = function (alias) {
  var match = this._childCache[alias];
  if (match === "not-found") return undefined;
  if (match) return match;

  if (this._children) {
    for (var i = 0; i < this._children.length; i++) {
      var child = this._children[i];
      match = this._bestMatch(match, child._lookupSelf(alias));
    }
  }

  if (match) {
    match = this._createMatch(match.model, match.depth + 1, 0);
  }

  this._childCache[alias] = match || "not-found";
  return match;
};

/**
 * @private
 * @param {string} alias
 * @returns {AliasMatch | undefined}
 */
AliasLookupTable.prototype._lookupDescendant = function (alias) {
  var match = this._descendantCache[alias];
  if (match === "not-found") return undefined;
  if (match) return match;

  match = this._lookupChild(alias);

  if (!match && this._children) {
    for (var i = 0; i < this._children.length; i++) {
      var child = this._children[i];
      match = this._bestMatch(match, child._lookupDescendant(alias));
    }
  }

  if (match) {
    match = this._createMatch(match.model, match.depth + 1, 0);
  }

  this._descendantCache[alias] = match || "not-found";
  return match;
};

/**
 * @private
 * @param {string} alias
 * @param {AliasLookupTable} exclude
 * @param {number} distance
 * @returns {AliasMatch | undefined}
 */
AliasLookupTable.prototype._lookupAncestor = function (alias) {
  var match = this._ancestorCache[alias];
  if (match === "not-found") return undefined;
  if (match) return match;

  var parent = this._parent;
  var distance = 2;
  while (parent) {
    match = parent._lookupSelf(alias);
    if (match) break;

    parent = parent._parent;
    distance++;
  }

  if (match) {
    match = this._createMatch(match.model, match.depth, match.distance + distance);
  }

  this._ancestorCache[alias] = match || "not-found";
  return match;
};

/**
 * @private
 * @param {string} alias
 * @returns {AliasMatch | undefined}
 */
AliasLookupTable.prototype._lookupSibling = function (alias) {
  var match = this._siblingCache[alias];
  if (match === "not-found") return undefined;
  if (match) return match;

  if (this._parent) {
    for (var i = 0; i < this._parent._children.length; i++) {
      var child = this._parent._children[i];
      if (child === this) continue;
      match = this._bestMatch(match, child._lookupSelf(alias));
    }

    if (!match) {
      for (var i = 0; i < this._parent._children.length; i++) {
        var child = this._parent._children[i];
        if (child === this) continue;
        match = this._bestMatch(match, child._lookupDescendant(alias));
      }
    }
  }

  if (match) {
    match = this._createMatch(match.model, match.depth, match.distance + 1);
  }

  this._siblingCache[alias] = match || "not-found";
  return match;
};

/**
 * @private
 * @param {string} alias
 * @returns {AliasMatch | undefined}
 */
AliasLookupTable.prototype._lookupNeighbor = function (alias) {
  var match = this._neighborCache[alias];
  if (match === "not-found") return undefined;
  if (match) return match;

  var parent = this._parent;
  var distance = 1;
  while (parent) {
    match = parent._lookupSibling(alias);
    if (match) break;
    parent = parent._parent;
    distance++;
  }

  if (match) {
    match = this._createMatch(match.model, match.depth, match.distance + distance);
  }

  this._neighborCache[alias] = match || "not-found";
  return match;
};

/**
 * @private
 * @param {string} alias
 * @returns {AliasMatch | undefined}
 */
AliasLookupTable.prototype._lookup = function (alias) {
  var match = this._aliases[alias];
  if (match) {
    return match === "not-found" ? undefined : match;
  }

  match = this._lookupSelf(alias)
    || this._lookupDescendant(alias)
    || this._lookupSibling(alias)
    || this._lookupAncestor(alias)
    || this._lookupNeighbor(alias);

  this._aliases[alias] = match || "not-found";
  return match;
};

/**
 * @param {ViewModel} model
 */
function collectAliases(model) {
  collect(model, new AliasLookupTable(model));

  /**
   * @param {ViewModel} model
   * @param {AliasLookupTable} aliases
   */
  function collect(model, aliases) {
    Object.defineProperty(model, kAliases, { writable: true, value: aliases });
    if (model.children) {
      normalizeLanguageValuePairs(model.children).forEach(function (child) {
        collect(child, aliases.addChild(child));
      });
    }
  }
}

/**
 * @param {string} uid
 */
function encodeUID(uid) {
  return encodeURI(uid)
    .replace(/[#?]/g, function (s) { return encodeURIComponent(s); })
    .replace(/(\([^(]*\))|[()]/g, function (s, balanced) { return balanced || '\\' + s; });
}

/**
 * @param {string | null} value
 * @param {ViewModel} model
 */
function processAliases(value, model) {
  /** @type {AliasLookupTable | undefined} */
  var aliases = model[kAliases];
  if (value === null || typeof value !== "string" || !aliases) return value;
  return value.replace(/<xref href="([^"#?]+)/g, function (_, uid) {
    var resolved = aliases.lookup(decodeURI(uid));
    if (!resolved) return _;
    return "<xref href=\"" + encodeUID(resolved);
  });
}

/**
 * @param {ViewModel} vm
 * @param {*} gitContribute
 * @param {*} gitUrlPattern
 */
function handleItem(vm, gitContribute, gitUrlPattern) {
  // get contribution information
  vm.docurl = common.getImproveTheDocHref(vm, gitContribute, gitUrlPattern);
  vm.sourceurl = common.getViewSourceHref(vm, null, gitUrlPattern);

  // set to null incase mustache looks up
  vm.summary = processAliases(vm.summary || null, vm);
  vm.remarks = processAliases(vm.remarks || null, vm);
  vm.conceptual = processAliases(vm.conceptual || null, vm);
  vm.syntax = vm.syntax || null;
  vm.implements = vm.implements || null;
  vm.example = vm.example && vm.example.map(function (example) { return processAliases(example, vm); }) || null;
  vm.inheritance = vm.inheritance || null;

  handleItemType(vm);

  if (vm.inheritance) {
    normalizeLanguageValuePairs(vm.inheritance).forEach(handleInheritance);
  }

  common.processSeeAlso(vm);

  // id is used as default template's bookmark
  vm.id = common.getHtmlId(vm.uid);
  if (vm.overload && vm.overload.uid) {
    vm.overload.id = common.getHtmlId(vm.overload.uid);
  }

  // concatenate multiple types with `|`
  if (vm.syntax) {
    var syntax = vm.syntax;
    if (syntax.parameters) {
      syntax.parameters = syntax.parameters.map(function (p) { return handleParameter(vm, p); });
      syntax.parameters = groupParameters(syntax.parameters);
    }
    if (syntax.return) {
      syntax.return = handleParameter(vm, syntax.return);
    }
  }

  vm[kAliases] = null;
}

/**
 * @param {ApiInheritanceTreeBuildOutput} tree
 */
function handleInheritance(tree) {
  tree.type = tree.type || null;
  tree.inheritance = tree.inheritance || null;
  if (tree.inheritance) {
    tree.inheritance.forEach(handleInheritance);
  }
}

/**
 * @param {ViewModel} vm
 * @param {ApiParameterBuildOutput} parameter
 */
function handleParameter(vm, parameter) {
  parameter.description = processAliases(parameter.description || null, vm);

  // change type in syntax from array to string
  /**
   * @param {ApiNames[] | null | undefined} type
   * @param {"name" | "nameWithType" | "fullName" | "specName"} key
   * @returns {ApiNames[] | null}
   */
  var joinTypeProperty = function (type, key) {
    if (!type || !type[0] || !type[0][key]) return null;
    var value = type.map(function (t) {
      return t[key][0].value;
    }).join(' | ');
    return [{
      lang: type[0][key][0].lang,
      value: value
    }];
  };
  if (parameter.type) {
    parameter.type = {
      name: joinTypeProperty(parameter.type, "name"),
      nameWithType: joinTypeProperty(parameter.type, "nameWithType"),
      fullName: joinTypeProperty(parameter.type, "fullName"),
      specName: joinTypeProperty(parameter.type, "specName")
    }
  }
  return parameter;
}

/**
 * @param {ParameterViewModel[]} parameters
 * @returns {ParameterViewModel[]}
 */
function groupParameters(parameters) {
  // group parameter with properties
  if (!parameters || parameters.length == 0) return parameters;
  /** @type {ParameterViewModel[]} */
  var groupedParameters = [];
  /** @type {{ id: string, parameter: ParameterViewModel }[]} */
  var stack = [];
  for (var i = 0; i < parameters.length; i++) {
    var parameter = parameters[i];
    parameter.properties = null;
    var prefixLength = 0;
    while (stack.length > 0) {
      var top = stack.pop();
      var prefix = top.id + '.';
      if (parameter.id.indexOf(prefix) == 0) {
        prefixLength = prefix.length;
        if (!top.parameter.properties) {
          top.parameter.properties = [];
        }
        top.parameter.properties.push(parameter);
        stack.push(top);
        break;
      }
      if (stack.length == 0) {
        groupedParameters.push(top.parameter);
      }
    }
    stack.push({ id: parameter.id, parameter: parameter });
    parameter.id = parameter.id.substring(prefixLength);
  }
  while (stack.length > 0) {
    top = stack.pop();
  }
  groupedParameters.push(top.parameter);
  return groupedParameters;
}

/**
 * @param {ViewModel | null | undefined} model
 * @param {typeof classCategory | typeof namespaceCategory} category
 * @param {Record<string, Definition> | undefined} typeChildrenItems
 */
function groupChildren(model, category, typeChildrenItems) {
  if (!model || !model.type) {
    return;
  }
  if (!typeChildrenItems) {
    var typeChildrenItems = getDefinitions(category);
  }
  var grouped = {};

  normalizeLanguageValuePairs(model.children).forEach(function (c) {
    if (c.isEii) {
      var type = "eii";
    } else {
      var type = c.type.toLowerCase();
    }
    if (!grouped.hasOwnProperty(type)) {
      grouped[type] = [];
    }
    // special handle for field
    if (type === "field" && c.syntax) {
      c.syntax.fieldValue = c.syntax.return;
      c.syntax.return = undefined;
    }
    // special handle for property
    if (type === "property" && c.syntax) {
      c.syntax.propertyValue = c.syntax.return;
      c.syntax.return = undefined;
    }
    // special handle for event
    if (type === "event" && c.syntax) {
      c.syntax.eventType = c.syntax.return;
      c.syntax.return = undefined;
    }
    if (type === "variable" && c.syntax) {
      c.syntax.variableValue = c.syntax.return;
      c.syntax.return = undefined;
    }
    if (type === "typealias" && c.syntax) {
      c.syntax.typeAliasType = c.syntax.return;
      c.syntax.return = undefined;
    }
    grouped[type].push(c);
  });

  var children = [];
  for (var key in typeChildrenItems) {
    if (typeChildrenItems.hasOwnProperty(key) && grouped.hasOwnProperty(key)) {
      var typeChildrenItem = typeChildrenItems[key];
      var items = grouped[key];
      if (items && items.length > 0) {
        /** @type {ViewModel} */
        var item = {};
        for (var itemKey in typeChildrenItem) {
          if (typeChildrenItem.hasOwnProperty(itemKey)){
            item[itemKey] = typeChildrenItem[itemKey];
          }
        }
        handleItemType(item);
        item.children = items;
        children.push(item);
      }
    }
  }

  model.children = children;
}

/**
 * @param {string | null | undefined} type
 */
function getTypePropertyName(type) {
  if (!type) {
    return undefined;
  }
  var loweredType = type.toLowerCase();
  var definition = getDefinition(loweredType);
  if (definition) {
    return definition.typePropertyName;
  }

  return undefined;
}

/**
 * @param {string} type
 */
function getCategory(type) {
  var classItems = getDefinitions(classCategory);
  if (classItems.hasOwnProperty(type)) {
    return classCategory;
  }

  var namespaceItems = getDefinitions(namespaceCategory);
  if (namespaceItems.hasOwnProperty(type)) {
    return namespaceCategory;
  }
  return undefined;
}

/**
 * @param {string} type
 */
function getDefinition(type) {
  var classItems = getDefinitions(classCategory);
  if (classItems.hasOwnProperty(type)) {
    return classItems[type];
  }
  var namespaceItems = getDefinitions(namespaceCategory);
  if (namespaceItems.hasOwnProperty(type)) {
    return namespaceItems[type];
  }
  return undefined;
}

/**
 * @typedef {Partial<Record<keyof _ViewModelCategories, boolean>> & { typePropertyName: string, id: string }} Definition
 */

/**
 * @param {typeof classCategory | typeof namespaceCategory} category
 * @returns {Record<string, Definition> | undefined}
 */
function getDefinitions(category) {
  var namespaceItems = {
    "package":      { inPackage: true,      typePropertyName: "inPackage",      id: "packages" },
    "class":        { inClass: true,        typePropertyName: "inClass",        id: "classes" },
    "struct":       { inStruct: true,       typePropertyName: "inStruct",       id: "structs" },
    "interface":    { inInterface: true,    typePropertyName: "inInterface",    id: "interfaces" },
    "enum":         { inEnum: true,         typePropertyName: "inEnum",         id: "enums" },
    "delegate":     { inDelegate: true,     typePropertyName: "inDelegate",     id: "delegates" },
    "function":     { inFunction: true,     typePropertyName: "inFunction",     id: "functions",    isEmbedded: true },
    "variable":     { inVariable: true,     typePropertyName: "inVariable",     id: "variables",    isEmbedded: true },
    "typealias":    { inTypeAlias: true,    typePropertyName: "inTypeAlias",    id: "typealiases",  isEmbedded: true },
    "namespace":    { inNamespace: true,    typePropertyName: "inNamespace",    id: "namespaces" },
  };
  var classItems = {
    "constructor":  { inConstructor: true,  typePropertyName: "inConstructor",  id: "constructors" },
    "field":        { inField: true,        typePropertyName: "inField",        id: "fields" },
    "property":     { inProperty: true,     typePropertyName: "inProperty",     id: "properties" },
    "method":       { inMethod: true,       typePropertyName: "inMethod",       id: "methods" },
    "event":        { inEvent: true,        typePropertyName: "inEvent",        id: "events" },
    "operator":     { inOperator: true,     typePropertyName: "inOperator",     id: "operators" },
    "eii":          { inEii: true,          typePropertyName: "inEii",          id: "eii" },
    "member":       { inMember: true,       typePropertyName: "inMember",       id: "members"},
    "function":     { inFunction: true,     typePropertyName: "inFunction",     id: "functions" }
  };
  if (category === 'class') {
    return classItems;
  }
  if (category === 'ns') {
    return namespaceItems;
  }
  console.err("category '" + category + "' is not valid.");
  return undefined;
}

/**
 * @template T
 * @param {ApiLanguageValuePair<T>[] | T} list
 * @returns {T}
 */
function normalizeLanguageValuePairs(list) {
  if (list[0] && list[0].lang && list[0].value) {
    return list[0].value;
  }
  return list;
}

/**
 * @template T
 * @typedef {object} ApiLanguageValuePair
 * @property {string} lang
 * @property {T} value
 */

/**
 * @template T
 * @typedef {object} ApiLanguageValuePairWithLevel
 * @property {string} lang
 * @property {T} value
 * @property {number} level
 */

/**
 * @typedef {object} ApiNames
 * @property {string} uid
 * @property {string} [definition]
 * @property {ApiLanguageValuePair<string>[]} [name]
 * @property {ApiLanguageValuePair<string>[]} [nameWithType]
 * @property {ApiLanguageValuePair<string>[]} [fullName]
 * @property {ApiLanguageValuePair<string>[]} [specName]
 */

/**
 * @typedef {object} ApiBuildOutput
 * @property {string} [uid]
 * @property {string} [commentId]
 * @property {ApiLanguageValuePair<ApiNames>[]} [parent]
 * @property {ApiLanguageValuePair<ApiNames>[]} [package]
 * @property {ApiLanguageValuePair<ViewModel[]>[]} [children]
 * @property {string} [href]
 * @property {string[]} [langs]
 * @property {ApiLanguageValuePair<string>[]} [name]
 * @property {ApiLanguageValuePair<string>[]} [nameWithType]
 * @property {ApiLanguageValuePair<string>[]} [fullName]
 * @property {string} [type]
 * @property {ApiLanguageValuePair<SourceDetail>[]} [source]
 * @property {SourceDetail} [documentation]
 * @property {ApiLanguageValuePair<string[]>[]} [assemblies]
 * @property {ApiLanguageValuePair<ApiNames>[]} [namespace]
 * @property {string | null} [summary]
 * @property {string | null} [remarks]
 * @property {string[]} [example]
 * @property {ApiSyntaxBuildOutput} [syntax]
 * @property {ApiLanguageValuePair<ApiNames>[]} [overridden]
 * @property {ApiLanguageValuePair<ApiNames>[]} [overload]
 * @property {ApiLanguageValuePair<ApiExceptionInfoBuildOutput[]>[]} [exceptions]
 * @property {ApiLinkInfoBuildOutput[]} [seealso]
 * @property {string} [seealsoContent]
 * @property {ApiLinkInfoBuildOutput[]} [see]
 * @property {ApiLanguageValuePairWithLevel<ApiInheritanceTreeBuildOutput[]>[]} [inheritance]
 * @property {ApiLanguageValuePair<ApiNames[]>[]} [derivedClasses]
 * @property {ApiLanguageValuePair<ApiNames[]>[]} [implements]
 * @property {ApiLanguageValuePair<ApiNames[]>[]} [inheritedMembers]
 * @property {ApiLanguageValuePair<ApiNames[]>[]} [extensionMethods]
 * @property {string | null} [conceptual]
 * @property {ApiLanguageValuePair<string[]>[]} [platform]
 *
 * // metadata
 * @property {string[]} [alias]
 * @property {boolean} [isEii]
 */

/**
 * @typedef {object} ApiExceptionInfoBuildOutput
 * @property {ApiNames} type
 * @property {string} description
 */

/**
 * @typedef {object} ApiInheritanceTreeBuildOutput
 * @property {ApiNames | null} type
 * @property {ApiInheritanceTreeBuildOutput[] | null} inheritance
 * @property {number} level
 */

/**
 * @typedef {object} ApiLinkInfoBuildOutput
 * @property {*} linkType
 * @property {ApiNames} type
 * @property {string} url
 */

/**
 * @typedef {object} ApiParameterBuildOutput
 * @property {string} id
 * @property {ApiNames[]} [type]
 * @property {string} [description]
 * @property {boolean} [optional]
 * @property {string} [defaultValue]
 */

/**
 * @typedef {object} ApiSyntaxBuildOutput
 * @property {ApiLanguageValuePair<string>[]} [content]
 * @property {ApiParameterBuildOutput[]} [parameters]
 * @property {ApiParameterBuildOutput[]} [typeParameters]
 * @property {ApiLanguageValuePair<ApiParameterBuildOutput>[]} [return]
 */

/**
 * @typedef {object} SourceDetail
 * @property {GitDetail} [remote]
 * @property {string} [base]
 * @property {string} [id]
 * @property {string} [href]
 * @property {string} [path]
 * @property {number} startLine
 * @property {number} endLine
 * @property {string} [content]
 * @property {boolean} [isExternal]
 */

/**
 * @typedef {object} GitDetail
 * @property {string} [path]
 * @property {string} [branch]
 * @property {string} [repo]
 */

/**
 * @typedef _ViewModelCategories
 * @property {boolean | null} [inPackage]
 * @property {boolean | null} [inNamespace]
 * @property {boolean | null} [inClass]
 * @property {boolean | null} [inStruct]
 * @property {boolean | null} [inInterface]
 * @property {boolean | null} [inEnum]
 * @property {boolean | null} [inDelegate]
 * @property {boolean | null} [inFunction]
 * @property {boolean | null} [inVariable]
 * @property {boolean | null} [inTypeAlias]
 * @property {boolean | null} [inConstructor]
 * @property {boolean | null} [inField]
 * @property {boolean | null} [inProperty]
 * @property {boolean | null} [inMethod]
 * @property {boolean | null} [inEvent]
 * @property {boolean | null} [inOperator]
 * @property {boolean | null} [inEii]
 * @property {boolean | null} [inMember]
 * @property {boolean | null} [inFunction]
 */

/**
 * @typedef _ViewModel
 * @property {boolean | null} [isNamespace]
 * @property {boolean | null} [isClass]
 * @property {boolean | null} [isEnum]
 * @property {*} [_gitContribute]
 * @property {*} [_gitUrlPattern]
 * @property {string} [docurl]
 * @property {string} [sourceurl]
 * @property {SyntaxViewModel} [syntax]
 * @property {AliasLookupTable | null} [ALIAS_LOOKUP_TABLE]
 */

/**
 * @typedef {Omit<ApiBuildOutput, "syntax"> & _ViewModelCategories & _ViewModel} ViewModel
 */

/**
 * @typedef {object} _SyntaxViewModel
 * @property {ApiLanguageValuePair<ApiParameterBuildOutput>[]} [fieldValue]
 * @property {ApiLanguageValuePair<ApiParameterBuildOutput>[]} [propertyValue]
 * @property {ApiLanguageValuePair<ApiParameterBuildOutput>[]} [eventType]
 * @property {ApiLanguageValuePair<ApiParameterBuildOutput>[]} [variableValue]
 * @property {ApiLanguageValuePair<ApiParameterBuildOutput>[]} [typeAliasType]
 * @property {ParameterViewModel[]} [parameters]
 */

/**
 * @typedef {Omit<ApiSyntaxBuildOutput, "parameters"> & _SyntaxViewModel} SyntaxViewModel
 */

/**
 * @typedef {object} _ParameterViewModel
 * @property {ApiParameterBuildOutput[]} [properties]
 * @property {string} [id]
 */

/**
 * @typedef {ApiParameterBuildOutput & _ParameterViewModel} ParameterViewModel
 */
