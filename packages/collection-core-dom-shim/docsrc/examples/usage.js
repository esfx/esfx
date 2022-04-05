require("@esfx/collection-core-dom-shim"); // triggers global-scope side effects
const { ReadonlyIndexedCollection } = require("@esfx/collection-core");

document.forms[ReadonlyIndexedCollection.size]; // gets the number of forms in the document