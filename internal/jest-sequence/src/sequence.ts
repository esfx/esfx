export class Sequence {
    private leadingValues: any[];
    private hasMore: boolean;

    constructor(leadingValues: any[], hasMore: boolean) {
        this.leadingValues = leadingValues;
        this.hasMore = hasMore;
    }

    inspect() {
        return "[" + this.leadingValues.join(", ") + (this.hasMore ? ", ...]" : "]");
    }

    stringify() {
        let values: string[] = [];
        for (const value of this.leadingValues) {
            const json = JSON.stringify(value, undefined, "  ") || "undefined";
            const lines = json.split(/\r\n?|\n/g);
            values.push(lines.map(line => "  " + line).join("\n"));
        }

        if (this.hasMore) {
            values.push("  ...");
        }

        return values.length > 0 ? "[\n" + values.join("\n") + "\n]" : "[]";
    }

    toString() {
        return this.stringify();
    }
}