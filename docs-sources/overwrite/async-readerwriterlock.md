---
uid: '@esfx/async-readerwriterlock!'
---

The `@esfx/async-readerwriterlock` package provides the @"@esfx/async-readerwriterlock!AsyncReaderWriterLock:class" class, an async coordination primitive.

## Overview

* [Installation](#installation)
* [Usage](#usage)

## Installation

```sh
npm i @esfx/async-readerwriterlock
```

## Usage

### [TypeScript](#tab/ts)
```ts
import { AsyncReaderWriterLock } from "@esfx/async-readerwriterlock";

interface User { id: string, name: string, email: string }

// 'rwlock' protects access to 'userCache' and data stored on disk
const rwlock = new AsyncReaderWriterLock();
const userCache = new Map<string, User>();

async function getUser(id: string) {
    // get read access
    const lk = await rwlock.read();
    try {
        let user = userCache.get(id);
        if (!user) {
            user = await readUserFromDisk(id);
            userCache.set(id, user);
        }
        return user;
    }
    finally {
        // release read access
        lk.unlock();
    }
}

async function addUser(user: User) {
    // get write access
    const lk = await rwlock.write();
    try {
        userCache.set(user.id, user);
        await writeUserToDisk(user.id, user);
    }
    finally {
        // release write access
        lk.unlock();
    }
}

async function updateUser(id: string, oldData: User, newData: User) {
    // get upgradeable read access
    const lk = await rwlock.upgradeableRead();
    try {
        // verify that we are ok to make changes...
        let user = userCache.get(id);
        if (!user || user.name === oldData.name && user.email === oldData.email) {
            // looks safe, so upgrade to a write lock
            const updlk = await lk.upgrade();
            try {
                if (!user) {
                    user = { id } as User;
                    userCache.set(id, user);
                }
                user.name = newData.name;
                user.email = newData.email;
                await writeUserToDisk(user.id, user);
            }
            finally {
                updlk.unlock(); // release the write lock
            }
        }
    }
    finally {
        lk.unlock(); // release the read lock
    }
}
```

### [JavaScript (CommonJS)](#tab/js)
```js
const { AsyncReaderWriterLock } = require("@esfx/async-readerwriterlock");

// 'rwlock' protects access to 'userCache' and data stored on disk
const rwlock = new AsyncReaderWriterLock();
const userCache = new Map();

async function getUser(id) {
    // get read access
    const lk = await rwlock.read();
    try {
        let user = userCache.get(id);
        if (!user) {
            user = await readUserFromDisk(id);
            userCache.set(id, user);
        }
        return user;
    }
    finally {
        // release read access
        lk.unlock();
    }
}

async function addUser(user) {
    // get write access
    const lk = await rwlock.write();
    try {
        userCache.set(user.id, user);
        await writeUserToDisk(user.id, user);
    }
    finally {
        // release write access
        lk.unlock();
    }
}

async function updateUser(id, oldData, newData) {
    // get upgradeable read access
    const lk = await rwlock.upgradeableRead();
    try {
        // verify that we are ok to make changes...
        let user = userCache.get(id);
        if (!user || user.name === oldData.name && user.email === oldData.email) {
            // looks safe, so upgrade to a write lock
            const updlk = await lk.upgrade();
            try {
                if (!user) {
                    user = { id };
                    userCache.set(id, user);
                }
                user.name = newData.name;
                user.email = newData.email;
                await writeUserToDisk(user.id, user);
            }
            finally {
                updlk.unlock(); // release the write lock
            }
        }
    }
    finally {
        lk.unlock(); // release the read lock
    }
}
```

***

## API
