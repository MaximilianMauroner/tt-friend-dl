import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";
import { env } from "process";

export interface TikTokProfile extends Record<string, any> {
  id: string;
  open_id: string;
}

export default function TikTok<P extends TikTokProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "tiktok",
    name: "TikTok",
    type: "oauth",
    version: "2.0",
    clientId: env.TIKTOK_CLIENT_ID,
    clientSecret: env.TIKTOK_CLIENT_SECRET,
    authorization: {
      url: "https://www.tiktok.com/auth/authorize/",
      params: {
        scope: "user.info.basic",
        response_type: "code",
        client_key: env.TIKTOK_CLIENT_ID,
      },
    },
    token: {
      url: "https://open-api.tiktok.com/oauth/access_token/",
      params: {
        client_key: env.TIKTOK_CLIENT_ID,
        client_secret: env.TIKTOK_CLIENT_SECRET,
        grant_type: "authorization_code",
      },
    },
    userinfo: "https://open-api.tiktok.com/user/info/",
    profile(profile) {
      return {
        id: profile?.open_id,
        profile: profile,
      };
    },
    checks: ["state"],
    options,
  };
}
