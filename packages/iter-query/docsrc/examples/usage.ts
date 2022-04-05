// <usage>
import { Query } from "@esfx/iter-query";

let q = Query
  .from(books)
  .filter(book => book.author === "Alice")
  .groupBy(book => book.releaseYear);

// </usage>
declare var books: { author: string, releaseYear: number }[];