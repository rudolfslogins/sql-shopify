import _ from "lodash";
import { Database } from "../src/database";
import { ShopifyCsvLoader } from "../src/data/shopify-csv-loader";
import { App, Category, KeyBenefit, Review, PricingPlan } from "../src/data/shopify-types";
import { APPS, CATEGORIES, KEY_BENEFITS, PRICING_PLANS, REVIEWS } from "../src/shopify-table-names";
import { escape } from "../src/utils";
import { minutes } from "./utils";
import { selectCount, selectRowById, selectCategoryByTitle } from "../src/queries/select";

const insertApps = (apps: App[]) => {
    return (
        `INSERT INTO apps (
            url,
            title,
            tagline,
            developer,
            developer_link,
            icon,
            rating,
            reviews_count,
            description,
            pricing_hint) 
        VALUES` + 
        apps.map(app => `('${app.url}',
            '${escape(app.title)}',
            '${escape(app.tagline)}',
            '${escape(app.developer)}',
            '${escape(app.developerLink)}',
            '${escape(app.icon)}',
            ${app.rating},
            ${app.reviewsCount},
            '${escape(app.description)}',
            '${escape(app.pricingHint)}')`).join(",")
    );
};

const insertCategories = (categories: Category[]) => {
    return (
        `INSERT INTO categories (title) VALUES` + 
        categories.map(category => `('${category.title}')`).join(",")
    );
};

describe("Insert flat data", () => {
    let db: Database;

    beforeAll(async () => {
        db = await Database.fromExisting("01", "02");
        await ShopifyCsvLoader.load();
    }, minutes(1));

    it("should insert apps data", async done => {
        const apps = await ShopifyCsvLoader.apps();
        const chunks = _.chunk(apps, 500);

        for (const ch of chunks){
            await db.insert(insertApps(ch));
        }
        const count = await db.selectSingleRow(selectCount(APPS));
        expect(count.c).toBe(2831);

        const row = await db.selectSingleRow(selectRowById(1000, APPS));
        expect(row.title).toEqual("Yottie ‑ YouTube Video App");

        done();
    });

    it("should insert categories data", async done => {
        const categories = await ShopifyCsvLoader.categories();
        
        await db.insert(insertCategories(categories));


        const count = await db.selectSingleRow(selectCount(CATEGORIES));
        expect(count.c).toBe(12);

        const row = await db.selectSingleRow(selectRowById(5, CATEGORIES));
        expect(row.title).toEqual("Customer support");

        const rowByTitle = await db.selectSingleRow(selectCategoryByTitle("Places to sell"));
        expect(rowByTitle.id).toEqual(12);

        done();
    });

















});