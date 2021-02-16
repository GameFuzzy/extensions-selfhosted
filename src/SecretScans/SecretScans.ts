import {LanguageCode, SourceInfo, TagType} from "paperback-extensions-common";
import {GenkanLegacy} from "../GenkanLegacy";

const SECRETSCANS_DOMAIN = "https://secretscans.co"

export const SecretScansInfo: SourceInfo = {
    version: '1.0.0',
    name: 'SecretScans',
    description: 'Extension that pulls manga from secretscans.co',
    author: 'GameFuzzy',
    authorWebsite: 'http://github.com/gamefuzzy',
    icon: "icon.png",
    hentaiSource: false,
    websiteBaseURL: SECRETSCANS_DOMAIN,
    sourceTags: [
        {
            text: "Notifications",
            type: TagType.GREEN
        }
    ]
}

export class SecretScans extends GenkanLegacy {
    baseUrl: string = SECRETSCANS_DOMAIN
    languageCode: LanguageCode = LanguageCode.ENGLISH
}