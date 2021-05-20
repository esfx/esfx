export type Exclusivity =
    | "[]"
    | "[)"
    | "(]"
    | "()"
    ;

export type Range = 
    | readonly [minInclusive: number, maxInclusive: number, exclusivity: "[]"]
    | readonly [minInclusive: number, maxExclusive: number, exclusivity: "[)"]
    | readonly [minExclusive: number, maxInclusive: number, exclusivity: "(]"]
    | readonly [minExclusive: number, maxExclusive: number, exclusivity: "()"]
    | readonly [min: number, max: number, exclusivity?: Exclusivity]
    ;

export function inRange(value: number, [min, max, exclusivity = "[)"]: Range) {
    return (
        exclusivity === "[]" ? value >= min && value <= max :
        exclusivity === "[)" ? value >= min && value < max :
        exclusivity === "(]" ? value > min && value <= max :
        exclusivity === "()" ? value > min && value < max :
        false
    );
}
