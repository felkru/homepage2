import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex"
import remarkToc from "remark-toc";
import rehypeToc from "rehype-toc";
import rehypeSlug from "rehype-slug";

const hasLink = (node) => node.tagName === "a" || (node.children ?? []).some(hasLink);

export default {
    remarkPlugins: [
        remarkMath,
        [remarkToc, { tight: true, ordered: true }]
    ],
    rehypePlugins: [
        rehypeSlug,
        rehypeKatex,
        [
            rehypeToc,
            {
                headings: ["h1", "h2"],
                cssClasses: {
                    toc: "toc-post",
                    link: "toc-link",
                    idPrefix: '',
                },
                // No headings (short posts): leave the table of contents out instead of an empty box.
                customizeTOC: (toc) => (hasLink(toc) ? toc : false),
            },
        ],
    ]
}