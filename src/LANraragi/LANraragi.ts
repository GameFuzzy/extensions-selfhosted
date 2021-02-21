import {
    Chapter,
    ChapterDetails,
    FormObject,
    HomeSection,
    Manga,
    MangaTile,
    PagedResults,
    RequestHeaders,
    SearchRequest,
    Source,
    SourceInfo,
    SourceMenu,
    SourceMenuItemType,
    TagType,
    UserForm
} from "paperback-extensions-common"

import {Parser} from './Parser'

const LANRARAGI_DOMAIN = 'http://192.168.1.1:3000'

export const LANraragiInfo: SourceInfo = {
    version: '1.0.0',
    name: 'LANraragi',
    description: 'Extension that pulls manga from your local LANraragi server',
    author: 'GameFuzzy',
    authorWebsite: 'http://github.com/gamefuzzy',
    icon: "icon.png",
    hentaiSource: false,
    websiteBaseURL: LANRARAGI_DOMAIN,
    sourceTags: [
        {
            text: "Notifications",
            type: TagType.GREEN
        }
    ]
}

export class LANraragi extends Source {

    parser = new Parser()

    async getSourceMenu(): Promise<SourceMenu> {
        return Promise.resolve(createSourceMenu({
            items: [
                createSourceMenuItem({
                    id: "serverSettings",
                    label: "Server Settings",
                    type: SourceMenuItemType.FORM
                })
            ]
        }))
    }

    async getSourceMenuItemForm(itemId: string): Promise<UserForm> {
        let objects: FormObject[] = [
            createTextFieldObject({
                id: 'serverAddress',
                label: 'Server URL',
                placeholderText: 'http://192.168.1.1:3000',
                value: (await this.stateManager.retrieve('serverAddress'))
            }),
            createTextFieldObject({
                id: 'APIKey',
                label: 'API Key',
                placeholderText: 'AnimeLover420',
                value: (await this.stateManager.retrieve('APIKey'))
            }),
            createTextFieldObject({
                id: 'language',
                label: 'Language',
                placeholderText: 'English',
                value: (await this.stateManager.retrieve('language'))
            })
        ]
        return createUserForm({formElements: objects})
    }

    async submitSourceMenuItemForm(itemId: string, form: any) {
        var promises: Promise<void>[] = []

        Object.keys(form).forEach(key => {
            promises.push(this.stateManager.store(key, form[key]))
        })

        await Promise.all(promises)
    }

    base64Encode = (str: string): string => Buffer.from(str, 'binary').toString('base64')

    async getAPI(): Promise<{ key: string, isEmpty: boolean }> {
        return {
            key: `Bearer ${this.base64Encode(await this.stateManager.retrieve('APIKey'))}`,
            isEmpty: ((await this.stateManager.retrieve('APIKey')) ?? '') == ''
        }
    }

    async getServerAddress(): Promise<string> {
        let address = (await this.stateManager.retrieve('APIKey'))?.replace(/\/$/, '')
        // Clean up the address
        return (!address?.startsWith("http://") && !address?.startsWith("https://")) ? `http://${address?.replace('https://', '')}` : address
    }

    async getLanguage(): Promise<string> {
        return (await this.stateManager.retrieve('language')) ?? "_unknown"
    }


    getMangaShareUrl(mangaId: string) {
        return `${LANRARAGI_DOMAIN}/reader?id=${mangaId}`
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const baseUrl = await this.getServerAddress()
        const request = createRequestObject({
            url: `${baseUrl}/api/archives/${mangaId}/metadata`,
            method: 'GET',
            headers: await this.constructHeaders({})
        })

        const response = await this.requestManager.schedule(request, 1)
        const json = typeof response.data === "string" ? JSON.parse(response.data) : response.data

        return this.parser.parseMangaDetails(json, mangaId, baseUrl)
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        const baseUrl = await this.getServerAddress()
        const tagRequest = createRequestObject({
            url: `${baseUrl}/api/archives/${mangaId}/metadata`,
            method: 'GET',
            headers: await this.constructHeaders({})
        })
        const request = createRequestObject({
            url: `${baseUrl}/api/archives`,
            method: 'GET',
            headers: await this.constructHeaders({})
        })

        const tagResponse = await this.requestManager.schedule(tagRequest, 1)
        const response = await this.requestManager.schedule(request, 1)
        const mangaData = typeof tagResponse.data === "string" ? JSON.parse(tagResponse.data) : tagResponse.data
        const json = typeof response.data === "string" ? JSON.parse(response.data) : response.data

        return this.parser.parseChapters(json, mangaId, mangaData, await this.getLanguage())
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const baseUrl = await this.getServerAddress()
        const request = createRequestObject({
            url: `${baseUrl}/api/archives/${chapterId}/extract`,
            method: 'POST',
            headers: await this.constructHeaders({})
        })
        const deleteNewRequest = createRequestObject({
            url: `${baseUrl}/api/archives/${chapterId}/isnew`,
            method: 'DELETE',
            headers: await this.constructHeaders({})
        })

        const response = await this.requestManager.schedule(request, 1)
        const json = typeof response.data === "string" ? JSON.parse(response.data) : response.data
        await this.requestManager.schedule(deleteNewRequest, 1)

        return this.parser.parseChapterDetails(json, mangaId, chapterId, await (await this.getLanguage()).toUpperCase() ?? '_unknown')
    }

