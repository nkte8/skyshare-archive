import type { APIContext, APIRoute } from "astro";
import type { ogpMataData, errorResponse } from "@/lib/types";
import { corsAllowOrigin } from "@/utils/envs";
import validateRequestReturnURL from "@/lib/validateRequest";
import { JSDOM } from "jsdom";

// SSRを有効化
export const prerender = false;

/**
 * URLからOGP関連メタデータを抽出する
 * @param url string
 * @returns OGP関連メタデータ
 */
const extractHead = async (url: string): Promise<ogpMataData> => {
    const dom: JSDOM = await JSDOM.fromURL(decodeURIComponent(url))
        .then((res: JSDOM): JSDOM => res)
        .catch((res: Error) => {
            let e: Error = new Error(res.message);
            e.name = res.name;
            throw e;
        });

    const { document } = dom.window;

    let title: string =
        document
            .querySelector("meta[name='twitter:title']")
            ?.getAttribute("content") ?? "";
    if (title === "") {
        title =
            document
                .querySelector("meta[property='og:title']")
                ?.getAttribute("content") ?? "";
    }

    let description: string =
        document
            .querySelector("meta[name='twitter:description']")
            ?.getAttribute("content") ?? "";

    if (description === "") {
        description =
            document
                .querySelector("meta[property='og:description']")
                ?.getAttribute("content") ?? "";
    }

    let image: string =
        document
            .querySelector("meta[name='twitter:image']")
            ?.getAttribute("content") ?? "";
    if (image === "") {
        image =
            document
                .querySelector("meta[property='og:image']")
                ?.getAttribute("content") ?? "";
    }
    return {
        type: "meta",
        title: title,
        description: description,
        image: image
    }
};

export const GET: APIRoute = async ({ request }: APIContext): Promise<Response> => {
    // 返却するするヘッダ
    const Headers = {
        "Access-Control-Allow-Origin": corsAllowOrigin,
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Content-Type": "application/json"
    }
    // APIの事前処理実施
    const validateResult = validateRequestReturnURL({ request })

    if (typeof validateResult !== "string") {
        for (const [key, value] of Object.entries(Headers)) {
            validateResult.headers.append(key, value)
        }
        validateResult.headers.append("Content-Type", "application/json")
        return validateResult
    }
    const url = decodeURIComponent(validateResult)

    try {
        const meta: ogpMataData = await extractHead(url);
        const response = new Response(
            JSON.stringify(meta),
            {
                status: 200,
                headers: Headers
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
            headers: Headers
        })
    }
};

