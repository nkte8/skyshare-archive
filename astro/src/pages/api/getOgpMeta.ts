import type { APIContext, APIRoute } from "astro";
import type { ogpMetaData, errorResponse } from "@/lib/types";
import { corsAllowOrigin } from "@/utils/envs";
import validateRequestReturnURL from "@/lib/validateRequest"
// SSRを有効化
export const prerender = false;

// Cloudflare環境 ≠ Nodejsであるため、jsdomやhappy-domが使えなかった
// 正規表現芸人をせざるをえない...
const extractHead = (html: string): ogpMetaData => {
    let metas: Array<string> = []

    const titleFilter: Array<RegExp> = [
        /(?: *< *meta +name=["']?twitter:title["']? +content=)["']?([^"']*)["']?/,
        /(?: *< *meta +property=["']?og:title["']? +content=)["']?([^"']*)["']?/,
    ]
    const descriptionFilter: Array<RegExp> = [
        /(?: *< *meta +name=["']?twitter:description["']? +content=)["']?([^"']*)["']?/,
        /(?: *< *meta +property=["']?og:description["']? +content=)["']?([^"']*)["']?/,
    ]
    const imageFilter: Array<RegExp> = [
        /(?: *< *meta +name=["']?twitter:image["']? +content=)["']?([^"']*)["']?/,
        /(?: *< *meta +property=["']?og:image["']? +content=)["']?([^"']*)["']?/
    ]
    // やるとしたらこの部分の効率化がしたい
    // ただし、twitter:XXX系→og:XXX系の順序性は崩したくない
    for (let filters of [titleFilter, descriptionFilter, imageFilter]) {
        let result: string = ""
        for (let filter of filters) {
            const regResult = filter.exec(html)
            if (regResult !== null) {
                result = regResult[1]
                break
            }
        }
        metas.push(result)
    }
    return {
        type: "meta",
        title: metas[0],
        description: metas[1],
        image: metas[2]
    }
};

export const GET: APIRoute = async ({ request }: APIContext): Promise<Response> => {
    // 返却するするヘッダ
    const headers = {
        "Access-Control-Allow-Origin": corsAllowOrigin,
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Content-Type": "application/json"
    }
    // APIの事前処理実施
    const validateResult = validateRequestReturnURL({ request })

    if (typeof validateResult !== "string") {
        for (const [key, value] of Object.entries(headers)) {
            validateResult.headers.append(key, value)
        }
        return validateResult
    }
    const url: string = decodeURIComponent(validateResult)

    try {
        const html = await fetch(url
        ).then((res) => res.text()).catch((res: Error) => {
            let e: Error = new Error(res.message)
            e.name = res.name
            throw e
        })
        const meta: ogpMetaData = extractHead(html);
        const response = new Response(
            JSON.stringify(meta),
            {
                status: 200,
                headers: headers
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
            headers: headers
        })
    }
};