    async searchRequest(query: SearchRequest, metadata: any): Promise<PagedResults> {
        const baseUrl = await this.getServerAddress()
        const request = createRequestObject({
            url: `${baseUrl}/api/search`,
            method: 'GET',
            param: `?filter=${encodeURIComponent(query.title ?? '')}`,
            headers: await this.constructHeaders({})
        })
        const response = await this.requestManager.schedule(request, 1)
        const json = typeof response.data === "string" ? JSON.parse(response.data) : response.data

        let results = this.parser.parseArchiveList(json.data, baseUrl)
        return createPagedResults({
            results: results
        })
    }

    /*
    parseTags(json: any): TagSection[] {
        let tagSections: TagSection[] = []
        for (let category of json) {
            tagSections = [...tagSections, createTagSection({id: category.namespace, label: category.namespace.replace(/^\w/, (c: string) => c.toUpperCase()), tags: []})]

        }
    }*/

    /**
     * It's hard to capture a default logic for homepages. So for Madara sources,
     * instead we've provided a homesection reader for the base_url/source_traversal_path/ endpoint.
     * This supports having paged views in almost all cases.
     * @param sectionCallback
     */
    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const baseUrl = await this.getServerAddress()
        const sections = [
            {
                request: createRequestObject({
                    url: `${baseUrl}/api/search?`,
                    method: 'GET',
                    headers: await this.constructHeaders({})
                }),
                section: createHomeSection({
                    id: '0',
                    title: 'ALL',
                    view_more: true,
                })
            },
            {
                request: createRequestObject({
                    url: `${baseUrl}/api/search?newonly=true`,
                    method: 'GET',
                    headers: await this.constructHeaders({})
                }),
                section: createHomeSection({
                    id: '1',
                    title: 'NEW',
                    view_more: true,
                })
            }
        ]

        const promises: Promise<void>[] = []

        for (const section of sections) {
            // Let the app load empty sections
            sectionCallback(section.section)

            // Get the section data
            promises.push(
                this.requestManager.schedule(section.request, 1).then(response => {
                    const json = typeof response.data === "string" ? JSON.parse(response.data) : response.data
                    section.section.items = this.parser.parseArchiveList(json.data, baseUrl).slice(0, 10)
                    sectionCallback(section.section)
                }),
            )
        }

        // Make sure the function completes
        await Promise.all(promises)
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults | null> {
        const baseUrl = await this.getServerAddress()
        let page = metadata?.page ?? 1   // Default to page 1
        let sortBy = ''
        switch (homepageSectionId) {
            case '0': {
                sortBy = `api/search?`
                break
            }
            case '1': {
                sortBy = `api/search?newonly=true`
                break
            }
            default:
                return Promise.resolve(null)
        }
        const request = createRequestObject({
            url: `${baseUrl}/${sortBy}`,
            method: 'GET',
            headers: await this.constructHeaders({})
        })
        let response = await this.requestManager.schedule(request, 1)
        const json = typeof response.data === "string" ? JSON.parse(response.data) : response.data
        let items: MangaTile[] = this.parser.parseArchiveList(json.data, baseUrl)
        let mData: any = {page: (page + 1)}
        if (this.parser.isLastPage(json)) {
            mData = undefined
        }

        return createPagedResults({
            results: items,
            metadata: mData
        })
    }

    async constructHeaders(headers: any): Promise<any> {
        if (!(await this.getAPI()).isEmpty) {
            headers["Authorization"] = this.getAPI()
        }
        headers["accept"] = 'application/json'
        return headers
    }


    async globalRequestHeaders(): Promise<RequestHeaders> {
        let headers: any = {}
        if (!(await this.getAPI()).isEmpty) {
            headers["Authorization"] = this.getAPI()
        }
        headers["accept"] = "image/avif,image/apng,image/jpeg;q=0.9,image/png;q=0.9,image/*;q=0.8"
        return headers
    }

}
