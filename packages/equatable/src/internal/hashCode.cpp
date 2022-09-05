#include "hashCode.h"

// Thomas Wang, Integer Hash Functions.
// http://www.concentric.net/~Ttwang/tech/inthash.htm`
inline uint32_t ComputeUnseededHash(uint32_t key) {
  uint32_t hash = key;
  hash = ~hash + (hash << 15);  // hash = (hash << 15) - hash - 1;
  hash = hash ^ (hash >> 12);
  hash = hash + (hash << 2);
  hash = hash ^ (hash >> 4);
  hash = hash * 2057;  // hash = (hash + (hash << 3)) + (hash << 11);
  hash = hash ^ (hash >> 16);
  return hash & 0x3fffffff;
}

inline uint32_t ComputeLongHash(uint64_t key) {
  uint64_t hash = key;
  hash = ~hash + (hash << 18);  // hash = (hash << 18) - hash - 1;
  hash = hash ^ (hash >> 31);
  hash = hash * 21;  // hash = (hash + (hash << 2)) + (hash << 4);
  hash = hash ^ (hash >> 11);
  hash = hash + (hash << 6);
  hash = hash ^ (hash >> 22);
  return static_cast<uint32_t>(hash & 0x3fffffff);
}

inline uint32_t ComputeSeededHash(uint32_t key, uint64_t seed) {
  return ComputeLongHash(static_cast<uint64_t>(key) ^ seed);
}

inline uint32_t ComputePointerHash(void* ptr) {
  return ComputeUnseededHash(static_cast<uint32_t>(reinterpret_cast<intptr_t>(ptr)));
}

inline uint32_t ComputeAddressHash(v8::internal::Address address) {
  return ComputeUnseededHash(static_cast<uint32_t>(address & 0xFFFFFFFFul));
}

uint32_t HashBigInt(v8::Local<v8::BigInt> bigint_key) {
    int sign_bit = 0;
    int word_count = bigint_key->WordCount();
    std::vector<uint64_t> words;
    words.resize(word_count);
    bigint_key->ToWordsArray(&sign_bit, &word_count, words.data());

    uint32_t hash = ComputeUnseededHash(sign_bit);
    for (uint64_t word : words) {
        hash = (hash << 7) | (hash >> 25);
        hash = hash ^ ComputeLongHash(word);
    }

    return hash;
}

void HashBigInt(const v8::FunctionCallbackInfo<v8::Value>& args) {
    v8::Isolate* isolate = args.GetIsolate();
    v8::HandleScope scope(isolate);

    if (args.Length() < 1 || !args[0]->IsBigInt()) {
        isolate->ThrowException(v8::Exception::TypeError(v8::String::NewFromUtf8(isolate, "Invalid arguments").ToLocalChecked()));
    }

    v8::Local<v8::BigInt> bigint_key = args[0].As<v8::BigInt>();
    uint32_t hash = HashBigInt(bigint_key);
    args.GetReturnValue().Set(v8::Int32::New(isolate, std::_Bit_cast<int32_t>(hash)));
}

uint32_t HashNumber(v8::Local<v8::Number> number_key, v8::Local<v8::Context> context) {
    if (number_key->IsInt32()) {
        return ComputeUnseededHash(number_key->Int32Value(context).FromJust());
    }
    if (number_key->IsUint32()) {
        return ComputeUnseededHash(number_key->Uint32Value(context).FromJust());
    }
    return ComputeLongHash(std::hash<double>{}(number_key->NumberValue(context).FromJust()));
}

void HashNumber(const v8::FunctionCallbackInfo<v8::Value>& args) {
    v8::Isolate* isolate = args.GetIsolate();
    v8::HandleScope scope(isolate);

    if (args.Length() < 1 || !args[0]->IsNumber()) {
        isolate->ThrowException(v8::Exception::TypeError(v8::String::NewFromUtf8(isolate, "Invalid arguments").ToLocalChecked()));
    }

    v8::Local<v8::Number> number_key = args[0].As<v8::Number>();
    uint32_t hash = HashNumber(number_key, isolate->GetCurrentContext());
    args.GetReturnValue().Set(v8::Int32::New(isolate, std::_Bit_cast<int32_t>(hash)));
}

