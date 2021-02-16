import {LanguageCode, SourceInfo, TagType} from "paperback-extensions-common";
import {Genkan} from '../Genkan'

const ZEROSCANS_DOMAIN = "https://zeroscans.com"

export const ZeroScansInfo: SourceInfo = {
    version: '1.0.0',
    name: 'ZeroScans',
    description: 'Extension that pulls manga from zeroscans.com',
    author: 'GameFuzzy',
    authorWebsite: 'http://github.com/gamefuzzy',
    icon: "icon.png",
    hentaiSource: false,
    websiteBaseURL: ZEROSCANS_DOMAIN,
    sourceTags: [
        {
            text: "Notifications",
            type: TagType.GREEN
        }
    ]
}

export class ZeroScans extends Genkan {
    baseUrl: string = ZEROSCANS_DOMAIN
    languageCode: LanguageCode = LanguageCode.ENGLISH
}