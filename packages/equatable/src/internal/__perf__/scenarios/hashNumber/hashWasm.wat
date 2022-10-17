(module
  (func $hashBigInt64 (param $i64 i64) (result i32)
    (i32.xor (i32.wrap_i64 (local.get $i64)) (i32.wrap_i64 (i64.shr_u (local.get $i64) (i64.const 32))))
  )
  (func $hashFloat64 (param $x f64) (result i32)
    (call $hashBigInt64 (i64.reinterpret_f64 (local.get $x)))
  )
  (func $hashNumber (param $x f64) (result i32)
    (local $i32 i32)
    (local.set $i32 (i32.wrap_i64 (i64.trunc_f64_s (local.get $x))))
    (if
      (f64.eq (f64.convert_i32_s (local.get $i32)) (local.get $x))
      (return (local.get $i32))
    )
    (if
      (f64.ge (local.get $x) (f64.const 0.0))
      (block
        (local.set $i32 (i32.wrap_i64 (i64.trunc_f64_u (local.get $x))))
        (if
          (f64.eq (f64.convert_i32_u (local.get $i32)) (local.get $x))
          (return (i32.shr_s (local.get $i32) (i32.const 0)))
        )
      )
    )
    (call $hashFloat64 (local.get $x))
  )
  (export "hashFloat64" (func $hashFloat64))
  (export "hashNumber" (func $hashFloat64))
)