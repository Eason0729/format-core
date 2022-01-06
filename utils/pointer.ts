class pointer {
  file: string;
  start: number;
  end?: number;
  // inited: boolean = false;
  constructor(file: string, start = 0, end?: number) {
    this.file = file;
    this.start = start;
    if (end) this.end = end;
  }
  async init() {
    // this.inited = true;
    if (!this.end) {
      const stat = await Deno.stat(this.file);
      this.end = stat.size;
    }
  }
  async get() {
    if (!this.end || this.start < -1) await this.init();
    const file = await Deno.open(this.file);
    const p = this.start; // your position
    await Deno.seek(file.rid, p, Deno.SeekMode.Start);
    const buf = new Uint8Array(this.end! - this.start); // you can read more and then access a particular slice of the buffer
    await file.read(buf);
    file.close();
    // ... do whatever operation you want with buf
    return buf;
  }
  slice(a: number, b?: number): pointer {
    let p: pointer;
    if (b != undefined) p = new pointer(this.file, this.start + a, this.start + b!);
    else p = new pointer(this.file, this.start + a, this.end);
    return p;
  }
}

export default pointer;
