import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import { Mongo } from "meteor/mongo";
import { Random } from "meteor/random";
import { OAuth } from "meteor/oauth";
import { ServiceConfiguration } from "meteor/service-configuration";

// Login through the Jubla-DB, a hitobito instance. The name is also the path
// hitobito redirects back to (/_oauth/jubladb), so it has to match the
// redirect URI registered there.
export const JUBLADB = "jubladb";

// "with_roles" is the only scope that lists every role, including those in
// the alumni network; the narrower "nextcloud" leaves them out. It brings
// address and birthday along too, which are read but never kept.
// "groups" lets us climb from a role's group up to its Schar and Kanton.
export const JUBLADB_PROFILE_SCOPE = "with_roles";
export const JUBLADB_SCOPES = [JUBLADB_PROFILE_SCOPE, "groups"].join(" ");

export type JublaDbGroup = { id: number; name: string };

// One role of a person, with the Schar and Kantonalverband its group belongs
// to. Either is missing where the group sits above it, e.g. in the
// Bundesleitung, or where the hierarchy could not be read.
export type JublaDbMembership = {
  role: string;
  group: JublaDbGroup & { type: string };
  flock?: JublaDbGroup;
  state?: JublaDbGroup;
};

type AccountsOAuth = {
  registerService(name: string): void;
  serviceNames(): string[];
  credentialRequestCompleteHandler(
    callback: (err?: Error) => void,
  ): (tokenOrError?: string | Error) => void;
};

const oauth = (Accounts as unknown as { oauth: AccountsOAuth }).oauth;

// Hot updates re-run this module, and a second registration throws.
if (!oauth.serviceNames().includes(JUBLADB)) {
  oauth.registerService(JUBLADB);
}

// The secret is stored as well, but never published to the client.
export type JublaDbConfiguration = {
  service: typeof JUBLADB;
  url: string;
  clientId: string;
  secret: string;
  loginStyle: "popup" | "redirect";
};

export const jublaDbConfigurations =
  ServiceConfiguration.configurations as unknown as Mongo.Collection<JublaDbConfiguration>;

export const jublaDbConfiguration = () =>
  jublaDbConfigurations.findOne({ service: JUBLADB });

export const loginWithJublaDb = (callback: (err?: Error) => void) => {
  if (!Meteor.isClient) return;

  const config = jublaDbConfiguration();
  if (!config) {
    callback(new ServiceConfiguration.ConfigError(JUBLADB));
    return;
  }

  const credentialToken = Random.secret();
  const loginStyle = OAuth._loginStyle(JUBLADB, config);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: OAuth._redirectUri(JUBLADB, config),
    scope: JUBLADB_SCOPES,
    state: OAuth._stateParam(loginStyle, credentialToken),
  });

  OAuth.launchLogin({
    loginService: JUBLADB,
    loginStyle,
    loginUrl: `${config.url}/oauth/authorize?${params}`,
    credentialRequestCompleteCallback:
      oauth.credentialRequestCompleteHandler(callback),
    credentialToken,
    popupOptions: { width: 500, height: 700 },
  });
};
