import {PagedResults, SearchRequest} from "paperback-extensions-common";
import {Genkan} from "./Genkan";

export abstract class GenkanLegacy extends Genkan {

    async searchRequest(query: SearchRequest, metadata: any): Promise<PagedResults> {
        // If we're supplied a page that we should be on, set our internal reference to that page. Otherwise, we start from page 1.
        let page = metadata?.page ?? 1

        const request = createRequestObject({
            url: `${this.baseUrl}/latest?page=${page}`,
            method: 'GET',
            headers: this.constructHeaders({})
        })
        let data = await this.requestManager.schedule(request, 1)
        let $ = this.cheerio.load(data.data)
        let manga = this.parser.parseHomeSection($, this).filter(manga => manga.title.text.toLowerCase().includes(query.title?.toLowerCase() ?? ''))
        let mData: any = {page: (page + 1)}
        if (this.parser.isLastPage($)) {
            mData = undefined
        }
        return createPagedResults({
            results: manga,
            metadata: typeof mData?.page === 'undefined' ? undefined : mData
        })
    }
}