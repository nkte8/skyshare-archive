import type { APIContext, APIRoute } from "astro";

export const GET: APIRoute = async ({ request }: APIContext): Promise<Response> => {
    const text = await fetch("https://dump-headers.herokuapp.com"
    ).then((res) => res.text());
    return new Response(text, {
        status: 200,
        headers: { "Content-type": "text/html" }
    })
};

