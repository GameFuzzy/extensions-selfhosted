import {
    Chapter,
    ChapterDetails,
    LanguageCode,
    Manga,
    MangaStatus,
    MangaTile,
} from "paperback-extensions-common";

export class Parser {

    parseMangaDetails($: CheerioSelector, mangaId: string, source: any): Manga {
        let title = this.decodeHTMLEntity($("div#content h5").first().text().trim())
        let summary = this.decodeHTMLEntity($("div.col-lg-9").text().split("Description\n")[1].split("Volume")[0].trim())
        let image = encodeURI(this.getImageSrc($("div.media a").first(), source.baseUrl))
        let views = Number($('.fa-eye').text() ?? 0)
        let lastUpdate, hentai
        let i = 0
        for (let item of $('div.item-date').toArray()) {
            switch (i) {
                case 0: {
                    lastUpdate = source.convertTime($(item).text())
                    i++
                    continue
                }
                case 1: {
                    hentai = $(item).text() == 'Yes'
                    i++
                    continue
                }
                i = 0
            }
        }

        return createManga({
            id: mangaId,
            titles: [title],
            author: '',
            image: image ?? '',
            desc: summary,
            status: MangaStatus.ONGOING,
            rating: 0,
            views: views,
            hentai: hentai,
            lastUpdate: lastUpdate
        })
    }

    parseChapterList($: CheerioSelector, mangaId: string, source: any): Chapter[] {
        let chapters: Chapter[] = []

        // For each available chapter..
        for (let obj of $('div.col-lg-9 div.flex').toArray()) {
            let id = ($('a.item-author', $(obj)).attr('href') ?? '').replace(`${source.baseUrl}/comics/${mangaId}/`, '').replace(/\/$/, '')
            let volume = Number(id.split('/')[0])
            let chapNum = Number(id.split('/').pop())
            let chapName = $('a.item-author', $(obj)).first().text().trim()
            let releaseDate = source.convertTime($('a.item-company', $(obj)).first().text())
            if (typeof id === 'undefined') {
                throw(`Could not parse out ID when getting chapters for ${mangaId}`)
            }
            chapters.push(createChapter({
                id: id,
                mangaId: mangaId,
                langCode: source.languageCode ?? LanguageCode.UNKNOWN,
                volume: Number.isNaN(volume) ? 0 : volume,
                chapNum: Number.isNaN(chapNum) ? 0 : chapNum,
                name: Number.isNaN(chapNum) ? chapName : '',
                time: releaseDate
            }))
        }

        return this.sortChapters(chapters)
    }

    parseChapterDetails($: CheerioSelector, mangaId: string, chapterId: string, source: any): ChapterDetails {
        let scriptObj = $('div#pages-container + script').toArray()
        if (typeof scriptObj[0]?.children[0]?.data === 'undefined') {
            throw(`Could not parse script for ${mangaId}`)
        }
        let allPages = (scriptObj[0]?.children[0]?.data.split('[')[1].split('];')[0].replace(/["\\]/g, '').split(',')) ?? ['']
        let pages: string[] = []
        for (let obj of allPages) {
            let page = encodeURI(obj)
            page = page.startsWith('http') ? page : source.baseUrl + page
            if (!page) {
                throw(`Could not parse page for ${mangaId}/${chapterId}`)
            }
            pages.push(page)
        }
        return createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: pages,
            longStrip: false
        })
    }
    parseSearchSection($: CheerioStatic, source: any, collectedIds?: string[]): MangaTile[] {
        return this.parseHomeSection($, source, collectedIds)
    }

    parseHomeSection($: CheerioStatic, source: any, collectedIds?: string[]): MangaTile[] {
        let items: MangaTile[] = []
        if(typeof collectedIds === 'undefined') {
            collectedIds = []
        }
        for (let obj of $('div.list-item').toArray()) {
            let image = encodeURI(this.getImageSrc($('a.media-content', $(obj)).first(), source.baseUrl) ?? '')
            let title = this.decodeHTMLEntity($('a.list-title', $(obj)).first().text().trim())
            let id = $('a.list-title', $(obj)).attr('href')?.replace(`${source.baseUrl}/comics/`, '').split('/')[0]

            if (!id || !title || !image) {
                throw(`Failed to parse homepage sections for ${source.baseUrl}/`)
            }
            if (!collectedIds.includes(id)) {
                items.push(createMangaTile({
                    id: id,
                    title: createIconText({text: title}),
                    image: image
                }))
                collectedIds.push(id)
            }
        }
        return items
    }

    filterUpdatedManga($: CheerioSelector, time: Date, ids: string[], source: any): { updates: string[], loadNextPage: boolean } {
        let passedReferenceTime = false
        let updatedManga: string[] = []

        for (let obj of $('div.list-item').toArray()) {
            let id = $('a.list-title', $(obj)).attr('href')?.replace(`${source.baseUrl}/comics/`, '').split('/')[0] ?? ''
            let mangaTime: Date = source.convertTime($('.text-muted.text-sm', obj).text() ?? '')
            passedReferenceTime = mangaTime <= time
            if (!passedReferenceTime) {
                if (ids.includes(id)) {
                    updatedManga.push(id)
                }
            } else break

            if (typeof id === 'undefined') {
                throw(`Failed to parse homepage sections for ${source.baseUrl}/${source.homePage}/`)
            }
        }
        if (!passedReferenceTime) {
            return {updates: updatedManga, loadNextPage: true}
        } else {
            return {updates: updatedManga, loadNextPage: false}
        }


    }

    // UTILITY METHODS

    // Chapter sorting
    sortChapters(chapters: Chapter[]): Chapter[] {
        let sortedChapters: Chapter[] = []
        chapters.forEach((c) => {
            if (sortedChapters[sortedChapters.indexOf(c)]?.id !== c?.id) {
                sortedChapters.push(c)
            }
        })
        sortedChapters.sort((a, b) => (a.chapNum - b.chapNum) ? -1 : 1)
        return sortedChapters
    }

    getImageSrc(imageObj: Cheerio | undefined, baseUrl: string): string {
        let isFullLink = imageObj?.attr('style')?.startsWith('http')
        let trimmedLink = imageObj?.attr('style')?.split('(')[1]?.split(')')[0]
        let image = isFullLink ? trimmedLink : baseUrl + trimmedLink
        return image ?? ''
    }

    isLastPage($: CheerioSelector): boolean {
        return $('[rel=next]').first().length < 1;
    }

    decodeHTMLEntity(str: string): string {
        return str.replace(/&#(\d+);/g, function (match, dec) {
            return String.fromCharCode(dec);
        })
    }
}
