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