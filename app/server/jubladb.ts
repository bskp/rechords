import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import { OAuth } from "meteor/oauth";
import { ServiceConfiguration } from "meteor/service-configuration";
import {
  JUBLADB,
  JUBLADB_PROFILE_SCOPE,
  jublaDbConfigurations,
} from "../imports/api/jubladb";
import {
  HitobitoRole,
  readJson,
  readMemberships,
} from "../imports/api/jubladb-memberships";

type HitobitoProfile = {
  id: number | string;
  email?: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  roles?: HitobitoRole[];
};

OAuth.registerService(JUBLADB, 2, null, async (query) => {
  const config = await jublaDbConfigurations.findOneAsync({
    service: JUBLADB,
  });
  if (!config) throw new ServiceConfiguration.ConfigError(JUBLADB);

  const tokens = await readJson(
    await fetch(`${config.url}/oauth/token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: query.code,
        redirect_uri: OAuth._redirectUri(JUBLADB, config),
        client_id: config.clientId,
        client_secret: OAuth.openSecret(config.secret),
      }),
    }),
    "token exchange",
  );

  const person: HitobitoProfile = await readJson(
    await fetch(`${config.url}/oauth/profile`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${tokens.access_token}`,
        "X-Scope": JUBLADB_PROFILE_SCOPE,
      },
    }),
    "profile request",
  );

  const fullName = [person.first_name, person.last_name]
    .filter(Boolean)
    .join(" ");

  // The access token is not kept, and of the profile only names, email and
  // memberships are. Meteor overwrites these on every login, so the
  // memberships follow the Jubla-DB.
  return {
    serviceData: {
      id: String(person.id),
      email: person.email,
      firstName: person.first_name,
      lastName: person.last_name,
      nickname: person.nickname,
      memberships: await readMemberships(
        config.url,
        tokens.access_token,
        person.roles ?? [],
      ),
    },
    options: {
      profile: { name: person.nickname || fullName, role: "user" },
    },
  };
});

// A Jubla-DB account brings its email along, so an admin can later grant it
// more rights like any other user. The address is left off when it already
// belongs to someone else, because emails are unique and the login would fail.
Accounts.onCreateUser(async (options, user) => {
  if (options.profile) user.profile = options.profile;

  const email = (
    user.services as { jubladb?: { email?: string } } | undefined
  )?.jubladb?.email
    ?.trim()
    .toLowerCase();
  if (email && !(await Accounts.findUserByEmail(email))) {
    user.emails = [{ address: email, verified: true }];
  }

  return user;
});

// Configured from the environment, so the secret never enters the repository.
// Without it the login button simply does not show.
Meteor.startup(async () => {
  const { JUBLADB_URL, JUBLADB_CLIENT_ID, JUBLADB_CLIENT_SECRET } = process.env;

  if (!JUBLADB_URL || !JUBLADB_CLIENT_ID || !JUBLADB_CLIENT_SECRET) {
    await jublaDbConfigurations.removeAsync({ service: JUBLADB });
    return;
  }

  await jublaDbConfigurations.upsertAsync(
    { service: JUBLADB },
    {
      $set: {
        url: JUBLADB_URL.replace(/\/+$/, ""),
        clientId: JUBLADB_CLIENT_ID,
        secret: JUBLADB_CLIENT_SECRET,
        loginStyle: "popup",
      },
    },
  );
});
