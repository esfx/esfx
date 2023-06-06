/*!
   Copyright 2023 Ron Buckton

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

import { bool8, bool32, int8, int16, int32, uint8, uint16, uint32, bigint64, biguint64, float32, float64} from "./primitive.js";
import { ArrayType } from "./array.js";
import { StructType } from "./struct.js";

export {
    int8 as __int8,
    int16 as __int16,
    int32 as __int32,
    bigint64 as __int64,
    int8 as char,
    int16 as short,
    int32 as int,
    int32 as long,
    bigint64 as longlong,
    uint8 as uchar,
    uint16 as ushort,
    uint32 as uint,
    uint32 as ulong,
    biguint64 as ulonglong,
    float32 as float,
    float64 as double,
    uint8 as char8_t,
    uint16 as char16_t,
    uint32 as char32_t,
    uint16 as wchar_t,
    bool32 as BOOL,
    bool8 as BOOLEAN,
    uint8 as BYTE,
    float32 as FLOAT,
    int8 as CHAR,
    int8 as CCHAR,
    uint8 as UCHAR,
    uint16 as WCHAR,
    int8 as INT8,
    int16 as INT16,
    int32 as INT32,
    bigint64 as INT64,
    uint8 as UINT8,
    uint16 as UINT16,
    uint32 as UINT32,
    biguint64 as UINT64,
    int32 as LONG32,
    bigint64 as LONG64,
    uint32 as ULONG32,
    biguint64 as ULONG64,
    int16 as SHORT,
    int32 as INT,
    int32 as LONG,
    bigint64 as LONGLONG,
    uint16 as USHORT,
    uint32 as UINT,
    uint32 as ULONG,
    biguint64 as ULONGLONG,
    uint16 as WORD,
    uint32 as DWORD,
    biguint64 as DWORDLONG,
    uint32 as DWORD32,
    biguint64 as DWORD64,
    biguint64 as QWORD,
};

export const GUID = StructType({
    Data1: uint32,
    Data2: uint16,
    Data3: uint16,
    Data4: ArrayType(uint8, 8)
});
export type GUID = InstanceType<typeof GUID>;
