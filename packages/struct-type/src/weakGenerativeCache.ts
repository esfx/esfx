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

interface GenerationRecord<V> {
    generation: number;
    phase: number;
    counter: number;
    value: V;
}

/**
 * A WeakMap-based cache that determines cache entry lifetime using generations. The more frequently
 * a cache entry is accessed, the longer it remains in the cache.
 *
 * @internal
 */
export class WeakGenerativeCache<K extends object, V> {
    private _generations = [
        // gen 0
        [new WeakMap<K, GenerationRecord<V>>(), new WeakMap<K, GenerationRecord<V>>()],
        // gen 1
        [new WeakMap<K, GenerationRecord<V>>()],
        // gen 2
        [new WeakMap<K, GenerationRecord<V>>()],
    ];

    private _gen0Phase = 0;
    private _accessCounter = 0;

    has(key: K) {
        const record = this._find(key);
        if (record) {
            this._access(key, record);
            return true;
        }
        return false;
    }

    get(key: K) {
        const record = this._find(key);
        if (record) {
            this._access(key, record);
            this._prune();
            return record.value;
        }
    }

    set(key: K, value: V) {
        let record = this._find(key);
        if (!record) {
            this._prune();
            record = { generation: 0, phase: this._gen0Phase, counter: 0, value };
            this._generations[record.generation][record.phase].set(key, record);
        }
        else {
            this._access(key, record);
            this._prune();
            record.value = value;
        }
    }

    delete(key: K) {
        const record = this._find(key);
        if (record) {
            this._generations[record.generation][record.phase].delete(key);
            this._prune();
            return true;
        }
        return false;
    }

    clear() {
        for (const generation of this._generations) {
            for (let i = 0; i < generation.length; i++) {
                generation[i] = new WeakMap();
            }
        }
        this._accessCounter = 0;
        this._gen0Phase = 0;
    }

    private _find(key: K) {
        for (const generation of this._generations) {
            for (const phase of generation) {
                const record = phase.get(key);
                if (record) return record;
            }
        }
    }

    private _access(key: K, record: GenerationRecord<V>) {
        if (record.generation < 2) {
            record.counter++;
            if (this._shouldPromote(record)) {
                const currentGen = this._generations[record.generation][record.phase];
                currentGen.delete(key);
                record.generation++;
                record.phase = 0;
                record.counter = 1;
                const nextGen = this._generations[record.generation][record.phase];
                nextGen.set(key, record);
            }
        }
    }

    private _shouldPromote(record: GenerationRecord<V>) {
        switch (record.generation) {
            case 0: return record.counter >= 1;
            case 1: return record.counter >= 2;
        }
        return false;
    }

    private _prune() {
        this._accessCounter++;
        if (this._accessCounter >= 10) {
            this._gen0Phase = this._gen0Phase ? 0 : 1;
            this._generations[0][this._gen0Phase] = new WeakMap()
            this._accessCounter = 0;
        }
    }
}