import {LanguageCode, SourceInfo, TagType} from "paperback-extensions-common";
import {Genkan} from '../Genkan'

const HUNLIGHTSCANS_DOMAIN = "https://hunlight-scans.info"

export const HunlightScansInfo: SourceInfo = {
    version: '1.0.0',
    name: 'HunlightScans',
    description: 'Extension that pulls manga from hunlight-scans.info',
    author: 'GameFuzzy',
    authorWebsite: 'http://github.com/gamefuzzy',
    icon: "icon.png",
    hentaiSource: false,
    websiteBaseURL: HUNLIGHTSCANS_DOMAIN,
    sourceTags: [
        {
            text: "Notifications",
            type: TagType.GREEN
        }
    ]
}

export class HunlightScans extends Genkan {
    baseUrl: string = HUNLIGHTSCANS_DOMAIN
    languageCode: LanguageCode = LanguageCode.ENGLISH
}