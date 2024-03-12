import type { APIContext, APIRoute } from "astro";
import type { ogpMetaData, errorResponse } from "@/lib/types";
import { corsAllowOrigin } from "@/utils/envs";
import validateRequestReturnURL from "@/lib/validateRequest"
// SSRを有効化
export const prerender = false;

const findEncoding = async (htmlBlob: Blob): Promise<string> => {
    const text = await htmlBlob.text()
    const headerRegExp: Array<RegExp> = [
        /(?: *< *meta +charset=["']?)([^"']*)["']?/i,
        /(?: *< *meta +http-equiv=["']?content-type["']? +content=["']?[^"']*charset=)([^"']*)["']?/i,
    ]
    let charset: string | undefined
    for (let filter of headerRegExp) {
        if (charset === undefined) {
            const regResult = filter.exec(text)
            if (regResult !== null) {
                charset = regResult[1]
            }
        }
    }
    charset = (typeof charset !== "undefined") ? charset.toLowerCase() : "utf-8" // default
    return charset
}

/**
 * fetchしたHTMLのエスケープを解除
 * エスケープ文字はたくさんあるが、一旦Skyshareページで使用しているURLで対応が必要なものだけ処理実施
 *
 * @param {string} html 解除処理を行うHTML文字列
 */
const unescapeHtml = (html: string): string => {
    return html
        .replace("&amp;", "&")
        .replace("&#38;", "&")
};

export const GET: APIRoute = async ({ request }: APIContext): Promise<Response> => {
    // 返却するするヘッダ
    const headers = {
        "Access-Control-Allow-Origin": corsAllowOrigin,
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Content-Type": "application/json"
    }
    // OPTIONSリクエストは即OK
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: headers
        })
    }
    // APIの事前処理実施
    const validateResult = validateRequestReturnURL({ request })

    // エラーの場合はエラーレスポンスを返却
    if (validateResult.type === "error") {
        return new Response(JSON.stringify(validateResult), {
            status: validateResult.status,
            headers: headers
        })
    }

    // 正常な場合はURLとして扱う
    const url: string = validateResult.decodedUrl
    const decodeAsText = async (arrayBuffer: Blob, encoding: string) => new TextDecoder(encoding).decode(await arrayBuffer.arrayBuffer());
    try {
        const htmlBlob: Blob = await fetch(url, {
            method: 'GET',
            headers: {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": validateResult.language,
                "User-Agent": "node",
                "Cache-Control": "no-cache",
            }
        }
        ).then((res) => res.blob()).catch((res: Error) => {
            let e: Error = new Error(res.message)
            e.name = res.name
            throw e
        })
        const encoding: string = await findEncoding(htmlBlob)
        const html: string = unescapeHtml(
            await decodeAsText(htmlBlob, encoding)
        )
        const response = new Response(
            JSON.stringify(html),
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
            message: msg,
            status: 500,
        }), {
            status: 500,
            headers: headers
        })
    }
};

