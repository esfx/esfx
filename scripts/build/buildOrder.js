// @ts-check
const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const { toPath } = require("../verifier/utils");

/**
 * @typedef TsConfigEntry
 * @property {ts.ResolvedConfigFileName} file
 * @property {ts.TsConfigSourceFile} sourceFile
 * @property {*} object
 * @property {Set<TsConfigEntry>} references
 * @property {Set<TsConfigEntry>} referencedBy
 */

class BuildOrder {
    /** @type {Map<string, TsConfigEntry>} */
    #projects = new Map();

    /** @type {Set<TsConfigEntry>} */
    #orphans = new Set();

    /**
     * @param {string} project
     * @param {string} cwd
     */
    add(project, cwd = process.cwd()) {
        this.#add(project, cwd, undefined, new Set());
    }

    /**
     * @param {string} file 
     */
    #tryReadTsconfig(file) {
        let text;
        try { text = fs.readFileSync(file, "utf8"); } catch { }
        return typeof text === "string" ? ts.parseJsonText(file, text) : undefined;
    }

    /**
     * @param {string} project
     * @param {string} cwd
     * @param {TsConfigEntry | undefined} referer
     * @param {Set<string>} seen
     */
    #add(project, cwd, referer, seen) {
        /** @type {string} */
        let file;
        let sourceFile;
        /** @type {TsConfigEntry | undefined} */
        let entry;

        file = toPath(path.resolve(cwd, project));
        if (seen.has(file)) throw new Error(`Circular build detected for project: '${project}'`);
        if (entry = this.#projects.get(file)) return this.#finishAdd(entry, referer);
        sourceFile = this.#tryReadTsconfig(file);

        if (sourceFile === undefined) {
            file = toPath(path.join(file, "tsconfig.json"));
            if (seen.has(file)) throw new Error(`Circular build detected for project: '${project}'`);
            if (entry = this.#projects.get(file)) return this.#finishAdd(entry, referer);
            sourceFile = this.#tryReadTsconfig(file);
            if (sourceFile === undefined) {
                throw new Error(`Project not found: ${project}`);
            }
        }

        const object = ts.convertToObject(sourceFile, []);
        if (typeof object !== "object" || object === null) {
            throw new Error(`Invalid project: ${project}`);
        }

        /** @type {string[]} */
        const references = [];
        if (Array.isArray(object.references)) {
            for (const reference of object.references) {
                if (typeof reference !== "object" || reference === null || typeof reference.path !== "string") {
                    throw new Error(`Invalid project: ${project}`);
                }
                references.push(reference.path);
            }
        }

        entry = { file: /** @type {ts.ResolvedConfigFileName}*/(file), sourceFile, object, references: new Set(), referencedBy: new Set() };
        this.#projects.set(file, entry);
        this.#finishAdd(entry, referer);

        for (const reference of references) {
            this.#add(reference, path.dirname(file), entry, seen);
        }
    }

    /**
     * @param {TsConfigEntry} entry
     * @param {TsConfigEntry | undefined} referer
     */
    #finishAdd(entry, referer) {
        if (referer) {
            referer.references.add(entry);
            entry.referencedBy.add(referer);
            this.#orphans.delete(entry);
        }
        else if (entry.referencedBy.size === 0) {
            this.#orphans.add(entry);
        }
    }

    /**
     * @param {ts.ResolvedConfigFileName} file
     */
    getSourceFile(file) {
        return this.#projects.get(file)?.sourceFile;
    }

    /**
     * @param {ts.ResolvedConfigFileName} file
     */
    getJson(file) {
        return this.#projects.get(file)?.object;
    }

    * orphans() {
        for (const entry of this.#orphans) {
            yield entry.file;
        }
    }

    /**
     * @param {ts.ResolvedConfigFileName} file
     */
    * references(file) {
        const entry = this.#projects.get(file);
        if (entry) {
            for (const referenced of entry.references) {
                yield referenced.file;
            }
        }
    }

    /**
     * @param {ts.ResolvedConfigFileName} file
     */
    * referencedBy(file) {
        const entry = this.#projects.get(file);
        if (entry) {
            for (const referenced of entry.referencedBy) {
                yield referenced.file;
            }
        }
    }

    * topological() {
        const entries = [...this.#projects.values()];
        const lookup = new Map(entries.map((entry, i) => [entry, i]));
        const adjacency = entries.map(entry => [...entry.references].map(dep => lookup.get(dep) ?? -1));

        /** @type {number[]} */
        const stack = [];

        const visited = entries.map(() => false);
        for (let i = 0; i < entries.length; i++) {
            if (!visited[i]) {
                topoSortRec(i, visited, stack);
            }
        }

        const indices = entries.map((_, i) => i);
        indices.sort((a, b) => stack.indexOf(a) - stack.indexOf(b));
        yield * indices.map(i => entries[i].file);

        /**
         * @param {number} v
         * @param {boolean[]} visited
         * @param {number[]} stack
         */
        function topoSortRec(v, visited, stack) {
            visited[v] = true;
            for (let i = 0; i < adjacency[v].length; i++) {
                if (!visited[adjacency[v][i]]) {
                    topoSortRec(adjacency[v][i], visited, stack);
                }
            }
            stack.push(v);
        }
    }
}
exports.BuildOrder = BuildOrder;