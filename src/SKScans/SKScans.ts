import {LanguageCode, SourceInfo, TagType} from "paperback-extensions-common";
import {Genkan} from '../Genkan'

const SKSCANS_DOMAIN = "https://skscans.com"

export const SKScansInfo: SourceInfo = {
    version: '1.0.0',
    name: 'SKScans',
    description: 'Extension that pulls manga from skscans.com',
    author: 'GameFuzzy',
    authorWebsite: 'http://github.com/gamefuzzy',
    icon: "icon.png",
    hentaiSource: false,
    websiteBaseURL: SKSCANS_DOMAIN,
    sourceTags: [
        {
            text: "Notifications",
            type: TagType.GREEN
        }
    ]
}

export class SKScans extends Genkan {
    baseUrl: string = SKSCANS_DOMAIN
    languageCode: LanguageCode = LanguageCode.ENGLISH
}