uint32_t HashName(v8::Local<v8::Name> name_key) {
    int hash_int = name_key->GetIdentityHash();
    return std::_Bit_cast<uint32_t>(hash_int);
}

void HashName(const v8::FunctionCallbackInfo<v8::Value>& args) {
    v8::Isolate* isolate = args.GetIsolate();
    v8::HandleScope scope(isolate);

    if (args.Length() < 1 || !args[0]->IsName()) {
        isolate->ThrowException(v8::Exception::TypeError(v8::String::NewFromUtf8(isolate, "Invalid arguments").ToLocalChecked()));
    }

    v8::Local<v8::Name> string_key = args[0].As<v8::Name>();
    uint32_t hash = HashName(string_key);
    args.GetReturnValue().Set(v8::Int32::New(isolate, std::_Bit_cast<int32_t>(hash)));
}

uint32_t HashObject(v8::Local<v8::Object> object_key) {
    int hash_int = object_key->GetIdentityHash();
    return std::_Bit_cast<uint32_t>(hash_int);
}

void HashObject(const v8::FunctionCallbackInfo<v8::Value>& args) {
    v8::Isolate* isolate = args.GetIsolate();
    v8::HandleScope scope(isolate);

    if (args.Length() < 1 || !args[0]->IsObject()) {
        isolate->ThrowException(v8::Exception::TypeError(v8::String::NewFromUtf8(isolate, "Invalid arguments").ToLocalChecked()));
    }

    v8::Local<v8::Object> object_key = args[0].As<v8::Object>();
    uint32_t hash = HashObject(object_key);
    args.GetReturnValue().Set(v8::Int32::New(isolate, std::_Bit_cast<int32_t>(hash)));
}

void HashUnknown(const v8::FunctionCallbackInfo<v8::Value>& args) {
    v8::Isolate* isolate = args.GetIsolate();
    v8::HandleScope scope(isolate);

    if (args.Length() < 1) {
        isolate->ThrowException(v8::Exception::TypeError(v8::String::NewFromUtf8(isolate, "Invalid arguments").ToLocalChecked()));
    }

    v8::Local<v8::Value> key = args[0];
    uint32_t hash = 0;
    if (key->IsNumber()) {
        hash = HashNumber(key.As<v8::Number>(), isolate->GetCurrentContext());
    }
    else if (key->IsName()) {
        hash = HashName(key.As<v8::Name>());
    }
    else if (key->IsBigInt()) {
        hash = HashBigInt(key.As<v8::BigInt>());
    }
    else if (key->IsObject()) {
        hash = HashObject(key.As<v8::Object>());
    }
    else if (key->IsBoolean()) {
        hash = ComputeUnseededHash(key->BooleanValue(isolate) ? 1 : 0);
    }
    else if (key->IsNullOrUndefined()) {
        hash = ComputeUnseededHash(0);
    }
    else {
        isolate->ThrowException(v8::Exception::TypeError(v8::String::NewFromUtf8(isolate, "Invalid arguments").ToLocalChecked()));
    }

    args.GetReturnValue().Set(v8::Int32::New(isolate, std::_Bit_cast<int32_t>(hash)));
}

void Init(v8::Local<v8::Object> exports) {
    NODE_SET_METHOD(exports, "hashBigInt", HashBigInt);
    NODE_SET_METHOD(exports, "hashNumber", HashNumber);
    NODE_SET_METHOD(exports, "hashString", HashName);
    NODE_SET_METHOD(exports, "hashSymbol", HashName);
    NODE_SET_METHOD(exports, "hashObject", HashObject);
    NODE_SET_METHOD(exports, "hashUnknown", HashUnknown);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Init);