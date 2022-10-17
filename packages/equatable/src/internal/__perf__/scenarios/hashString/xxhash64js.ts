const PRIME64_1 = BigInt("11400714785074694791");
const PRIME64_2 = BigInt("14029467366897019727");
const PRIME64_3 = BigInt("1609587929392839161");
const PRIME64_4 = BigInt("9650029242287828579");
const PRIME64_5 = BigInt("2870177450012600261");
const N1 = BigInt(1);
const N7 = BigInt(7);
const N11 = BigInt(11);
const N12 = BigInt(12);
const N18 = BigInt(18);
const N23 = BigInt(23);
const N27 = BigInt(27);
const N29 = BigInt(29);
const N31 = BigInt(31);
const N32 = BigInt(32);
const N33 = BigInt(33);
const N37 = BigInt(37);
const N41 = BigInt(41);
const N46 = BigInt(46);
const N52 = BigInt(52);
const N53 = BigInt(53);
const N57 = BigInt(57);
const N63 = BigInt(63);

export function xxh64(buffer: ArrayBuffer, input_ptr: number, inputLength: number, seed: bigint): bigint {
    if (input_ptr % 8) throw new TypeError("Pointer not aligned");
    const buffer_u64 = new BigUint64Array(buffer);
    const _ = new BigUint64Array(8);
    let end: number;
    let limit: number;
    end = input_ptr + inputLength;
    input_ptr >>= 3;
    if (inputLength >= 32) {
        limit = (end - 32) >> 3;
        _[1] = (_[5] = seed, _[5] += PRIME64_1, _[5] += PRIME64_2, _[5]);
        _[2] = (_[5] = seed, _[5] += PRIME64_2, _[5]);
        _[3] = seed;
        _[4] = (_[5] = seed, _[5] -= PRIME64_1, _[5]);
        do {
            _[1] = (_[5] = buffer_u64[input_ptr++], _[6] = _[1], _[5] *= PRIME64_2, _[5] += _[6], _[6] = _[5], _[6] >>= N33, _[5] <<= N31, _[5] |= _[6], _[5] *= PRIME64_1, _[5]);
            _[2] = (_[5] = buffer_u64[input_ptr++], _[6] = _[2], _[5] *= PRIME64_2, _[5] += _[6], _[6] = _[5], _[6] >>= N33, _[5] <<= N31, _[5] |= _[6], _[5] *= PRIME64_1, _[5]);
            _[3] = (_[5] = buffer_u64[input_ptr++], _[6] = _[3], _[5] *= PRIME64_2, _[5] += _[6], _[6] = _[5], _[6] >>= N33, _[5] <<= N31, _[5] |= _[6], _[5] *= PRIME64_1, _[5]);
            _[4] = (_[5] = buffer_u64[input_ptr++], _[6] = _[4], _[5] *= PRIME64_2, _[5] += _[6], _[6] = _[5], _[6] >>= N33, _[5] <<= N31, _[5] |= _[6], _[5] *= PRIME64_1, _[5]);
        }
        while (input_ptr <= limit);
        _[0]  = (_[5] = _[1], _[6] = _[5], _[6] >>= N63, _[5] <<= N1,  _[5] |= _[6], _[5]);
        _[0] += (_[5] = _[2], _[6] = _[5], _[6] >>= N57, _[5] <<= N7,  _[5] |= _[6], _[5]);
        _[0] += (_[5] = _[3], _[6] = _[5], _[6] >>= N52, _[5] <<= N12, _[5] |= _[6], _[5]);
        _[0] += (_[5] = _[4], _[6] = _[5], _[6] >>= N46, _[5] <<= N18, _[5] |= _[6], _[5]);
        _[0] ^= (_[5] = _[1], _[5] *= PRIME64_2, _[6] = _[5], _[6] >>= N33, _[5] <<= N31, _[5] |= _[6], _[5] *= PRIME64_1, _[5]);
        _[0] *= PRIME64_1;
        _[0] += PRIME64_4;
        _[0] ^= (_[5] = _[2], _[5] *= PRIME64_2, _[6] = _[5], _[6] >>= N33, _[5] <<= N31, _[5] |= _[6], _[5] *= PRIME64_1, _[5]);
        _[0] *= PRIME64_1;
        _[0] += PRIME64_4;
        _[0] ^= (_[5] = _[3], _[5] *= PRIME64_2, _[6] = _[5], _[6] >>= N33, _[5] <<= N31, _[5] |= _[6], _[5] *= PRIME64_1, _[5]);
        _[0] *= PRIME64_1;
        _[0] += PRIME64_4;
        _[0] ^= (_[5] = _[4], _[5] *= PRIME64_2, _[6] = _[5], _[6] >>= N33, _[5] <<= N31, _[5] |= _[6], _[5] *= PRIME64_1, _[5]);
        _[0] *= PRIME64_1;
        _[0] += PRIME64_4;
    }
    else {
        _[0] = seed;
        _[0] += PRIME64_5;
    }
    _[0] += BigInt(inputLength);
    limit = (end - 8) >> 3;
    while (input_ptr <= limit) {
        _[0] ^= (_[5] = buffer_u64[input_ptr++], _[5] *= PRIME64_2, _[6] = _[5], _[6] >>= N33, _[5] <<= N31, _[5] |= _[6], _[5] *= PRIME64_1, _[5]);
        _[0] = (_[5] = _[0], _[6] = _[5], _[6] >>= N37, _[5] <<= N27, _[5] |= _[6], _[5] * PRIME64_1);
        _[0] += PRIME64_4;
    }
    input_ptr <<= 1;
    limit = (end - 4) >> 2;
    if (input_ptr <= limit) {
        const buffer_u32 = new Uint32Array(buffer_u64.buffer);
        _[0] ^= (_[5] = BigInt(buffer_u32[input_ptr++]), _[5] *= PRIME64_1, _[5]);
        _[0] = (_[5] = _[0], _[6] = _[5], _[6] >>= N41, _[5] <<= N23, _[5] |= _[6], _[5] * PRIME64_2);
        _[0] += PRIME64_3;
    }
    input_ptr <<= 2;
    if (input_ptr < end) {
        const buffer_u8 = new Uint8Array(buffer_u64.buffer);
        do {
            _[0] ^= (_[5] = BigInt(buffer_u8[input_ptr++]), _[5] *= PRIME64_5, _[5]);
            _[0] = (_[5] = _[0], _[6] = _[5], _[6] >>= N53, _[5] <<= N11, _[5] |= _[6], _[5] * PRIME64_1);
        }
        while (input_ptr < end);
    }
    _[0] ^= (_[5] = _[0] >> N33, _[5]);
    _[0] *= PRIME64_2;
    _[0] ^= (_[5] = _[0] >> N29, _[5]);
    _[0] *= PRIME64_3;
    _[0] ^= (_[5] = _[0] >> N32, _[5]);
    return _[0];
}
