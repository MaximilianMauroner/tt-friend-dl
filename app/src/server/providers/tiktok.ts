import { OAuthConfig, OAuthUserConfig } from "next-auth/providers";

export interface TikTokProfile extends Record<string, any> {
  accent_color: number;
  avatar: string;
  banner: string;
  banner_color: string;
  discriminator: string;
  email: string;
  flags: number;
  id: string;
  image_url: string;
  locale: string;
  mfa_enabled: boolean;
  premium_type: number;
  public_flags: number;
  username: string;
  verified: boolean;
}

export default function TikTok<P extends TikTokProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "tiktok",
    name: "TikTok",
    type: "oauth",
    authorization:
      "https://www.tiktok.com/v2/auth/authorize?scope=user.info.basic",
    token: "https://www.tiktok.com/v2/auth/token",
    userinfo: "hhttps://www.tiktok.com/v2/auth/users/@me",
    profile(profile) {
      //   if (profile.avatar === null) {
      //     const defaultAvatarNumber = parseInt(profile.discriminator) % 5
      //     profile.image_url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`
      //   } else {
      //     const format = profile.avatar.startsWith("a_") ? "gif" : "png"
      //     profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`
      //   }
      return {
        id: profile.id,
        name: profile.username,
        email: profile.email,
        image: profile.image_url,
      };
    },
    style: {
      logo: "/discord.svg",
      logoDark: "/discord-dark.svg",
      bg: "#fff",
      text: "#7289DA",
      bgDark: "#7289DA",
      textDark: "#fff",
    },
    options,
  };
}
