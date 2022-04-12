const { CancelToken } = require("@esfx/canceltoken");

// You can compose a cancellation graph with a root CancelToken, allowing you to cancel a large
// number of asynchronous operations all at once

let rootSource = CancelToken.source();

function cancelAllDownloads() {
    // explicitly cancel all downloads
    rootSource.cancel();

    // reset the root source
    rootSource = CancelToken.source();
}

async function downloadFile(url, path, token = CancelToken.none) {
    // Get a token that times out after 60 seconds
    const timeoutToken = CancelToken.timeout(60 * 1000);

    // download can be canceled by either 'rootSource', 'timeoutToken' or 'token':
    const linkedSource = CancelToken.source([rootSource.token, timeoutToken, token]);
    const linkedToken = linkedSource.token;

    // ... use linkedToken to observe cancellation.
}
