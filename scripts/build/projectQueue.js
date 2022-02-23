// @ts-check
const { debounce } = require("./debounce");

/**
 * @param {(projects: readonly string[]) => Promise} action
 */
function createProjectQueue(action) {
    /** @type {string[]} */
    const projects = [];
    const debouncer = debounce(100, async () => {
        return action(projects.splice(0, projects.length));
    });

    /**
     * @param {string} project
     */
    function enqueue(project) {
        projects.push(project);
        return debouncer();
    }
    return enqueue;
}

exports.createProjectQueue = createProjectQueue;