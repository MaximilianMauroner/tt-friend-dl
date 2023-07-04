export const fetchTest = async () => {
    const urlSP = new URLSearchParams({});
    urlSP.append("aid", "1988");
    urlSP.append("app_language", "en");
    urlSP.append("app_name", "tiktok_web");
    urlSP.append("browser_language", "en-GB");
    urlSP.append("browser_name", "Mozilla");
    urlSP.append("browser_online", "true");
    urlSP.append("browser_platform", "Win32");
    const brow =
        "5.0%20%28Windows%20NT%2010.0%3B%20Win64%3B%20x64%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F114.0.0.0%20Safari%2F537.36";
    urlSP.append("browser_version", "");
    urlSP.append("channel", "tiktok_web");
    urlSP.append("cookie_enabled", "true");
    urlSP.append("device_id", "7251872921261737498");
    urlSP.append("device_platform", "web_pc");
    urlSP.append("focus_state", "true");
    urlSP.append("from_page", "message");
    urlSP.append("history_len", "2");
    urlSP.append("is_fullscreen", "false");
    urlSP.append("is_page_visible", "true");
    urlSP.append("os", "windows");
    urlSP.append("priority_region", "IT");
    urlSP.append("referer", "");
    urlSP.append("region", "AT");
    urlSP.append("screen_height", "1152");
    urlSP.append("screen_width", "2048");
    urlSP.append("tz_name", "Europe/Vienna");
    urlSP.append(
        "uids",
        "6994027245505987589,6794538792318747654,6990127779162637318"
    );
    urlSP.append(
        "verifyFp",
        "verify_ljo0garf_dvDpBK3Z_8lzq_4L9w_9Qph_AOMSsgyp6xcE"
    );
    urlSP.append("webcast_language", "en");

    const msT =
        "WMwYCzZGLRfLvNdXgLjTd8WPcuuhBDcQdCowtqCe80flESJQqRGtY_96xrMgz7nK0Xbpo4NtYsMFqPsWGwFrh9g30V7CWaE1Af7350N0m9fA7FeBBXZKwnJ1BCf9HD-LKFH-P5pyeDWVcSHifw==";
    urlSP.append("msToken", "");
    urlSP.append("X-Bogus", "DFSzswVOgbUANJ8btJWCMYT8gyYk");

    urlSP.append(
        "_signature",
        "_02B4Z6wo000018dLHiwAAIDCmAjx9pSHH2vHSxqAAJV630"
    );

    let urlSpStr = urlSP.toString();
    urlSpStr = urlSpStr.replace("browser_version=", "browser_version=" + brow);
    urlSpStr = urlSpStr.replace("msToken=", "msToken=" + msT);

    const res = await fetch(
        "https://www.tiktok.com/api/im/multi_user/?" + urlSpStr
    );

    const data = await res.json();
    const keys = Object.keys(data.userMap);
    const userIds = [];
    for (const key of keys) {
        const user = data.userMap[key];
        userIds.push({ id: key, user: data.userMap[key] });
    }
    return userIds;
};
export const getUserId = () => {
    const script = document.getElementById("SIGI_STATE");
    if (!script) return null;
    const parsed = JSON.parse(script?.innerHTML);
    return parsed.AppContext.appContext.user.uid;
};
