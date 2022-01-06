import chunk from "../utils/chunk.ts";
import xmlparser from "../utils/xmlparser.ts";
// import pointer from "../utils/pointer.ts";

const fileDefinitions = [
  { name: "magic", type: "prefix", limit: 4 },
  { name: "title", type: "binary", limit: 6 },
  { name: "chapterTitles", type: "extend", limit: 16 },
  { name: "chapterContents", type: "extend", limit: 16 },
];

async function exportBook(name: string, lookUpPath = "./in") {
  let book = new chunk(fileDefinitions);

  let lookUp = JSON.parse(await Deno.readTextFile(lookUpPath + "/index.json"));

  lookUp = lookUp.sort((a: { sequence: number }, b: { sequence: number }) => a.sequence > b.sequence);

  console.log(lookUp);

  book.set("magic", new Uint8Array([7, 5, 6, 8]));
  book.set("title", new TextEncoder().encode(name));

  lookUp.forEach((x: { name: string }) => {
    book.add("chapterTitles", new TextEncoder().encode(x.name));
  });

  let Contents: string[] = await Promise.all(
    lookUp.map((x: { sequence: any }) => x.sequence).map((x: string): Promise<string> => Deno.readTextFile(lookUpPath + "/" + x))
  );
  Contents.forEach((x: string) => {
    book.add("chapterContents", new TextEncoder().encode(xmlparser(x)));
  });

  // don't forget to sanitize the file name
  await Deno.writeFile("./binary", book.encode());
  // await Deno.writeFile("./" + name, book.encode());
}

export default {
  exportBook,
};
