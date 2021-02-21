import {Chapter, ChapterDetails, LanguageCode, MangaStatus, MangaTile, TagSection,} from "paperback-extensions-common";
import {reverseLangCode} from "./Languages";

export class Parser {

    parseMangaDetails(json: any, mangaId: string, tags: string[], baseUrl: any): any {
        const tagSections: TagSection[] = [createTagSection({id: '0', label: 'genres', tags: []})]
        let re = /[: ]([^,:]*),/g, group
        let tagArray: string[] = []
        while ((group = re.exec(tags + ',')) !== null) {
            tagArray.push(group[1])
        }
        tagSections[0].tags = tagArray.map((elem: string) => createTag({id: elem, label: elem}))
        return createManga({
            id: mangaId,
            titles: [json.title],
            author: this.getNSTag(tags, 'author')[1],
            artist: this.getNSTag(tags, 'artist')[1],
            tags: tagSections,
            desc: '',
            image: `${baseUrl}/api/archives/${mangaId}/thumbnail`,
            status: MangaStatus.ONGOING,
            rating: this.getNSTag(tags, 'artist')[1]?.split('⭐').length - 1 ?? 0,
            lastUpdate: json.isNew ? new Date(Date.now() - 604800000).toString() : undefined
        })
    }

    parseChapters(json: any, mangaId: string, tags: string[], language: string): Chapter[] {
        let chapters: Chapter[] = []
        for (let manga of json) {
            if (manga.tags.includes(this.getNSTag(tags, 'parody')[1]?.replace(/\d*$/, '').trim())) {
                chapters.push(createChapter({
                    id: manga.arcid,
                    chapNum: Number(manga.title?.match(/\d*$/) ?? 1),
                    name: manga.title,
                    group: this.getNSTag(tags, 'group')[1],
                    langCode: reverseLangCode[this.getNSTag(tags, 'language')[1] ?? language],
                    mangaId: mangaId,
                }))
            }
        }

        return chapters.length != 0 ? chapters : [createChapter({
            id: mangaId,
            chapNum: 1,
            name: 'Archive',
            langCode: LanguageCode.ENGLISH,
            mangaId: mangaId
        })]
    }

    parseChapterDetails(json: any, mangaId: string, chapterId: string, address: any): ChapterDetails {
        return createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: json.pages?.map((x: string) => `${address}${x.replace('.', '')}`),
            longStrip: false
        })
    }

    parseArchiveList(json: any, baseUrl: any): MangaTile[] {
        let collectedTags: string[] = []
        let results = []
        let sortedJson = json.sort((a: any, b: any) => (Number(a.title?.match(/\d*$/) ?? 0) - Number(b.title?.match(/\d*$/) ?? 0)))
        for (let result of sortedJson) {
            let mangaTag = this.getNSTag([result.tags], 'parody')[1]?.replace(/\d*$/, '').trim()
            if (!collectedTags.includes(mangaTag ?? null)) {
                results.push(createMangaTile({
                    id: result.arcid,
                    title: createIconText({text: result.title}),
                    image: `${baseUrl}/api/archives/${result.arcid}/thumbnail`
                }))
                collectedTags.push(mangaTag)
            }
        }
        return (results)
    }

    // UTILITY METHODS

    getNSTag(tags: string[], tag: string): string[] {
        let NSTags: string[] = []
        for(let tagString of tags){
            let NSTag = tagString?.split(',') ?? []
            for (let index of NSTag) {
                if (index.includes(':')) {
                    let temp: string[] = index.trim().split(":", 2).map(c => c?.trim())
                    if (temp[0] == tag && temp.length > 1) NSTags = NSTags.concat(temp)
                }
            }
        }
        return NSTags
    }

    isLastPage(json: any): boolean {
        return json.length > 0
    }
}
