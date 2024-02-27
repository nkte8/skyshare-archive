import detectFacets from "./atproto_api/detectFacets";
import facet from "./atproto_api/facets"
import embed from "./atproto_api/embeds"

import uploadBlob from "./atproto_api/uploadBlob";
import model_uploadBlob from "./atproto_api/models/uploadBlob.json";
import model_error from "./atproto_api/models/error.json";
import type { ogpMataData, errorResponse } from "@/lib/types";
import { getOgpMeta, getOgpBlob } from "./getOgp"
import { siteurl } from "./envs";

export type SessionNecessary = {
    did: string,
    accessJwt: string,
}
// 最低限必要なレコード
type RecordBase = {
    text: string,
    createdAt: Date,
    $type: "app.bsky.feed.post",
    langs: Array<string>
}
// 付与できる情報を定義
type RecordCore = {
    facets?: Array<facet.link | facet.mention>
    embed?: embed.images | embed.external
} & RecordBase

export const buildRecordBase = async (props: RecordBase): Promise<RecordCore> => {
    let recordResult: RecordCore = props
    const facets = await detectFacets({ text: props.text })
    if (facets.length > 0) {
        recordResult = {
            ...props,
            facets: facets
        }
    }
    return recordResult
}

export const attachExternalToRecord = async ({
    base,
    session,
    externalUrl,
    handleProcessing
}: {
    base: RecordBase,
    session: SessionNecessary,
    externalUrl: URL,
    handleProcessing: ({
        msg, isError
    }: {
        msg: string, isError: boolean
    }) => void
}): Promise<RecordCore> => {
    let recordResult: RecordCore = base
    let ogpMeta: ogpMataData | errorResponse = {
        title: "",
        description: "",
        image: "",
        type: "meta"
    }
    let blob: Blob | null = null
    try {
        handleProcessing({
            msg: `${externalUrl.hostname}からOGPの取得中...`,
            isError: false
        })
        ogpMeta = await getOgpMeta(siteurl(), externalUrl.toString())
        if (ogpMeta.type === "error") {
            let e: Error = new Error(ogpMeta.message)
            e.name = ogpMeta.error
            throw e
        }
        if (ogpMeta.image !== "") {
            blob = await getOgpBlob(siteurl(), ogpMeta.image)
        }
        let embed: embed.external = {
            $type: "app.bsky.embed.external",
            external: {
                uri: externalUrl.toString(),
                title: ogpMeta.title,
                description: ogpMeta.description,
            }
        }
        if (blob !== null) {
            // リンク先のOGPからblobを作成し、mimeTypeの設定&バイナリのアップロードを実施
            handleProcessing({
                msg: `画像のアップロード中...`,
                isError: false
            })
            const resultUploadBlobs = await uploadBlob({
                accessJwt: session.accessJwt,
                mimeType: blob.type,
                blob: new Uint8Array(await blob.arrayBuffer())
            })
            // 例外処理
            if (typeof resultUploadBlobs?.error !== "undefined") {
                let e: Error = new Error(resultUploadBlobs.message)
                e.name = resultUploadBlobs.error
                throw e
            }
            // embedを追加
            embed.external.thumb = resultUploadBlobs.blob
        }
        recordResult = {
            ...base,
            embed
        }
    } catch (error: unknown) {
        let msg: string = "Unexpected Unknown Error"
        if (error instanceof Error) {
            msg = error.name + ": " + error.message
        }
        handleProcessing({
            msg: msg,
            isError: true
        })
        blob = null
    }
    return recordResult
}

export const attachImageToRecord = async ({
    base,
    session,
    imageFiles,
    handleProcessing,
    altTexts,
}: {
    base: RecordBase,
    session: SessionNecessary,
    imageFiles: Array<File>,
    handleProcessing: ({
        msg, isError
    }: {
        msg: string, isError: boolean
    }) => void
    altTexts: Array<string>
}): Promise<RecordCore> => {
    let recordResult: RecordCore = base
    let queUploadBlob: Array<Promise<typeof model_uploadBlob & typeof model_error>> = []
    for (let file of imageFiles) {
        queUploadBlob.push(uploadBlob({
            accessJwt: session!.accessJwt,
            mimeType: file.type,
            blob: new Uint8Array(await file.arrayBuffer())
        }))
    }
    handleProcessing({
        msg: `画像のアップロード中...`,
        isError: false
    })
    // 戻り配列の順序を固定
    const resultUploadBlobs =
        await Promise.all(queUploadBlob).then(
            (values) => {
                return values
            })

    // 画像アップロードに失敗したファイルが一つでも存在した場合停止する
    resultUploadBlobs.forEach((value) => {
        if (typeof value?.error !== "undefined") {
            let e: Error = new Error(value.message)
            e.name = value.error
            throw e
        }
    })

    // embedを追加
    let embed: embed.images = {
        $type: "app.bsky.embed.images",
        images: []
    }
    resultUploadBlobs.forEach((value, index) => {
        embed.images.push({
            image: value.blob,
            alt: altTexts[index],
        })
    })
    recordResult = {
        ...base,
        embed
    }
    return recordResult
}