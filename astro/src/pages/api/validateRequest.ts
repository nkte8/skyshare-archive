import { APIContext } from "astro"
import createErrResponse from "./createErrResponse";

const validateRequestReturnURL = ({
    req
}: {
    req: APIContext
}) => {
    if (req.request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            // headers: corsHeaders
        })
    }
    // GET以外はerror型で返却する
    if (req.request.method !== "GET") {
        return createErrResponse({
            statusCode: 405
        })
    }
    const url = req.url.searchParams.get("url");
    if (!url) {
        return createErrResponse({
            statusCode: 406
        })
    }
    // SSRF対策
    if (url.toLowerCase().search(/(http|https):\/\/localhost/) > 0) {
        return createErrResponse({
            statusCode: 502
        })
    }
    return url
}
export default validateRequestReturnURL
