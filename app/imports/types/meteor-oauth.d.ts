// The oauth package ships no type declarations, so zodern:types cannot pull
// any in. This covers only the parts the Jubla-DB login uses.

declare module "meteor/oauth" {
  type LoginStyle = "popup" | "redirect";

  export type OAuthResult = {
    serviceData: { id: string; [key: string]: unknown };
    options?: { profile?: Record<string, unknown> };
  };

  export const OAuth: {
    registerService(
      name: string,
      version: 2,
      urls: null,
      handleOauthRequest: (
        query: Record<string, string>,
      ) => Promise<OAuthResult>,
    ): void;
    launchLogin(options: {
      loginService: string;
      loginStyle: LoginStyle;
      loginUrl: string;
      credentialRequestCompleteCallback: (
        tokenOrError?: string | Error,
      ) => void;
      credentialToken: string;
      popupOptions?: { width?: number; height?: number };
    }): void;
    openSecret(secret: unknown): string;
    _redirectUri(serviceName: string, config: object): string;
    _loginStyle(
      serviceName: string,
      config: object,
      options?: { loginStyle?: LoginStyle },
    ): LoginStyle;
    _stateParam(loginStyle: LoginStyle, credentialToken: string): string;
  };
}
