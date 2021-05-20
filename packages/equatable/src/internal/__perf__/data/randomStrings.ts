import { inRange, Range } from "./range";

export const SAMPLE_SIZE = 10_000;
const MAX_UNICODE_CODEPOINT = 0x10FFFF;
const MAX_ASCII_CODEPOINT = 0xff;
const PERCENT_ASCII: Range = [0,    0.30, "[)"];
const PERCENT_SMALL: Range = [0,    0.15, "[)"];
const PERCENT_LARGE: Range = [0.15, 0.17, "[)"];
const SMALL_SIZE = 5;
const MEDIUM_SIZE = 512;
const LARGE_SIZE = 10_000;

const RANGE_CONTROL1: Range = [0,           8,          "[]"];
const RANGE_CONTROL2: Range = [14,          31,         "[]"];
const RANGE_CONTROL3: Range = [127,         159,        "[]"];
const PRIVATE_USE1: Range   = [0xe000,      0xf8ff,     "[]"];
const PRIVATE_USE2: Range   = [0xf0000,     0xffffd,    "[]"];
const PRIVATE_USE3: Range   = [0x100000,    0x10FFFD,   "[]"];

function isControl(codePoint: number) {
    return inRange(codePoint, RANGE_CONTROL1)
        || inRange(codePoint, RANGE_CONTROL2)
        || inRange(codePoint, RANGE_CONTROL3);
}

function isPrivateUse(codePoint: number) {
    return inRange(codePoint, PRIVATE_USE1)
        || inRange(codePoint, PRIVATE_USE2)
        || inRange(codePoint, PRIVATE_USE3);
}

function randomAsciiCodePoint() {
    let value: number;
    do value = Math.floor(Math.random() * MAX_ASCII_CODEPOINT);
    while (isControl(value));
    return value;
}

function randomUnicodeCodePoint() {
    let value: number;
    do value = Math.floor(Math.random() * MAX_UNICODE_CODEPOINT);
    while (isControl(value) || isPrivateUse(value));
    return value;
}

function randomSmallStringLength() {
    return Math.max(0, Math.min(SMALL_SIZE, Math.floor(Math.random() * (SMALL_SIZE + 1))));
}

function randomMediumStringLength() {
    let value: number;
    do value = Math.ceil(Math.random() * MEDIUM_SIZE);
    while (value <= SMALL_SIZE);
    return value;
}

function randomLargeStringLength() {
    let value: number;
    do value = Math.ceil(Math.random() * LARGE_SIZE);
    while (value <= MEDIUM_SIZE);
    return value;
}

function randomStringLength() {
    const p = Math.random();
    return inRange(p, PERCENT_SMALL) ? randomSmallStringLength() :
        inRange(p, PERCENT_LARGE) ? randomLargeStringLength() :
        randomMediumStringLength();
}

export function randomString(size: "small" | "medium" | "large" | number = randomStringLength(), unicode = !inRange(Math.random(), PERCENT_ASCII)) {
    if (typeof size === "string") {
        size = size === "small" ? randomSmallStringLength() :
            size === "medium" ? randomMediumStringLength() :
            size === "large" ? randomLargeStringLength() :
            randomStringLength();
    }
    const randomCodePoint = unicode ?
        randomUnicodeCodePoint :
        randomAsciiCodePoint;
    const codePoints: number[] = [];
    for (let i = 0; i < size; i++) {
        codePoints[i] = randomCodePoint();
    }
    let value = "";
    while (codePoints.length > 0) {
        const chunk = codePoints.splice(0, 1024);
        value += String.fromCodePoint(...chunk);
    }
    return value;
}

export function generateRandomStrings() {
    const randomStrings: string[] = [];
    for (let i = 0; i < SAMPLE_SIZE; i++) {
        randomStrings[i] = randomString();
    }
    return randomStrings;
}
