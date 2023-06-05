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

import type { StructFieldDefinition, StructType as StructType_ } from "./index.js";
import { StructImpl } from "./struct.js";
import { StructTypeInfo } from './typeInfo.js';

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
export function StructType<TBase extends readonly StructFieldDefinition[], TDef extends readonly StructFieldDefinition[]>(...args: CreateStructTypeOverloads<TBase, TDef>): StructType_<readonly [...TBase, ...TDef]> {
    let baseType: any;
    let fields: TDef;
    let name: string | undefined;
    if (isStructTypeBaseFieldsNameOverload(args)) {
        [baseType, fields, name] = args;
    }
    else if (isStructTypeFieldsNameOverload(args)) {
        [fields, name] = args;
    }
    else {
        throw new TypeError();
    }

    const baseTypeInfo = baseType && baseType !== StructImpl ? StructTypeInfo.get(baseType) : undefined;
    const structTypeInfo = new StructTypeInfo(name, fields, baseTypeInfo);
    return structTypeInfo.runtimeType as StructType_<readonly [...TBase, ...TDef]>;
}

(StructType as any).prototype = StructImpl;
