// jsdomはNode用だったのでフロントでできない。
// フロントでやりたいのでローレベルで書く
const getOgp = ({
    content
}: {
    content: string
}): string => {
    let ogpUrl: string = ""
    const regexFilters: Array<RegExp> = [
        /(?: *< *meta +name=["']?twitter:image["']? +content=)["']?([^"']*)["']?/,
        /(?: *< *meta +property=["']?og:image["']? +content=)["']?([^"']*)["']?/
    ]
    // &->&amp;(or &#38)にエスケープされている場合、これを置き換え処理
    // (fetchの取得結果をただすなど)もっと根本的に修正できるのであればそうすべき。
    for (let filter of regexFilters) {
        const regResult = filter.exec(content)
        if (regResult !== null) {
            ogpUrl = regResult[1].replace("&#38;", "&")
            break
        }
    }
    return ogpUrl
}
export default getOgp

export const getOgpV2 = async (
    htmlStr: string
): Promise<{
    title: string;
    description: string;
    imageUrl: string;
    blob: Blob;
}> => {
    const dom = new DOMParser().parseFromString(htmlStr, "text/html");
    const ogp = Array.from(dom.head.children).reduce<{
        title: string;
        image: string;
        description: string;
    }>(
        (res, elem) => {
            const prop = elem.getAttribute("property");
            const name = elem.getAttribute("name");
            if (prop === "og:title" || name === "twitter:title") {
                res.title = elem.getAttribute("content") ?? "";
            }
            if (prop === "og:image" || name === "twitter:image") {
                res.image = elem.getAttribute("content") ?? "";
            }
            if (prop === "og:description" || name === "twitter:description") {
                res.description = elem.getAttribute("content") ?? "";
            }
            return res;
        },
        { title: "", image: "", description: "" }
    );
    const title = ogp.title;
    const description = ogp.description;
    const imageUrl = ogp.image;
    const blob = await fetch(`/api/fetchBlob?url=${ogp.image}`).then((res) =>
        res.blob()
    );

    return { title, description, imageUrl, blob };
};
