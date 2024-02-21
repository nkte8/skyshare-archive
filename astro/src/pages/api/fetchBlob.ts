import type { APIContext, APIRoute } from "astro";

export const GET: APIRoute = async (req: APIContext) => {
  const url = req.url.searchParams.get("url");
  if (!url) {
    return new Response("Missing URL parameter", { status: 400 });
  }
  try {
    const blob = await fetch(url).then((res) => res.blob());
    const res = new Response(blob);
    return res;
  } catch (error) {
    return new Response("Error fetching Blob", { status: 500 });
  }
};
