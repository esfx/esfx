import { StructFieldDefinition, StructType as StructType_ } from ".";
import { Struct, kDataView } from "./struct";
import { StructTypeInfo } from './typeInfo';

type __Concat<L extends readonly any[], R extends readonly any[]> =
    L extends readonly [] ? R :
    L extends readonly [any] ? ((l0: L[0], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    L extends readonly [any, any] ? ((l0: L[0], l1: L[1], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    L extends readonly [any, any, any] ? ((l0: L[0], l1: L[1], l2: L[2], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    L extends readonly [any, any, any, any] ? ((l0: L[0], l1: L[1], l2: L[2], l3: L[3], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    L extends readonly [any, any, any, any, any] ? ((l0: L[0], l1: L[1], l2: L[2], l3: L[3], l4: L[4], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    L extends readonly [any, any, any, any, any, any] ? ((l0: L[0], l1: L[1], l2: L[2], l3: L[3], l4: L[4], l5: L[5], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    L extends readonly [any, any, any, any, any, any, any] ? ((l0: L[0], l1: L[1], l2: L[2], l3: L[3], l4: L[4], l5: L[5], l6: L[6], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    L extends readonly [any, any, any, any, any, any, any, any] ? ((l0: L[0], l1: L[1], l2: L[2], l3: L[3], l4: L[4], l5: L[5], l6: L[6], l7: L[7], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    L extends readonly [any, any, any, any, any, any, any, any, any] ? ((l0: L[0], l1: L[1], l2: L[2], l3: L[3], l4: L[4], l5: L[5], l6: L[6], l7: L[7], l8: L[8], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    L extends readonly [any, any, any, any, any, any, any, any, any, any] ? ((l0: L[0], l1: L[1], l2: L[2], l3: L[3], l4: L[4], l5: L[5], l6: L[6], l7: L[7], l8: L[8], l9: L[9], ...r: R) => void) extends ((...c: infer C) => void) ? Readonly<C> : never :
    readonly never[];

type CreateStructTypeFieldsNameOverload<TDef extends readonly StructFieldDefinition[]> = [TDef, string?];
type CreateStructTypeBaseFieldsNameOverload<TBase extends readonly StructFieldDefinition[], TDef extends readonly StructFieldDefinition[]> = [StructType_<TBase>, TDef, string?];
type CreateStructTypeOverloads<TBase extends readonly StructFieldDefinition[], TDef extends readonly StructFieldDefinition[]> =
    | CreateStructTypeFieldsNameOverload<TDef>
    | CreateStructTypeBaseFieldsNameOverload<TBase, TDef>;

function isStructTypeFieldsNameOverload<TBase extends readonly StructFieldDefinition[], TDef extends readonly StructFieldDefinition[]>(args: CreateStructTypeOverloads<TBase, TDef>): args is CreateStructTypeFieldsNameOverload<TDef> {
    return Array.isArray(args[0]);
}

function isStructTypeBaseFieldsNameOverload<TBase extends readonly StructFieldDefinition[], TDef extends readonly StructFieldDefinition[]>(args: CreateStructTypeOverloads<TBase, TDef>): args is CreateStructTypeBaseFieldsNameOverload<TBase, TDef> {
    return Array.isArray(args[1]);
}

/* @internal */
export function StructType<TBase extends readonly StructFieldDefinition[], TDef extends readonly StructFieldDefinition[]>(...args: CreateStructTypeOverloads<TBase, TDef>): StructType_<__Concat<TBase, TDef>> {
    let baseType: any;
    let fields: TDef;
    let name: string | undefined;
    if (isStructTypeBaseFieldsNameOverload(args)) {
        [baseType, fields, name] = args;
    }
    else if (isStructTypeFieldsNameOverload(args)) {
        [fields, name] = args;
        baseType = Struct as any;
    }
    else {
        throw new TypeError();
    }

    const baseTypeInfo = StructTypeInfo.get(baseType);
    const structTypeInfo = new StructTypeInfo(fields, baseTypeInfo);
    const structClass = { [name || ""]: class extends baseType { } as StructType_<__Concat<TBase, TDef>> }[name || ""];
    Object.defineProperty(structClass, "name", { value: name });
    for (const field of structTypeInfo.ownFields) {
        Object.defineProperty(structClass.prototype, field.name, {
            enumerable: false,
            configurable: true,
            get(this: Struct<__Concat<TBase, TDef>>) {
                return field.readFrom(this, this[kDataView]);
            },
            set(this: Struct<__Concat<TBase, TDef>>, value) {
                field.writeTo(this, this[kDataView], value);
            }
        });
        Object.defineProperty(structClass.prototype, field.index, {
            enumerable: false,
            configurable: true,
            get(this: Struct<__Concat<TBase, TDef>>) {
                return field.readFrom(this, this[kDataView]);
            },
            set(this: Struct<__Concat<TBase, TDef>>, value) {
                field.writeTo(this, this[kDataView], value);
            }
        });
    }

    return structTypeInfo.finishType(structClass);
}
(StructType as any).prototype = Struct;
