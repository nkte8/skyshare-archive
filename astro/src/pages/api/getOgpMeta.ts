import type { APIContext, APIRoute } from "astro";
import type { ogpMataData, errorResponse } from "./types";
import validateRequestReturnURL from "./validateRequest"
import { siteurl } from "@/utils/envs";
import { JSDOM } from "jsdom"

const extractHead = (html: string): ogpMataData | errorResponse => {
    // セキュリティを考えるならいっそDOMParserで解析済みのresposeを返した方がいい気がする。
    try {
        const dom = new JSDOM(html);
        let ogp: ogpMataData = { title: "", image: "", description: "", type: "meta" }

        // 情報取得方法に優先度が存在するため、順に処理を行う
        const header = dom.window.document.head.children
        ogp = Array.from(header).reduce<ogpMataData>(
            (res, elem) => {
                const name = elem.getAttribute("name");
                if (ogp.title === "" && name === "twitter:title") {
                    res.title = elem.getAttribute("content") ?? "";
                }
                if (ogp.image === "" && name === "twitter:image") {
                    res.image = elem.getAttribute("content") ?? "";
                }
                if (ogp.description === "" && name === "twitter:description") {
                    res.description = elem.getAttribute("content") ?? "";
                }
                return res;
            },
            { title: ogp.title, image: ogp.image, description: ogp.description, type: "meta" }
        );
        // twitterカードの情報が欠けていた場合はog情報を参照する
        if (ogp.title === "" || ogp.description === "" || ogp.image === null) {
            ogp = Array.from(header).reduce<ogpMataData>(
                (res, elem) => {
                    const prop = elem.getAttribute("property");
                    if (ogp.title === "" && prop === "og:title") {
                        res.title = elem.getAttribute("content") ?? "";
                    }
                    if (ogp.image === "" && prop === "og:image") {
                        res.image = elem.getAttribute("content") ?? "";
                    }
                    if (ogp.description === "" && prop === "og:description") {
                        res.description = elem.getAttribute("content") ?? "";
                    }
                    return res;
                },
                { title: ogp.title, image: ogp.image, description: ogp.description, type: "meta" }
            );
        }
        return ogp
    } catch (e: unknown) {
        let [name, msg]: string = "Unexpected Error"
        if (e instanceof Error) {
            name = e.name
            msg = e.message
        }
        return {
            type: "error",
            error: name,
            message: msg
        }
    }
};

export const GET: APIRoute = async (req: APIContext): Promise<Response> => {
    // CORSの設定（同一 Originなら不要）
    const corsHeaders = {
        "Access-Control-Allow-Origin": siteurl(),
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    }
    // APIの事前処理実施
    const validateResult = validateRequestReturnURL({ req })
    if (typeof validateResult !== "string") {
        for (const [key, value] of Object.entries(corsHeaders)) {
            validateResult.headers.append(key, value)
        }
        return validateResult
    }
    const url = validateResult

    try {
        const html = await fetch(
            decodeURIComponent(url)
        ).then((res) => res.text()).catch((res: Error) => {
            let e: Error = new Error(res.message)
            e.name = res.name
            throw e
        })
        const meta: ogpMataData | errorResponse = extractHead(html);
        if (meta.type === "error") {
            let e: Error = new Error(meta.message)
            e.name = meta.error
            throw e
        }
        const response = new Response(
            JSON.stringify(meta),
            {
                status: 200,
                // headers: corsHeaders
            })
        return response
    } catch (error: unknown) {
        let [name, msg]: string = "Unexpected Error"
        if (error instanceof Error) {
            name = error.name
            msg = error.message
        }
        return new Response(JSON.stringify(<errorResponse>{
            type: "error",
            error: name,
            message: msg
        }), {
            status: 500,
            headers: corsHeaders
        })
    }
};

