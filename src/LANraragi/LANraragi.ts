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

const LANRARAGI_DOMAIN = 'https://github.com/Difegue/LANraragi'

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

    getMangaShareUrl(mangaId: string) {
        return `${LANRARAGI_DOMAIN}`
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const baseUrl = await this.getServerAddress()
        const tags = await this.forceTags(mangaId)
        const request = createRequestObject({
            url: `${baseUrl}/api/archives/${mangaId}/metadata`,
            method: 'GET',
            headers: await this.constructHeaders({})
        })

        const response = await this.requestManager.schedule(request, 1)
        const json = typeof response.data === "string" ? JSON.parse(response.data) : response.data
        return this.parser.parseMangaDetails(json, mangaId, tags, baseUrl)
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        const baseUrl = await this.getServerAddress()
        const tags = await this.forceTags(mangaId)
        const request = createRequestObject({
            url: `${baseUrl}/api/archives`,
            method: 'GET',
            headers: await this.constructHeaders({})
        })

        const response = await this.requestManager.schedule(request, 1)
        const json = typeof response.data === "string" ? JSON.parse(response.data) : response.data

        return this.parser.parseChapters(json, mangaId, tags, await this.getLanguage())
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        let promises: Promise<void>[] = []
        let json: any = ''
        const baseUrl = await this.getServerAddress()
        const requests = [
            // Get all the pages
            {
                id: 0,
                request: createRequestObject({
                    url: `${baseUrl}/api/archives/${chapterId}/extract`,
                    method: 'POST',
                    headers: await this.constructHeaders({})
                })
            },
            // Delete "NEW" flag
            {
                id: 1,
                request: createRequestObject({
                    url: `${baseUrl}/api/archives/${chapterId}/isnew`,
                    method: 'DELETE',
                    headers: await this.constructHeaders({})
                })
            },
        ]
        for (const requestObject of requests) {
            promises.push(this.requestManager.schedule(requestObject.request, 1).then(response => {
                if (requestObject.id === 0) {
                    json = typeof response.data === "string" ? JSON.parse(response.data) : response.data
                }
            }))
        }
        await Promise.all(promises)
        return this.parser.parseChapterDetails(json, mangaId, chapterId, await this.getServerAddress())
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

        let promises: Promise<void>[] = []

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
        let promises: Promise<void>[] = []
        let address = this.constructServerAddress(form['serverAddress'])
        let APIKey = this.constructAPI(form['APIKey'])
        let headers: { [key: string]: any } = {}
        // Set authorization header
        if (!APIKey.isEmpty) headers['authorization'] = APIKey.key

        let responseStatus
        let json

        const request = createRequestObject({
            url: `${address}/api/info`,
            method: 'GET',
            headers: headers
        })
        try {
            const response = await this.requestManager.schedule(request, 1)
            responseStatus = response.status
            json = typeof response.data === "string" ? JSON.parse(response.data) : response.data
        } catch (error) {
        }
        switch (responseStatus) {
            case 200: {
                if (json.nofun_mode) break
            }
            case 401: {
                throw new Error(`Invalid API key: ${APIKey.key}`)
            }
            default: {
                throw new Error(`Invalid URL: ${address}`)
            }
        }

        Object.keys(form).forEach(key => {
            promises.push(this.stateManager.store(key, form[key]))
        })

        await Promise.all(promises)
    }

    base64Encode = (str: string): string => Buffer.from(str, 'binary').toString('base64')

    constructAPI(APIKey: string): { key: string, isEmpty: boolean } {
        return {
            key: `Bearer ${this.base64Encode(APIKey.trim())}`,
            isEmpty: (APIKey ?? '') == ''
        }
    }

    constructServerAddress(serverAddress: string): string {
        let address = (serverAddress)?.replace(/\/$/, '')
        // Clean up the address
        return (!address?.startsWith("http://") && !address?.startsWith("https://")) ? `http://${address?.replace('https://', '')}` : address
    }

    constructLanguage(language: string): string {
        return language?.toUpperCase()
    }

    getAPI = async (): Promise<{ key: string, isEmpty: boolean }> => this.constructAPI(await this.stateManager.retrieve('APIKey'))
    getServerAddress = async (): Promise<string> => this.constructServerAddress(await this.stateManager.retrieve('serverAddress'))
    getLanguage = async (): Promise<string> => this.constructLanguage(await this.stateManager.retrieve('language'))

    async forceTags(mangaId: string): Promise<string[]> {
        const baseUrl = await this.getServerAddress()
        const APIKey = await this.getAPI()
        let promises: Promise<void>[] = []
        const plugins = ['ezeplugin', 'DateAddedPlugin', 'koromoplugin', 'Hdoujinplugin', 'nhplugin']
        let tags: string[] = []
        if (!APIKey.isEmpty) {
            for (let plugin of plugins) {
                const request = createRequestObject({
                    url: `${baseUrl}/api/plugins/use`,
                    method: 'POST',
                    headers: await this.constructHeaders({}),
                    param: `?key=${APIKey.key}&plugin=${plugin}&id=${mangaId}`
                })
                promises.push(this.requestManager.schedule(request, 1).then(response => {
                    let json = typeof response.data === "string" ? JSON.parse(response.data) : response.data
                    tags.push(json.data?.new_tags?.trim())
                }))
            }
        }
        const tagRequest = createRequestObject({
            url: `${baseUrl}/api/archives/${mangaId}/metadata`,
            method: 'GET',
            headers: await this.constructHeaders({})
        })
        promises.push(this.requestManager.schedule(tagRequest, 1).then(response => {
            let json = typeof response.data === "string" ? JSON.parse(response.data) : response.data
            tags.push(json?.tags)
        }))
        await Promise.all(promises)
        return tags
    }

    async globalRequestHeaders(): Promise<RequestHeaders> {
        let headers: { [key: string]: any } = {}
        if (!(await this.getAPI()).isEmpty) {
            headers["authorization"] = (await this.getAPI()).key
        }
        headers["accept"] = "image/avif,image/apng,image/jpeg;q=0.9,image/png;q=0.9,image/*;q=0.8"
        return headers
    }

    async constructHeaders(headers: { [key: string]: any }): Promise<{ [key: string]: any }> {
        if (!(await this.getAPI()).isEmpty) {
            headers["authorization"] = (await this.getAPI()).key
        }
        headers["accept"] = 'application/json'
        return headers
    }

}
