import {LanguageCode, SourceInfo, TagType} from "paperback-extensions-common";
import {Genkan} from '../Genkan'

const THENONAMESSCANS_DOMAIN = "https://the-nonames.com"

export const TheNonamesScansInfo: SourceInfo = {
    version: '1.0.0',
    name: 'TheNonamesScans',
    description: 'Extension that pulls manga from the-nonames.com',
    author: 'GameFuzzy',
    authorWebsite: 'http://github.com/gamefuzzy',
    icon: "icon.png",
    hentaiSource: false,
    websiteBaseURL: THENONAMESSCANS_DOMAIN,
    sourceTags: [
        {
            text: "Notifications",
            type: TagType.GREEN
        }
    ]
}

export class TheNonamesScans extends Genkan {
    baseUrl: string = THENONAMESSCANS_DOMAIN
    languageCode: LanguageCode = LanguageCode.ENGLISH
}