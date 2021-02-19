import {Chapter, ChapterDetails, LanguageCode, MangaStatus, MangaTile, TagSection,} from "paperback-extensions-common";
import {reverseLangCode} from "./Languages";

export class Parser {

    parseMangaDetails(json: any, mangaId: string, source: any): any {
        const tagSections: TagSection[] = [createTagSection({id: '0', label: 'genres', tags: []})]
        let re = /[: ]([^,:]*),/g, group
        let tags: string[] = []
        while ((group = re.exec(json.tags + ',')) !== null) {
            tags.push(group[1])
        }
        tagSections[0].tags = tags.map((elem: string) => createTag({id: elem, label: elem}))
        return createManga({
            id: mangaId,
            titles: [json.title],
            author: this.getNSTag(json.tags, 'author')[1]?.trim(),
            artist: this.getNSTag(json.tags, 'artist')[1]?.trim(),
            tags: tagSections,
            desc: '',
            image: `${source.baseUrl}/api/archives/${mangaId}/thumbnail`,
            status: MangaStatus.ONGOING,
            rating: this.getNSTag(json.tags, 'artist')[1]?.split('⭐').length - 1 ?? 0,
            lastUpdate: json.isNew ? new Date(Date.now() - 604800000).toString() : undefined
        })
    }

    parseChapters(json: any, mangaId: string, mangaData: any): Chapter[] {
        let chapters: Chapter[] = []
        for (let manga of json) {
            if (manga.tags.includes(this.getNSTag(mangaData.tags, 'parody')[1]?.replace(/\d*$/, '').trim())) {
                chapters.push(createChapter({
                    id: manga.arcid,
                    chapNum: Number(manga.title?.match(/\d*$/) ?? 1),
                    name: manga.title,
                    group: this.getNSTag(manga.tags, 'group')[1],
                    langCode: reverseLangCode[this.getNSTag(manga.tags, 'language')[1]?.toUpperCase() ?? 'ENGLISH'],
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

    parseChapterDetails(json: any, mangaId: string, chapterId: string, source: any): ChapterDetails {
        return createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: json.pages.map((x: string) => `${source.baseUrl}${x.replace('.', '')}`),
            longStrip: false
        })
    }

    parseArchiveList(json: any, source: any): MangaTile[] {
        let collectedTags: string[] = []
        let results = []
        let sortedJson = json.sort((a: any, b: any) => (Number(a.title?.match(/\d*$/) ?? 0) - Number(b.title?.match(/\d*$/) ?? 0)))
        for (let result of sortedJson) {
            let mangaTag = this.getNSTag(result.tags, 'parody')[1]?.replace(/\d*$/, '').trim()
            if (!collectedTags.includes(mangaTag ?? null)) {
                results.push(createMangaTile({
                    id: result.arcid,
                    title: createIconText({text: result.title}),
                    image: `${source.baseUrl}/api/archives/${result.arcid}/thumbnail`
                }))
                collectedTags.push(mangaTag)
            }
        }
        return (results)
    }

    /*
        filterUpdatedManga(json: any): string[] {
            let collectedUpdates: {id: string, parodyTag: string}[] = []
            let sortedJson = json.sort((a: any, b: any) => (Number(a.title?.match(/\d*$/) ?? 0) - Number(b.title?.match(/\d*$/) ?? 0)))
            for (let result of sortedJson) {
                let parodyTag = this.getNSTag(result.tags, 'parody')[1]?.replace(/\d*$/, '')?.trim()?.toLowerCase()
                let matchingUpdate = collectedUpdates.filter(updates => updates.parodyTag === parodyTag)
                if(matchingUpdate.length < 1) {
                    collectedUpdates.push({id: result.arcid, parodyTag: parodyTag})
                }
                else {
                    collectedUpdates.push(matchingUpdate[0])
                }
            }
            return (collectedUpdates.map(update => update.id))

        }
    */

    // UTILITY METHODS

    getNSTag(tags: string, tag: string): string[] {
        let NSTag = tags.split(',')
        for (let index of NSTag) {
            if (index.includes(':')) {
                let temp: string[] = index.trim().split(":", 2)
                if (temp[0] == tag && temp.length > 1) return temp
            }
        }
        return []
    }

    isLastPage(json: any): boolean {
        return json.length > 0
    }
}
