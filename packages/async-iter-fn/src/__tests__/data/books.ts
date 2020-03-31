export interface Book { title: string; id: number }
export const bookA3 = { title: "A", id: 3 };
export const bookA4 = { title: "A", id: 4 };
export const bookB1 = { title: "B", id: 1 };
export const bookB2 = { title: "B", id: 2 };
export const bookB2_same = { title: "B", id: 2 };
export const books = [bookA4, bookB2, bookB1, bookA3];
export const books_same = [bookB2, bookB2_same];
export const bookHierarchy = {
    owns(_: Book) { return true; },
    parent(): Book { return undefined!; },
    children(): Book[] { return undefined!; }
};