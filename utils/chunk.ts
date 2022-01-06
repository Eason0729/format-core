import bufferUtil from "../utils/buffer.ts";
import pointer from "../utils/pointer.ts";

type dataType = "binary" | "extend" | "prefix";
type dataTypeType = Uint8Array | Uint8Array[];

interface field {
  name: string;
  type: dataType;
  limit: number;
}

let defField = [
  { name: "magic", type: "prefix", limit: 4 },
  { name: "title", type: "binary", limit: 4 },
  { name: "content", type: "extend", limit: 16 },
];

class chunk {
  def: field[];
  inputVal: (Uint8Array | Uint8Array[])[] = [];
  outputVal: (pointer | pointer[])[] = [];
  constructor(def = defField) {
    this.def = def.filter((x) => x.type == "prefix").concat(def.filter((x) => x.type != "prefix")) as field[];
  }
  set(fieldName: string, value: Uint8Array) {
    let index = this.def.findIndex((x) => x.name === fieldName);
    if (this.def[index].type == "prefix" && value.length != this.def[index].limit) throw new Error("length not match");
    this.inputVal[index] = value;
  }
  add(fieldName: string, value: Uint8Array) {
    let index = this.def.findIndex((x) => x.name === fieldName);
    if (this.inputVal[index]) (this.inputVal[index] as Uint8Array[]).push(value);
    else this.inputVal[index] = [value];
  }
  get(fieldName: string) {
    let index = this.def.findIndex((x) => x.name === fieldName);
    return this.outputVal[index] as pointer;
  }
  gets(fieldName: string) {
    let index = this.def.findIndex((x) => x.name === fieldName);
    return this.outputVal[index] as pointer[];
  }
  async decode(filePointer: pointer) {
    //chunk -> subChunk -> finChunk
    let flagTable = 0;
    let flagBody = 0;
    let tableLen = this.def.map((x) => x.limit).reduce((a, b) => a + b);
    let tableChunks = filePointer.slice(0, tableLen);
    let bodyChunks = filePointer.slice(tableLen);

    for (let i = 0; i < this.def.length; i++) {
      //subChunk is in table...
      let tableChunk = tableChunks.slice(flagTable, flagTable + this.def[i].limit);
      flagTable += this.def[i].limit;
      if (this.def[i].type == "prefix") {
        this.outputVal.push(tableChunk);
      } else {
        //finChunk is a part of file body
        // get finChunk by infomation of subChunk
        let smallChunkLen = bufferUtil.bufToInt(await tableChunk.get());
        let smallChunk = bodyChunks.slice(flagBody, flagBody + smallChunkLen);
        flagBody += smallChunkLen;
        if (this.def[i].type == "binary") this.outputVal.push(smallChunk);
        else {
          let chunksAmount = bufferUtil.bufToInt(await smallChunk.slice(0, 16).get());
          let listChunks = smallChunk.slice(16);
          let contentPointer = smallChunk.slice(16 + chunksAmount * 16);
          let flagContent = 0;
          let resultChunks: pointer[] = [];
          for (let j = 0; j < chunksAmount; j++) {
            let pos = bufferUtil.bufToInt(await listChunks.slice(j * 16, j * 16 + 16).get());
            resultChunks.push(contentPointer.slice(flagContent, flagContent + pos));
            flagContent += pos;
          }
          this.outputVal.push(resultChunks);
        }
      }
    }
  }
  encode() {
    let prefixBuffers: Uint8Array[] = [];
    let limitBuffers: Uint8Array[] = [];
    let contentBuffers: Uint8Array[] = [];
    function encodeByType(val: any, type: dataType, limit: number) {
      switch (type) {
        case "prefix":
          prefixBuffers.push(val);
          break;
        case "binary":
          contentBuffers.push(val);
          limitBuffers.push(bufferUtil.intToBuf(val.length, limit));
          break;
        case "extend":
          let tmp: Uint8Array[] = val;
          let listBuffers: Uint8Array[] = [];
          let lContentBuffers: Uint8Array[] = [];
          // chunk definition of extend(type):
          // first 16 byte amount of pointer list
          // each pointer list(row) is 16 byte
          let lens = tmp.map((x) => x.length);
          let base = bufferUtil.intToBuf(lens.length, 16);
          for (let i = 0; i < tmp.length; i++) {
            listBuffers.push(bufferUtil.intToBuf(tmp[i].length, 16));
            lContentBuffers.push(tmp[i]);
          }
          let extendChunk = bufferUtil.concatBuf([base, ...listBuffers, ...lContentBuffers]);
          contentBuffers.push(extendChunk);
          limitBuffers.push(bufferUtil.intToBuf(extendChunk.length, limit));
      }
    }
    for (let i = 0; i < this.def.length; i++) encodeByType(this.inputVal[i], this.def[i].type, this.def[i].limit);
    return bufferUtil.concatBuf([...prefixBuffers, ...limitBuffers, ...contentBuffers]);
  }
}

export default chunk;
