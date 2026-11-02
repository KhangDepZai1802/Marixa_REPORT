import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("PostgreSQL RLS, linked reports, admin permissions and employee deletion", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth;
  create table auth.users(id uuid primary key,raw_app_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  grant usage on schema public,auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
    await db.exec(
      await readFile("supabase/migrations/001_initial.sql", "utf8"),
    );
    const a = "00000000-0000-4000-8000-000000000001",
      b = "00000000-0000-4000-8000-000000000002",
      admin = "00000000-0000-4000-8000-000000000003";
    for (const [id, name, role] of [
      [a, "Employee A", "employee"],
      [b, "Employee B", "employee"],
      [admin, "Admin", "admin"],
    ])
      await db.query("insert into auth.users values($1,$2)", [
        id,
        JSON.stringify({ full_name: name, department: "IT", role }),
      ]);
    const asUser = async (id: string) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id,
      ]);
      await db.exec("set role authenticated");
    };
    const create = async (
      owner: string,
      type = "morning",
      source: string | null = null,
      date = "2026-11-02",
    ) => {
      const q = await db.query<{ id: string }>(
        `insert into public.reports(user_id,morning_report_id,report_date,type,full_name,department,position,highlights,tasks) values($1,$2,$3,$4,'forged','fake','Specialist','["Focus","",""]','[{"title":"Task","progress":0,"result":""}]') returning id`,
        [owner, source, date, type],
      );
      return q.rows[0].id;
    };
    await asUser(a);
    const morning = await create(a);
    assert.equal(
      (await db.query<{ full_name: string }>("select full_name from reports"))
        .rows[0].full_name,
      "Employee A",
    );
    assert.equal((await db.query("select * from profiles")).rows.length, 1);
    await assert.rejects(() => db.exec("update profiles set role='admin'"));
    await assert.rejects(() => create(b));
    await asUser(b);
    assert.equal((await db.query("select * from reports")).rows.length, 0);
    await assert.rejects(() => create(b, "evening", morning));
    await asUser(a);
    await assert.rejects(() => create(a));
    await assert.rejects(() => create(a, "evening", null));
    const evening = await create(a, "evening", morning);
    await assert.rejects(() =>
      db.query("delete from reports where id=$1", [morning]),
    );
    await assert.rejects(() =>
      db.query("update reports set report_date='2026-11-03' where id=$1", [
        morning,
      ]),
    );
    await assert.rejects(() =>
      db.query(
        `update reports set tasks='[{"title":"Task","progress":120,"result":""}]' where id=$1`,
        [evening],
      ),
    );
    await db.query(
      `update reports set tasks='[{"title":"Task","progress":75,"result":"Waiting"}]' where id=$1`,
      [evening],
    );
    await asUser(admin);
    assert.equal((await db.query("select * from reports")).rows.length, 2);
    assert.equal((await db.query("select * from profiles")).rows.length, 3);
    assert.equal(
      (
        await db.query("delete from reports where id=$1 returning id", [
          evening,
        ])
      ).rows.length,
      0,
    );
    await create(admin);
    await db.exec("reset role");
    await db.query("delete from auth.users where id=$1", [a]);
    await asUser(admin);
    const archived = await db.query<{
      user_id: string | null;
      full_name: string;
    }>("select user_id,full_name from reports where id=$1", [morning]);
    assert.equal(archived.rows[0].user_id, null);
    assert.equal(archived.rows[0].full_name, "Employee A");
    await db.exec("reset role; set role anon");
    await assert.rejects(() => db.query("select * from reports"));
  } finally {
    await db.close();
  }
});
