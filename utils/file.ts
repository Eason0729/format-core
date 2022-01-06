import chunk from "./chunk.ts";

interface fileChild {
  name: string;
  type: "binary" | "prefix" | fileChild;
}
