import type { APIContext, APIRoute } from "astro";
import validateRequestReturnURL from "./validateRequest"
import createErrResponse from "./createErrResponse";
import { siteurl } from "@/utils/envs";

export const GET: APIRoute = async (req: APIContext) => {

    // CORSの設定
    const corsHeaders = {
        "Access-Control-Allow-Origin": siteurl(),
        "Access-Control-Allow-Methods": "GET,OPTIONS"
    }
    // APIの事前処理実施
    const validateResult = validateRequestReturnURL({ req })

    if (typeof validateResult !== "string") {
        for (const [key, value] of Object.entries(corsHeaders)) {
            validateResult.headers.append(key, value)
        }
        return validateResult
    }
    const url = decodeURIComponent(validateResult)
    try {
        const blob = await fetch(url).then((res) => res.blob());
        const res = new Response(blob, {
            status: 200,
            headers: corsHeaders
        });
        return res;
    } catch (error: unknown) {
        const result = createErrResponse({
            statusCode: 500
        })
        for (const [key, value] of Object.entries(corsHeaders)) {
            result.headers.append(key, value)
        }
        return result
    }
};
