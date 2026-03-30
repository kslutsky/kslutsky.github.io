import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

// Extend sanitize schema to allow KaTeX output
const katexSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "math",
    "annotation",
    "semantics",
    "mrow",
    "mi",
    "mo",
    "mn",
    "msup",
    "msub",
    "mfrac",
    "mspace",
    "mtext",
    "menclose",
    "mover",
    "munder",
    "munderover",
    "msqrt",
    "mroot",
    "mtable",
    "mtr",
    "mtd",
  ],
  attributes: {
    ...defaultSchema.attributes,
    "*": [
      ...(defaultSchema.attributes?.["*"] ?? []),
      "className",
      "aria-hidden",
      // "style" intentionally omitted from wildcard — only KaTeX <span> elements
      // use inline styles; granting style to all elements would be a CSS injection surface.
    ],
    math: ["xmlns", "display"],
    annotation: ["encoding"],
    span: [
      ...(defaultSchema.attributes?.["span"] ?? []),
      "className",
      "style",
      "aria-hidden",
    ],
  },
};

export async function renderMath(text: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(rehypeSanitize, katexSchema)
    .use(rehypeStringify)
    .process(text);
  return String(result);
}
