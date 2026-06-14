import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
    const posts = (await getCollection("blog"))
        .filter((p) => p.data.published)
        .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
    return rss({
        title: "Felix Krückel",
        description: import.meta.env.PUBLIC_DESCRIPTION,
        site: context.site,
        items: posts.map((p) => ({
            title: p.data.title,
            pubDate: p.data.pubDate,
            description: p.data.description,
            link: `/blog/${p.slug}/`,
        })),
    });
}
