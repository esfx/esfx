const { delay } = require("@esfx/async-delay");

async function doSomeAction() {
    // wait 10 seconds
    await delay(10 * 1000);
}
