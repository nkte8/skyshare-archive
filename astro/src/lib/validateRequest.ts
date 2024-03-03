import createErrResponse from "./createErrResponse";

const validateRequestReturnURL = ({
    request
}: {
    request: Request
}): string | Response => {
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            // headers: corsHeaders
        })
    }
    // GET以外はerror型で返却する
    if (request.method !== "GET") {
        return createErrResponse({
            statusCode: 405
        })
    }
    const url = new URL(request.url).searchParams.get("url");
    if (url === null) {
        return createErrResponse({
            statusCode: 406
        })
    }
    // SSRF対策
    // if (url.toLowerCase().search(/localhost/) > 0) {
    //     return createErrResponse({
    //         statusCode: 502
    //     })
    // }
    return url
}
export default validateRequestReturnURL
