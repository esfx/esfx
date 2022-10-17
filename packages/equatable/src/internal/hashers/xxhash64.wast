;; xxHash Library
;; Copyright (c) 2012-2021 Yann Collet
;; All rights reserved.
;;
;; BSD 2-Clause License (https://www.opensource.org/licenses/bsd-license.php)
;;
;; Redistribution and use in source and binary forms, with or without modification,
;; are permitted provided that the following conditions are met:
;;
;; * Redistributions of source code must retain the above copyright notice, this
;;   list of conditions and the following disclaimer.
;;
;; * Redistributions in binary form must reproduce the above copyright notice, this
;;   list of conditions and the following disclaimer in the documentation and/or
;;   other materials provided with the distribution.
;;
;; THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
;; ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
;; WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
;; DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
;; ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
;; (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
;; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
;; ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
;; (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
;; SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
;;
;; The MIT License (MIT)
;; =====================
;;
;; Copyright © 2017 Michael Jungo
;;
;; Permission is hereby granted, free of charge, to any person
;; obtaining a copy of this software and associated documentation
;; files (the “Software”), to deal in the Software without
;; restriction, including without limitation the rights to use,
;; copy, modify, merge, publish, distribute, sublicense, and/or sell
;; copies of the Software, and to permit persons to whom the
;; Software is furnished to do so, subject to the following
;; conditions:
;;
;; The above copyright notice and this permission notice shall be
;; included in all copies or substantial portions of the Software.
;;
;; THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
;; EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
;; OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
;; NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
;; HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
;; WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
;; FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
;; OTHER DEALINGS IN THE SOFTWARE.

(module
  (memory (export "mem") 1)

  (global $PRIME64_1 i64 (i64.const 11400714785074694791))
  (global $PRIME64_2 i64 (i64.const 14029467366897019727))
  (global $PRIME64_3 i64 (i64.const  1609587929392839161))
  (global $PRIME64_4 i64 (i64.const  9650029242287828579))
  (global $PRIME64_5 i64 (i64.const  2870177450012600261))

  ;; This is the actual WebAssembly implementation for one-shot XXH64.
  ;; $ptr indicates the beginning of the memory where the to-be-hashed data is stored.
  ;; $len is the length of the data.
  ;; $seed is the seed to be used in the hash invocation
  (func (export "xxh64") (param $ptr i32) (param $len i32) (param $seed i64) (result i64)
        (local $h64 i64)
        (local $end i32)
        (local $limit i32)
        (local $v1 i64)
        (local $v2 i64)
        (local $v3 i64)
        (local $v4 i64)
        (local.set $end (i32.add (local.get $ptr) (local.get $len)))
        (if
          (i32.ge_u (local.get $len) (i32.const 32))
          (block
            (local.set $limit (i32.sub (local.get $end) (i32.const 32)))
            (local.set $v1 (i64.add (i64.add (local.get $seed) (global.get $PRIME64_1)) (global.get $PRIME64_2)))
            (local.set $v2 (i64.add (local.get $seed) (global.get $PRIME64_2)))
            (local.set $v3 (i64.add (local.get $seed) (i64.const 0)))
            (local.set $v4 (i64.sub (local.get $seed) (global.get $PRIME64_1)))
            ;; For every chunk of 4 words, so 4 * 64bits = 32 bytes
            (loop $4words-loop
                  (local.set $v1 (call $round64 (local.get $v1) (i64.load (local.get $ptr))))
                  (local.set $ptr (i32.add (local.get $ptr) (i32.const 8)))
                  (local.set $v2 (call $round64 (local.get $v2) (i64.load (local.get $ptr))))
                  (local.set $ptr (i32.add (local.get $ptr) (i32.const 8)))
                  (local.set $v3 (call $round64 (local.get $v3) (i64.load (local.get $ptr))))
                  (local.set $ptr (i32.add (local.get $ptr) (i32.const 8)))
                  (local.set $v4 (call $round64 (local.get $v4) (i64.load (local.get $ptr))))
                  (local.set $ptr (i32.add (local.get $ptr) (i32.const 8)))
                  (br_if $4words-loop (i32.le_u (local.get $ptr) (local.get $limit))))
            (local.set $h64 (i64.add
                              (i64.rotl (local.get $v1) (i64.const 1))
                              (i64.add
                                (i64.rotl (local.get $v2) (i64.const 7))
                                (i64.add
                                  (i64.rotl (local.get $v3) (i64.const 12))
                                  (i64.rotl (local.get $v4) (i64.const 18))))))
            (local.set $h64 (call $merge-round64 (local.get $h64) (local.get $v1)))
            (local.set $h64 (call $merge-round64 (local.get $h64) (local.get $v2)))
            (local.set $h64 (call $merge-round64 (local.get $h64) (local.get $v3)))
            (local.set $h64 (call $merge-round64 (local.get $h64) (local.get $v4))))
          ;; else block, when input is smaller than 32 bytes
          (local.set $h64 (i64.add (local.get $seed) (global.get $PRIME64_5))))
        (local.set $h64 (i64.add (local.get $h64) (i64.extend_i32_u (local.get $len))))
        (call $finalize64 (local.get $h64) (local.get $ptr) (i32.and (local.get $len) (i32.const 31))))

  (func $finalize64 (param $h64 i64) (param $ptr i32) (param $len i32) (result i64)
        (local $end i32)
        (local.set $end (i32.add (local.get $ptr) (local.get $len)))
        ;; For the remaining words not covered above, either 0, 1, 2 or 3
        (block $exit-remaining-words
               (loop $remaining-words-loop
                     (br_if $exit-remaining-words (i32.gt_u (i32.add (local.get $ptr) (i32.const 8)) (local.get $end)))
                     (local.set $h64 (i64.xor (local.get $h64) (call $round64 (i64.const 0) (i64.load (local.get $ptr)))))
                     (local.set $h64 (i64.add
                                       (i64.mul
                                         (i64.rotl (local.get $h64) (i64.const 27))
                                         (global.get $PRIME64_1))
                                       (global.get $PRIME64_4)))
                     (local.set $ptr (i32.add (local.get $ptr) (i32.const 8)))
                     (br $remaining-words-loop)))
        ;; For the remaining half word. That is when there are more than 32bits
        ;; remaining which didn't make a whole word.
        (if
          (i32.le_u (i32.add (local.get $ptr) (i32.const 4)) (local.get $end))
          (block
            (local.set $h64 (i64.xor (local.get $h64) (i64.mul (i64.load32_u (local.get $ptr)) (global.get $PRIME64_1))))
            (local.set $h64 (i64.add
                              (i64.mul
                                (i64.rotl (local.get $h64) (i64.const 23))
                                (global.get $PRIME64_2))
                              (global.get $PRIME64_3)))
            (local.set $ptr (i32.add (local.get $ptr) (i32.const 4)))))
        ;; For the remaining bytes that didn't make a half a word (32bits),
        ;; either 0, 1, 2 or 3 bytes, as 4bytes = 32bits = 1/2 word.
        (block $exit-remaining-bytes
               (loop $remaining-bytes-loop
                     (br_if $exit-remaining-bytes (i32.ge_u (local.get $ptr) (local.get $end)))
                     (local.set $h64 (i64.xor (local.get $h64) (i64.mul (i64.load8_u (local.get $ptr)) (global.get $PRIME64_5))))
                     (local.set $h64 (i64.mul (i64.rotl (local.get $h64) (i64.const 11)) (global.get $PRIME64_1)))
                     (local.set $ptr (i32.add (local.get $ptr) (i32.const 1)))
                     (br $remaining-bytes-loop)))
        (local.set $h64 (i64.xor (local.get $h64) (i64.shr_u (local.get $h64) (i64.const 33))))
        (local.set $h64 (i64.mul (local.get $h64) (global.get $PRIME64_2)))
        (local.set $h64 (i64.xor (local.get $h64) (i64.shr_u (local.get $h64) (i64.const 29))))
        (local.set $h64 (i64.mul (local.get $h64) (global.get $PRIME64_3)))
        (local.set $h64 (i64.xor (local.get $h64) (i64.shr_u (local.get $h64) (i64.const 32))))
        (local.get $h64))

  (func $round64 (param $acc i64) (param $value i64) (result i64)
        (local.set $acc (i64.add (local.get $acc) (i64.mul (local.get $value) (global.get $PRIME64_2))))
        (local.set $acc (i64.rotl (local.get $acc) (i64.const 31)))
        (local.set $acc (i64.mul (local.get $acc) (global.get $PRIME64_1)))
        (local.get $acc))

  (func $merge-round64 (param $acc i64) (param $value i64) (result i64)
        (local.set $value (call $round64 (i64.const 0) (local.get $value)))
        (local.set $acc (i64.xor (local.get $acc) (local.get $value)))
        (local.set $acc (i64.add (i64.mul (local.get $acc) (global.get $PRIME64_1)) (global.get $PRIME64_4)))
        (local.get $acc))
)