function intToBuf(int: number, size: number) {
  let tmp = [];
  for (let i = 0; i < size; i++) {
    tmp.push(int & 0xff);
    int = int >> 8;
  }
  return Uint8Array.from(tmp.reverse());
}
function bufToInt(buf: Uint8Array) {
  let int = 0;
  for (let i = 0; i < buf.length; i++) {
    int = int << 8;
    int += buf[i];
  }
  return int;
}
function concatBuf(bufs: Uint8Array[]) {
  // let size = bufs.map((x) => x.length).reduce((a, b) => a + b);
  // let result = new Uint8Array(size);
  // let counter = 0;
  // for (let i = 0; i < bufs.length; i++) {
  //   result.set(bufs[i], counter);
  //   counter += bufs[i].length;
  // }
  // return result;
  const mergedUint8Array = new Uint8Array(bufs.map((typedArray) => [...new Uint8Array(typedArray.buffer)]).flat());
  return mergedUint8Array;
}

export default { intToBuf, bufToInt, concatBuf };
