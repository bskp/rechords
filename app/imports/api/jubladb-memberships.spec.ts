import assert from "assert";
import { afterEach, describe, it } from "node:test";
import { HitobitoRole, readMemberships } from "./jubladb-memberships";

// A slice of the Jubla-DB tree, as /api/groups returns it.
const GROUPS: Record<
  number,
  { name: string; type: string; parent: number | null }
> = {
  507: { name: "JUBLA", type: "Group::Root", parent: null },
  659: {
    name: "Jungwacht Blauring Schweiz",
    type: "Group::Federation",
    parent: 507,
  },
  2: { name: "Bundesleitung", type: "Group::FederalBoard", parent: 659 },
  14: { name: "Kanton Luzern", type: "Group::State", parent: 659 },
  296: { name: "Nölliturm", type: "Group::Flock", parent: 14 },
  300: { name: "Kindergruppe Nölli", type: "Group::ChildGroup", parent: 296 },
  800: {
    name: "Netzwerk Ehemalige",
    type: "Group::NetzwerkEhemaligeJungwachtBlauring",
    parent: 507,
  },
  810: { name: "NEJB Luzern", type: "Group::NejbKanton", parent: 800 },
  811: {
    name: "Ehemaligenverein Luzern",
    type: "Group::KantonEhemaligenverein",
    parent: 810,
  },
};

const role = (
  group_id: number,
  role_class: string,
  role_name: string,
): HitobitoRole => ({
  group_id,
  group_name: GROUPS[group_id].name,
  role_class,
  role_name,
});

const realFetch = globalThis.fetch;
let requests: URL[] = [];

const serveGroups = (status = 200) => {
  requests = [];
  globalThis.fetch = (async (input: string) => {
    const url = new URL(input);
    requests.push(url);
    const ids = url.searchParams.get("filter[id][eq]")!.split(",").map(Number);
    const data = ids
      .filter((id) => GROUPS[id])
      .map((id) => ({
        id: String(id),
        attributes: {
          name: GROUPS[id].name,
          type: GROUPS[id].type,
          parent_id: GROUPS[id].parent,
        },
      }));
    return new Response(JSON.stringify({ data }), { status });
  }) as typeof fetch;
};

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("readMemberships()", () => {
  it("finds Schar and Kanton above a role's group", async () => {
    serveGroups();
    const [m] = await readMemberships("https://db", "t", [
      role(300, "Group::ChildGroup::Leader", "Leitung"),
    ]);
    assert.deepStrictEqual(m, {
      role: "Leitung",
      group: { id: 300, name: "Kindergruppe Nölli", type: "Group::ChildGroup" },
      flock: { id: 296, name: "Nölliturm" },
      state: { id: 14, name: "Kanton Luzern" },
    });
  });

  it("counts the alumni network's Kanton as a Kanton", async () => {
    serveGroups();
    const [m] = await readMemberships("https://db", "t", [
      role(811, "Group::KantonEhemaligenverein::NejbMember", "Mitglied"),
    ]);
    assert.deepStrictEqual(m.state, { id: 810, name: "NEJB Luzern" });
    assert.strictEqual(m.flock, undefined);
  });

  it("leaves Schar and Kanton out above them", async () => {
    serveGroups();
    const [m] = await readMemberships("https://db", "t", [
      role(2, "Group::FederalBoard::Member", "Mitglied"),
    ]);
    assert.strictEqual(m.flock, undefined);
    assert.strictEqual(m.state, undefined);
  });

  it("skips mailing addresses and roles that ended", async () => {
    serveGroups();
    const memberships = await readMemberships("https://db", "t", [
      role(659, "Group::Federation::DispatchAddress", "Versandadresse"),
      role(659, "Group::Federation::Alumnus", "Austritt"),
      role(296, "Group::Flock::Leader", "Scharleitung"),
    ]);
    assert.deepStrictEqual(
      memberships.map((m) => m.role),
      ["Scharleitung"],
    );
  });

  it("asks once per level, for all roles together", async () => {
    serveGroups();
    await readMemberships("https://db", "t", [
      role(300, "Group::ChildGroup::Leader", "Leitung"),
      role(811, "Group::KantonEhemaligenverein::NejbMember", "Mitglied"),
    ]);
    // 300+811, 296+810, 14+800, 659+507, 507 is already known
    assert.strictEqual(requests.length, 4);
  });

  it("keeps the roles when the groups cannot be read", async () => {
    serveGroups(403);
    const [m] = await readMemberships("https://db", "t", [
      role(296, "Group::Flock::Leader", "Scharleitung"),
    ]);
    assert.deepStrictEqual(m.group, {
      id: 296,
      name: "Nölliturm",
      type: "Group::Flock",
    });
    assert.strictEqual(m.state, undefined);
  });
});
