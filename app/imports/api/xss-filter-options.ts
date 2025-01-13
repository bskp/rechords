// TODO: Include this step in Tests for parsedown md / or additional test

export const options: XSS.IFilterXSSOptions = {
  whiteList: {
    a: ["href", "title"],
    span: ["class", "data-timestamp"],
    div: ["class", "id"],
    i: ["class", "data-chord"],
    b: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    section: ["class", "id"],
    ul: ["class"],
    u: [],
    ol: [],
    li: [],
    p: ["class", "id"],
    br: [],
    strong: [],
    em: [],
    code: ["class"],
    s: [],
    pre: [],
    img: ["src", "alt"],
    abbr: ["class", "title", "data-fingers"],
  },
};
