// <usage>
import { AsyncQuery } from "@esfx/async-iter-query";

let q = AsyncQuery
  .from(books)
  .filter(book => book.author === "Alice")
  .groupBy(book => book.releaseYear);

// </usage>
declare var books: { author: string, releaseYear: number }[];