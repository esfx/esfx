const { Query } = require("@esfx/iter-query");

let q = Query
  .from(books)
  .filter(book => book.author === "Alice")
  .groupBy(book => book.releaseYear);
