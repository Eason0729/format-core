import { DOMParser, Element } from "../deps.ts";
const tagsNL = ["div", "h1", "h2", "h3", "h4", "h5", "h6"];
function parser(str: string) {
  for (const tagName of tagsNL) {
    str = str.replaceAll(`<${tagName}>`, `<${tagName}>\n`);
  }
  let xml = new DOMParser().parseFromString(str, "text/html");
  return xml?.textContent || "";
}
export default parser;
