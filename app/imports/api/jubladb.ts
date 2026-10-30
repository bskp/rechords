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

// The "name" scope gets us email, first name, last name and nickname from the
// profile endpoint, which is all a song book needs to know.
export const JUBLADB_SCOPE = "name";

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
    scope: JUBLADB_SCOPE,
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
