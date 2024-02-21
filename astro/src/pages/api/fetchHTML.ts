import type { APIContext, APIRoute } from "astro";

export const GET: APIRoute = async (req: APIContext) => {
    const url = req.url.searchParams.get("url");
    if (!url) {
        return new Response("Missing URL parameter", { status: 400 });
    }
    try {
        const html = await fetch(url).then((res) => res.text());

        const res = new Response(html);
        return res;
    } catch (error) {
        return new Response("Error fetching HTML", { status: 500 });
    }
};
