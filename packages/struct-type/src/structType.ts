/*!
   Copyright 2019 Ron Buckton

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import type { StructDefinition, StructFieldDefinition, StructInheritedDefinition, StructType as StructType_, Type } from "./index.js";
import { StructImpl } from "./struct.js";
import { StructTypeInfo } from './typeInfo.js';

type TFieldsConstraint = { readonly [key: string | symbol]: Type };
type TOrderConstraint<TFields extends TFieldsConstraint> = readonly (keyof TFields)[];
type TDefConstraint = readonly StructFieldDefinition[];

type Overload0<TFields extends TFieldsConstraint> = [fields: TFields, name?: string];
type Overload1<TFields extends TFieldsConstraint, TOrder extends TOrderConstraint<TFields>> = [fields: TFields, order: TOrder | undefined, name?: string];
type Overload2<TBaseDef extends StructDefinition, TFields extends TFieldsConstraint> = [baseType: StructType_<TBaseDef>, fields: TFields, name?: string];
type Overload3<TBaseDef extends StructDefinition, TFields extends TFieldsConstraint, TOrder extends TOrderConstraint<TFields>> = [baseType: StructType_<TBaseDef>, fields: TFields, order: TOrder | undefined, name?: string];
type Overload4<TDef extends TDefConstraint> = [fields: TDef, name?: string];
type Overload5<TBaseDef extends StructDefinition, TDef extends TDefConstraint> = [baseType: StructType_<TBaseDef>, fields: TDef, name?: string];
type Overloads<
    TBaseDef extends StructDefinition,
    TFields extends TFieldsConstraint,
    TOrder extends TOrderConstraint<TFields>,
    TDef extends TDefConstraint
> = 
    | Overload0<TFields>
    | Overload1<TFields, TOrder>
    | Overload2<TBaseDef, TFields>
    | Overload3<TBaseDef, TFields, TOrder>
    | Overload4<TDef>
    | Overload5<TBaseDef, TDef>
    ;

function isBaseTypeArg(arg: unknown) {
    return arg instanceof StructType;
}

function isFieldsObjectArg(arg: unknown) {
    if (arg === null) return false;
    if (typeof arg !== "object") return false;
    if (Object.getPrototypeOf(arg) !== Object.prototype) return false;
    return true;
}

function isFieldsArrayArg(arg: unknown) {
    if (!Array.isArray(arg)) return false;
    if (!arg.every(element => typeof element === "object" && element !== null && "name" in element && "type" in element)) return false;
    return true;
}

function isOrderArg(arg: unknown) {
    if (arg === undefined) return true;
    if (!Array.isArray(arg)) return false;
    if (!arg.every(element => typeof element === "string" || typeof element === "symbol" || typeof element === "number")) return false;
    return true;
}

function isNameArg(arg: unknown) {
    if (arg === undefined) return true;
    if (typeof arg !== "string") return false;
    return true;
}

function isOverload0<TBaseDef extends StructDefinition, TFields extends TFieldsConstraint, TOrder extends TOrderConstraint<TFields>, TDef extends TDefConstraint>(args: Overloads<TBaseDef, TFields, TOrder, TDef>): args is Overload0<TFields> {
    return (
        args.length <= 2 &&
        /*fields*/ (args.length > 0 && isFieldsObjectArg(args[0])) &&
        /*name*/ (args.length <= 1 || isNameArg(args[1]))
    );
}

function isOverload1<TBaseDef extends StructDefinition, TFields extends TFieldsConstraint, TOrder extends TOrderConstraint<TFields>, TDef extends TDefConstraint>(args: Overloads<TBaseDef, TFields, TOrder, TDef>): args is Overload1<TFields, TOrder> {
    return (
        args.length <= 3 &&
        /*fields*/ (args.length > 0 && isFieldsObjectArg(args[0])) &&
        /*order*/ (args.length <= 1 || isOrderArg(args[1])) &&
        /*name*/ (args.length <= 2 || isNameArg(args[2]))
    );
}

