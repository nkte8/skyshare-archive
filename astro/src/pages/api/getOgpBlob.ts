import type { APIContext, APIRoute } from "astro";
import validateRequestReturnURL from "@/lib/validateRequest"
import createErrResponse from "@/lib/createErrResponse";
import { siteurl } from "@/utils/envs";
// SSRを有効化
export const prerender = false;

export const GET: APIRoute = async ({ request }: APIContext) => {

    // CORSの設定
    const corsHeaders = {
        "Access-Control-Allow-Origin": siteurl(),
        "Access-Control-Allow-Methods": "GET,OPTIONS"
    }
    // APIの事前処理実施
    const validateResult = validateRequestReturnURL({ request })

    if (typeof validateResult !== "string") {
        for (const [key, value] of Object.entries(corsHeaders)) {
            validateResult.headers.append(key, value)
        }
        validateResult.headers.append("Content-Type", "application/json")
        return validateResult
    }
    const url = decodeURIComponent(validateResult)
    try {
        const blob = await fetch(url).then((res) => res.blob());
        const res = new Response(blob, {
            status: 200,
            headers: corsHeaders
        });
        res.headers.append("Content-Type", blob.type)
        return res;
    } catch (error: unknown) {
        const result = createErrResponse({
            statusCode: 500
        })
        for (const [key, value] of Object.entries(corsHeaders)) {
            result.headers.append(key, value)
        }
        result.headers.append("Content-Type", "application/json")
        return result
    }
};
