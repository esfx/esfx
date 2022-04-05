// <usage>
const { AsyncQuery } = require("@esfx/async-iter-query");

let q = AsyncQuery
  .from(books)
  .filter(book => book.author === "Alice")
  .groupBy(book => book.releaseYear);
