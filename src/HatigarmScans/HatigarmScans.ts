import {LanguageCode, SourceInfo, TagType} from "paperback-extensions-common";
import {GenkanLegacy} from "../GenkanLegacy";

const HATIGARMSCANS_DOMAIN = "https://hatigarmscanz.net"

export const HatigarmScansInfo: SourceInfo = {
    version: '1.0.0',
    name: 'HatigarmScans',
    description: 'Extension that pulls manga from hatigarmscanz.net',
    author: 'GameFuzzy',
    authorWebsite: 'http://github.com/gamefuzzy',
    icon: "icon.png",
    hentaiSource: false,
    websiteBaseURL: HATIGARMSCANS_DOMAIN,
    sourceTags: [
        {
            text: "Notifications",
            type: TagType.GREEN
        }
    ]
}

export class HatigarmScans extends GenkanLegacy {
    baseUrl: string = HATIGARMSCANS_DOMAIN
    languageCode: LanguageCode = LanguageCode.ENGLISH
}