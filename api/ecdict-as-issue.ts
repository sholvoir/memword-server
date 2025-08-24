import { Hono } from "hono";
import { collectionDict, collectionIssue } from "../lib/mongo.ts";
import { IIssue } from "@sholvoir/memword-common/iissue";
import user from '../mid/user.ts';
import auth from '../mid/auth.ts';
import admin from '../mid/admin.ts';

const app = new Hono();

app.get(user, auth, admin, async (c) => {
    const issues: Array<IIssue> = [];
    const cursor = collectionDict.find();
    u: for await (const dict of cursor) {
        if (dict.entries) for (const entry of dict.entries) {
            if (entry.phonetic?.includes('/,/')) {
                issues.push({reporter: "hua", issue: dict.word});
                continue u;
            }
            if (entry.meanings) {
                if (entry.meanings.ecdict) {
                    issues.push({reporter: "hua", issue: dict.word});
                    continue u;
                }
                for (const meaning of Object.values(entry.meanings)) {
                    for (const mean of meaning) {
                        if (mean.trans?.includes('""')) {
                            issues.push({reporter: "hua", issue: dict.word});
                            continue u;
                        }
                    }
                }
            }
        }
    }
    const result = await collectionIssue.insertMany(issues);
    if (!result.acknowledged) return c.json(result, 500);
    console.log(`API ecdict as issue GET ${result.insertedCount}`);
    return c.json(result);
})

export default app;