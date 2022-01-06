// import common from "../utils/common.ts";
import { assertEquals } from "https://deno.land/std@0.119.0/testing/asserts.ts";
import chunk from "../utils/chunk.ts";
import pointer from "../utils/pointer.ts";
// import file from "../utils/file.ts";

const chunkDefinition = [
  { name: "magic", type: "prefix", limit: 4 },
  { name: "integrity", type: "prefix", limit: 8 },
  { name: "title", type: "binary", limit: 4 },
  { name: "content", type: "extend", limit: 16 },
];

let article1: chunk;

Deno.test("create and read article", async () => {
  let article1 = new chunk(chunkDefinition);
  article1.set("magic", new Uint8Array([4, 5, 6, 8]));
  article1.set("integrity", new Uint8Array([97, 251, 3, 48, 7, 4, 3, 57]));
  article1.set("title", new TextEncoder().encode("test title"));
  article1.add("content", new TextEncoder().encode("test content1"));
  article1.add("content", new TextEncoder().encode("test content2"));
  article1.add("content", new TextEncoder().encode("test content3"));
  await Deno.writeFile("./test/.temp/book", article1.encode());

  let article2 = new chunk(chunkDefinition);
  let p = new pointer("./test/.temp/book");
  await p.init();
  await article2.decode(p);

  let magic = await article2.get("magic").get();
  let integrity = await article2.get("integrity").get();
  let title = new TextDecoder().decode(await article2.get("title").get());
  let contentsTmp = await Promise.all(
    article2.gets("content").map((x) => {
      return x.get();
    })
  );
  let contents = contentsTmp.map((x) => new TextDecoder().decode(x));

  assertEquals(magic, new Uint8Array([4, 5, 6, 8]), "magic code (prefix)");
  assertEquals(integrity, new Uint8Array([97, 251, 3, 48, 7, 4, 3, 57]), "integrity checksum (prefix)");
  assertEquals(title, "test title", "title (binary)");
  assertEquals(contents, ["test content1", "test content2", "test content3"], "content (extend)");
});
