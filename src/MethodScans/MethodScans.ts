import {LanguageCode, SourceInfo, TagType} from "paperback-extensions-common";
import {Genkan} from '../Genkan'

const METHODSCANS_DOMAIN = "https://methodscans.com"

export const MethodScansInfo: SourceInfo = {
    version: '1.0.0',
    name: 'MethodScans',
    description: 'Extension that pulls manga from methodscans.com',
    author: 'GameFuzzy',
    authorWebsite: 'http://github.com/gamefuzzy',
    icon: "icon.png",
    hentaiSource: false,
    websiteBaseURL: METHODSCANS_DOMAIN,
    sourceTags: [
        {
            text: "Notifications",
            type: TagType.GREEN
        }
    ]
}

export class MethodScans extends Genkan {
    baseUrl: string = METHODSCANS_DOMAIN
    languageCode: LanguageCode = LanguageCode.ENGLISH
}