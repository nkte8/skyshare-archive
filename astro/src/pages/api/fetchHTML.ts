import type { APIContext, APIRoute } from "astro";

const extractHead = (html: string): string[] => {
    // TODO 正規表現が悪用される可能性があるため、より良い実装方法があれば置き換える。
    // NOTE 特殊文字'>'を含むmetaタグには対応していない。
    const regex = /<meta\s+[^>]+>/gi;
    const matchIter: IterableIterator<RegExpMatchArray> = html.matchAll(regex);
    return Array.from(matchIter, (match) => match[0]) || [];
};

export const GET: APIRoute = async (req: APIContext): Promise<Response> => {
    const url = req.url.searchParams.get("url");
    if (!url) {
        return new Response("Missing URL parameter", { status: 400 });
    }
    try {
        const html = await fetch(url).then((res) => res.text());

        // 🚧NOTE: APIサーバーの負荷とセキュリティリスクを考慮して、metaタグを正規表現で抽出する単純な処理を追加している。
        // TODO: 軽量なHTML解析ライブラリや、より良い実装方法があれば置き換えた方が良い。
        //       というよりBluesky組み込みのOGP取得APIが公開されていればそちらを使いたい。
        const meta: string[] = extractHead(html);

        const res = new Response(meta.join("\n"));
        return res;
    } catch (error) {
        return new Response("Error fetching HTML", { status: 500 });
    }
};
