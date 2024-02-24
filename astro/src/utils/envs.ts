export const baseurl = import.meta.env.BASE_URL
export const siteurl = () => {
    const env = String(import.meta.env.PUBLIC_STAGING_SITE_URL)
    if (typeof env !== "undefined" && env !== "") {
        return env
    }
    return import.meta.env.SITE
}
export const posturl = baseurl + "app/"
export const abouturl = baseurl + "about/"
export const qaurl = baseurl + "qa/"
export const changeurl = baseurl + "changelog/"
export const policyurl = baseurl + "privacypolicy/"
export const featureurl = baseurl + "feature/"
