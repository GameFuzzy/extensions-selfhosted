import {LanguageCode, SourceInfo, TagType} from "paperback-extensions-common";
import {Genkan} from '../Genkan'

const EDELGARDESCANS_DOMAIN = "https://edelgardescans.com"

export const EdelgardeScansInfo: SourceInfo = {
    version: '1.0.0',
    name: 'EdelgardeScans',
    description: 'Extension that pulls manga from edelgardescans.com',
    author: 'GameFuzzy',
    authorWebsite: 'http://github.com/gamefuzzy',
    icon: "icon.png",
    hentaiSource: false,
    websiteBaseURL: EDELGARDESCANS_DOMAIN,
    sourceTags: [
        {
            text: "Notifications",
            type: TagType.GREEN
        }
    ]
}

export class EdelgardeScans extends Genkan {
    baseUrl: string = EDELGARDESCANS_DOMAIN
    languageCode: LanguageCode = LanguageCode.ENGLISH
}