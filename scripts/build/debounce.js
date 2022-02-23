// @ts-check

/**
 * @param {number} timeout
 * @param {() => Promise} action
 */
function debounce(timeout, action) {
    /** @type {{ promise: Promise, resolve: (value: any) => void, reject: (value: any) => void }} */
    let deferred;
    let timer;

    function enqueue() {
        if (timer) {
            clearTimeout(timer);
            timer = undefined;
        }
        if (!deferred) {
            // @ts-ignore
            deferred = {};
            deferred.promise = new Promise((resolve, reject) => {
                deferred.resolve = resolve;
                deferred.reject = reject;
            });
        }
        timer = setTimeout(run, timeout);
        return deferred.promise;
    }

    function run() {
        if (timer) {
            clearTimeout(timer);
            timer = undefined;
        }
        const currentDeferred = deferred;
        deferred = undefined;
        try {
            currentDeferred.resolve(action());
        }
        catch (e) {
            currentDeferred.reject(e);
        }
    }

    return enqueue;
}

exports.debounce = debounce;