function isOverload2<TBaseDef extends StructDefinition, TFields extends TFieldsConstraint, TOrder extends TOrderConstraint<TFields>, TDef extends TDefConstraint>(args: Overloads<TBaseDef, TFields, TOrder, TDef>): args is Overload2<TBaseDef, TFields> {
    return (
        args.length <= 3 &&
        /*baseType*/ args.length > 0 && isBaseTypeArg(args[0]) &&
        /*fields*/ (args.length < 1 && isFieldsObjectArg(args[1])) &&
        /*name*/ (args.length <= 2 || isNameArg(args[2]))
    );
}

function isOverload3<TBaseDef extends StructDefinition, TFields extends TFieldsConstraint, TOrder extends TOrderConstraint<TFields>, TDef extends TDefConstraint>(args: Overloads<TBaseDef, TFields, TOrder, TDef>): args is Overload3<TBaseDef, TFields, TOrder> {
    return (
        args.length <= 4 &&
        /*baseType*/ args.length > 0 && isBaseTypeArg(args[0]) &&
        /*fields*/ (args.length > 1 && isFieldsObjectArg(args[1])) &&
        /*order*/ (args.length <= 2 || isOrderArg(args[2])) &&
        /*name*/ (args.length <= 3 || isNameArg(args[3]))
    );
}

function isOverload4<TBaseDef extends StructDefinition, TFields extends TFieldsConstraint, TOrder extends TOrderConstraint<TFields>, TDef extends TDefConstraint>(args: Overloads<TBaseDef, TFields, TOrder, TDef>): args is Overload4<TDef> {
    return (
        args.length <= 2 &&
        /*fields*/ (args.length > 0 && isFieldsArrayArg(args[0])) &&
        /*name*/ (args.length <= 1 || isNameArg(args[1]))
    );
}

function isOverload5<TBaseDef extends StructDefinition, TFields extends TFieldsConstraint, TOrder extends TOrderConstraint<TFields>, TDef extends TDefConstraint>(args: Overloads<TBaseDef, TFields, TOrder, TDef>): args is Overload5<TBaseDef, TDef> {
    return (
        args.length <= 3 &&
        /*baseType*/ args.length > 0 && isBaseTypeArg(args[0]) &&
        /*fields*/ (args.length > 1 && isFieldsArrayArg(args[1])) &&
        /*name*/ (args.length <= 2 || isNameArg(args[2]))
    );
}

/* @internal */
export function StructType<
    TBaseDef extends StructDefinition,
    TFields extends TFieldsConstraint,
    TOrder extends TOrderConstraint<TFields>,
    TDef extends TDefConstraint
>(...args: Overloads<TBaseDef, TFields, TOrder, TDef>): StructType_<StructInheritedDefinition<TBaseDef, TFields, TOrder>> {
    let baseType: StructType_<TBaseDef> | typeof StructImpl | undefined;
    let fields: TFields | undefined;
    let order: TOrder | undefined;
    let name: string | undefined;
    let fieldsArray: TDef | undefined;

    if (isOverload0(args)) [fields, name] = args;
    else if (isOverload1(args)) [fields, order, name] = args;
    else if (isOverload2(args)) [baseType, fields, name] = args;
    else if (isOverload3(args)) [baseType, fields, order, name] = args;
    else if (isOverload4(args)) [fieldsArray, name] = args;
    else if (isOverload5(args)) [baseType, fieldsArray, name] = args;
    else throw new TypeError("Invalid arguments");

    if (fieldsArray) {
        const tmpFieldsObject: { [key: string | symbol]: Type } = {};
        const tmpOrder: (keyof TFields)[] = [];
        for (let i = 0; i < fieldsArray.length; i++) {
            const field = fieldsArray[i];
            tmpFieldsObject[field.name] = field.type;
            tmpOrder.push(field.name);
        }
        fields = tmpFieldsObject as TFields;
        order = tmpOrder as TOrderConstraint<TFields> as TOrder;
    }

    if (fields === undefined) throw new TypeError("Invalid arguments");
    if (order === undefined) {
        order = Reflect.ownKeys(fields) as TOrderConstraint<TFields> as TOrder;
    }

    const baseTypeInfo = baseType && baseType !== StructImpl ? StructTypeInfo.get(baseType) : undefined;
    const structTypeInfo = new StructTypeInfo(name, fields, order, baseTypeInfo);
    return structTypeInfo.runtimeType as StructType_<StructInheritedDefinition<TBaseDef, TFields, TOrder>>;
}

(StructType as any).prototype = StructImpl;
