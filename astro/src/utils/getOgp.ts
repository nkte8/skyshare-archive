import type { ogpMataData, errorResponse } from "@/lib/types";

// note: エラー規格を型定義として決めた方がいい（ error@Component: message　とするなど）
export const getOgpMeta = async (
    siteurl: string,
    externalUrl: string
): Promise<ogpMataData | errorResponse> => {
    const apiUrl = new URL("/api/getOgpMeta", siteurl)
    apiUrl.searchParams.append("url", encodeURIComponent(externalUrl))
    return fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(async (response) => {
        if (!response?.ok) {
            let res: errorResponse = await response.json()
            let e: Error = new Error(res.message)
            e.name = res.error
            throw e
        }
        return await response.json()
    }).catch((e: Error) => {
        return {
            type: "error",
            error: `${e.name}@getOgpMeta`,
            message: e.message
        }
    })
}
// Blob型はユニオン型として扱うことが難しいため、エラーハンドリングできない
export const getOgpBlob = async (
    siteurl: string,
    externalUrl: string
): Promise<Blob> => {
    const apiUrl = new URL("/api/getOgpBlob", siteurl)
    apiUrl.searchParams.append("url", encodeURIComponent(externalUrl))
    return fetch(apiUrl, {
        method: 'GET'
    }).then(async (response) => {
        if (!response?.ok) {
            let res: errorResponse = await response.json()
            let e: Error = new Error(res.message)
            e.name = `${res.error}@getOgpMeta`
            throw e
        }
        return await response.blob()
    })
}
