import { Database } from "../src/database";
import { minutes } from "./utils";

describe("Queries Across Tables", () => {
    let db: Database;

    beforeAll(async () => {
        db = await Database.fromExisting("03", "04");
    }, minutes(1));

    it("should select count of apps which have free pricing plan", async done => {
        const query = `
        SELECT COUNT(1) as count
        FROM apps a
        JOIN apps_pricing_plans app on app.app_id = a.id
        JOIN pricing_plans pp on pp.id = app.pricing_plan_id
        WHERE pp.price LIKE "Free%"`;

        const result = await db.selectSingleRow(query);
        expect(result).toEqual({
            count: 1112
        });
        done();
    }, minutes(1));

    it("should select top 3 most common categories", async done => {
        const query = `
        SELECT count(*) AS count, c.title as category
        FROM apps a
        JOIN apps_categories ac ON ac.app_id = a.id
        JOIN categories c ON c.id = ac.category_id
        GROUP BY category
        ORDER BY count desc
        LIMIT 3`;

        const result = await db.selectMultipleRows(query);
        expect(result).toEqual([
            { count: 1193, category: "Store design" },
            { count: 723, category: "Sales and conversion optimization" },
            { count: 629, category: "Marketing" }
        ]);
        done();
    }, minutes(1));

    it("should select top 3 prices by appearance in apps and in price range from $5 to $10 inclusive (not matters monthly or one time payment)", async done => {
        const query = `
        SELECT COUNT(1) AS count, pp.price,
        CASE WHEN pp.price LIKE "$%/%" THEN CAST(SUBSTR(REPLACE(pp.price,',',''), 2, (INSTR(pp.price, '/') -2)) AS REAL) 
        WHEN pp.price LIKE "$% %" THEN CAST(SUBSTR(REPLACE(pp.price,',',''), 2, (INSTR(pp.price, ' ') -2)) AS REAL)
        ELSE CAST("0.00" AS REAL)
        END casted_price
        FROM apps a
        JOIN apps_pricing_plans app ON app.app_id = a.id
        JOIN pricing_plans pp ON pp.id = app.pricing_plan_id
        WHERE casted_price >= 5 AND casted_price <= 10
        GROUP BY casted_price
        ORDER BY count DESC
        LIMIT 3`;

        const result = await db.selectMultipleRows(query);
        expect(result).toEqual([
            { count: 225, price: "$9.99/month", casted_price: 9.99 },
            { count: 135, price: "$5/month", casted_price: 5 },
            { count: 114, price: "$10/month", casted_price: 10 }
        ]);
        done();
    }, minutes(1));
});