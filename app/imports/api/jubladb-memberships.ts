import type { JublaDbMembership } from "./jubladb";

// Kept free of Meteor imports so the tests can run it under plain Node.

export type HitobitoRole = {
  group_id: number;
  group_name: string;
  role_class: string;
  role_name: string;
};

type HitobitoGroup = {
  id: number;
  name: string;
  type: string;
  parentId: number | null;
};

// The alumni network (NEJB) has its own Schar and Kanton levels.
const FLOCK_TYPES = ["Group::Flock", "Group::NejbSchar"];
const STATE_TYPES = ["Group::State", "Group::NejbKanton"];

// A Versandadresse only receives mail, and an Austritt is a role that ended:
// neither says where someone belongs.
const IGNORED_ROLES = /::(DispatchAddress|Alumnus)$/;

export const readJson = async (res: Response, what: string) => {
  if (!res.ok) {
    throw new Error(
      `Jubla-DB ${what} failed: ${res.status} ${await res.text()}`,
    );
  }
  return res.json();
};

// Fetches the given groups and all their ancestors, one level per request.
export const loadHierarchy = async (
  url: string,
  token: string,
  ids: number[],
) => {
  const groups = new Map<number, HitobitoGroup>();
  const requested = new Set<number>();
  let missing = [...new Set(ids)];

  // The tree is about five levels deep; the bound only guards against a loop.
  for (let depth = 0; missing.length > 0 && depth < 10; depth++) {
    missing.forEach((id) => requested.add(id));
    const params = new URLSearchParams({
      "filter[id][eq]": missing.join(","),
      "fields[groups]": "name,type,parent_id",
      "page[size]": "100",
    });
    const res = await readJson(
      await fetch(`${url}/api/groups?${params}`, {
        headers: {
          Accept: "application/vnd.api+json",
          Authorization: `Bearer ${token}`,
        },
      }),
      "group request",
    );

    for (const { id, attributes } of res.data) {
      groups.set(Number(id), {
        id: Number(id),
        name: attributes.name,
        type: attributes.type,
        parentId: attributes.parent_id,
      });
    }

    missing = [...groups.values()]
      .map((group) => group.parentId)
      .filter((id): id is number => id !== null && !requested.has(id));
  }

  return groups;
};

const ancestor = (
  groups: Map<number, HitobitoGroup>,
  id: number,
  types: string[],
) => {
  for (let g = groups.get(id); g; g = groups.get(g.parentId ?? NaN)) {
    if (types.includes(g.type)) return { id: g.id, name: g.name };
  }
  return undefined;
};

export const readMemberships = async (
  url: string,
  token: string,
  roles: HitobitoRole[],
): Promise<JublaDbMembership[]> => {
  const relevant = roles.filter((r) => !IGNORED_ROLES.test(r.role_class));

  // Not every member may be allowed to read the groups above their own. The
  // roles are still worth keeping then, just without Schar and Kanton.
  let groups = new Map<number, HitobitoGroup>();
  try {
    groups = await loadHierarchy(
      url,
      token,
      relevant.map((r) => r.group_id),
    );
  } catch (e) {
    console.warn("Could not read the Jubla-DB group hierarchy:", e);
  }

  return relevant.map((r) => ({
    role: r.role_name,
    group: {
      id: r.group_id,
      name: r.group_name,
      // Role classes are nested in their group class: Group::Flock::Leader.
      type: r.role_class.replace(/::[^:]+$/, ""),
    },
    flock: ancestor(groups, r.group_id, FLOCK_TYPES),
    state: ancestor(groups, r.group_id, STATE_TYPES),
  }));
};
