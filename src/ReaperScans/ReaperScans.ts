import {LanguageCode, SourceInfo, TagType} from "paperback-extensions-common";
import {GenkanLegacy} from "../GenkanLegacy";

const REAPERSCANS_DOMAIN = "https://reaperscans.com"

export const ReaperScansInfo: SourceInfo = {
    version: '1.0.0',
    name: 'ReaperScans',
    description: 'Extension that pulls manga from reaperscans.com',
    author: 'GameFuzzy',
    authorWebsite: 'http://github.com/gamefuzzy',
    icon: "icon.png",
    hentaiSource: false,
    websiteBaseURL: REAPERSCANS_DOMAIN,
    sourceTags: [
        {
            text: "Notifications",
            type: TagType.GREEN
        }
    ]
}

export class ReaperScans extends GenkanLegacy {
    baseUrl: string = REAPERSCANS_DOMAIN
    languageCode: LanguageCode = LanguageCode.ENGLISH
}