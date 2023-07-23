import { LongUrlUrn, ShortUrlUrn } from "./urns";

export class ShortLinkAlreadyExists extends Error {
    link: string

    constructor(urn: LongUrlUrn, link: string) {
        super(`Short link for "${urn}" already exists`);
        this.link = link
    }
}
export class LongUrlNotFoundError extends Error {
    constructor(urn: LongUrlUrn) {
        super(`"${urn}" not found`);
    }
}
export class ShortUrlNotFoundError extends Error {
    constructor(urn: ShortUrlUrn) {
        super(`"${urn}" not found`);
    }
}