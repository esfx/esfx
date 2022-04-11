import { CancelToken } from "@esfx/canceltoken";

// You can compose a cancellation graph with a root CancelToken, allowing you to cancel a large
// number of asynchronous operations all at once

let rootSource = CancelToken.source();

function cancelAllDownloads() {
    // explicitly cancel all downloads
    rootSource.cancel();

    // reset the root source
    rootSource = CancelToken.source();
}

async function downloadFile(url: string, path: string, token = CancelToken.none) {
    // add own source for timeout after 60 seconds
    const timeoutSource = CancelToken.source();
    setTimeout(() => timeoutSource.cancel(), 60 * 1000);

    // download can be canceled by either 'rootSource', 'timeoutSource' or 'token':
    const linkedToken = CancelToken.race([rootSource.token, timeoutSource.token, token]);

    // ... use linkedToken to observe cancellation.
}
