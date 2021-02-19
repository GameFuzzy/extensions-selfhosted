import cheerio from 'cheerio'
import { Source } from 'paperback-extensions-common'
import { LANraragi } from '../LANraragi/LANraragi'
import { APIWrapper } from "paperback-extensions-common";

describe('LANraragi Tests', function () {

    var wrapper: APIWrapper = new APIWrapper();
    var source: Source = new LANraragi(cheerio);
    var chai = require('chai'), expect = chai.expect, should = chai.should();
    var chaiAsPromised = require('chai-as-promised');
    chai.use(chaiAsPromised);

    var mangaId = "6646c24b0951483ff23709452e130ed2bc85defb";

    before(function() {
        // This will run before ANY test. Set your state values here
        source.stateManager.store("serverAddress", "http://192.168.1.97:3000") // Or whatever your endpoint is
        source.stateManager.store("APIKey", "bruhposmdapso")
    })

    it("Retrieve Manga Details", async () => {
        let details = await wrapper.getMangaDetails(source, mangaId);
        expect(details, "No results found with test-defined ID [" + mangaId + "]").to.exist;

        // Validate that the fields are filled
        let data = details;
        expect(data.id, "Missing ID").to.be.not.empty;
        expect(data.image, "Missing Image").to.be.not.empty;
        expect(data.status, "Missing Status").to.exist;
        expect(data.titles, "Missing Titles").to.be.not.empty;
        expect(data.rating, "Missing Rating").to.exist;
    });

    it("Get Chapters", async () => {
        let data = await wrapper.getChapters(source, mangaId);
        expect(data, "No chapters present for: [" + mangaId + "]").to.not.be.empty;

        let entry = data[0]
        expect(entry.id, "No ID present").to.not.be.empty;
        expect(entry.chapNum, "No chapter number present").to.exist
    });

    it("Get Chapter Details", async () => {
        let chapters = await wrapper.getChapters(source, mangaId);
        let data = await wrapper.getChapterDetails(source, mangaId, chapters[0].id);

        expect(data, "No server response").to.exist;
        expect(data, "Empty server response").to.not.be.empty;

        expect(data.id, "Missing ID").to.be.not.empty;
        expect(data.mangaId, "Missing MangaID").to.be.not.empty;
        expect(data.pages, "No pages present").to.be.not.empty;
    });

    it("Testing search", async () => {
        let testSearch = createSearchRequest({
            title: 'a'
        });

        let search = await wrapper.searchRequest(source, testSearch, {page: 0});
        let result = search.results[0];

        expect(result, "No response from server").to.exist;

        expect(result.id, "No ID found for search query").to.be.not.empty;
        expect(result.image, "No image found for search").to.be.not.empty;
        expect(result.title, "No title").to.be.not.null;
        expect(result.subtitleText, "No subtitle text").to.be.not.null;
    });

    it("Testing Home-Page aquisition", async() => {
        let homePages = await wrapper.getHomePageSections(source)
        expect(homePages, "No response from server").to.exist
    })


    it("Testing home page results for latest titles", async() => {
        let results = await wrapper.getViewMoreItems(source, "0", {}, 3)

        expect(results, "No results whatsoever for this section").to.exist
        expect(results, "No results whatsoever for this section").to.exist

        let data = results![0]
        expect(data.id, "No ID present").to.exist
        expect(data.image, "No image present").to.exist
        expect(data.title.text, "No title present").to.exist
    })

})
