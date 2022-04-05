import "@esfx/collection-core-dom-shim"; // triggers global-scope side effects
import { ReadonlyIndexedCollection } from "@esfx/collection-core";

document.forms[ReadonlyIndexedCollection.size]; // gets the number of forms in the document
