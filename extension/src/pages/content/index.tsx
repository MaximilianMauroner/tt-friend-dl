import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
const div = document.createElement("div");
div.id = "__root";
document.body.appendChild(div);

const rootContainer = document.querySelector("#__root");
if (!rootContainer) throw new Error("Can't find Options root element");
const root = createRoot(rootContainer);

type VideoType = {
    id?: string;
    bgImg: string;
};
const useLoadVideos = (active: boolean) => {
    const [videos, setVideos] = useState<VideoType[]>([]);
    const [retry, setRetry] = useState<boolean>(false);
    useEffect(() => {
        if (!active) return;
        console.log("videos", videos);
    }, [videos]);

    useEffect(() => {
        const possibleVideos = document.querySelectorAll(
            'div[class*="DivVideoContainer"]'
        );
        const possibleNewVidoes: VideoType[] = [];
        for (const possibleVideo of possibleVideos) {
            const vidContainer = (
                possibleVideo as HTMLDivElement
            ).querySelector('div[style*="background-image"]') as HTMLDivElement;
            if (!vidContainer) continue;
            const bgImg = vidContainer.style.backgroundImage;
            if (!bgImg || bgImg === 'url("")') continue;
            if (videos.find((video: VideoType) => video.bgImg === bgImg))
                continue;
            possibleNewVidoes.push({
                bgImg,
            });
        }
        if (possibleNewVidoes.length === 0) return;
        setVideos((prev) => [...prev, ...possibleNewVidoes]);
    }, [retry]);

    if (!active) return null;
    setInterval(() => {
        setRetry((prev) => !prev);
    }, 300);

    return {};
};

const DispalyAside = () => {
    const [inMessage, setInMessage] = useState(false);
    const [hasOpenMessage, setHasOpenMessage] = useState(false);
    setInterval(() => {
        if (location.pathname == "/messages") {
            if (!inMessage) {
                setInMessage(true);
            }
            const videoContentDiv = document.querySelector(
                'div[class*="DivChatMainContent"]'
            );
            if (videoContentDiv && !hasOpenMessage) {
                setHasOpenMessage(true);
            } else if (videoContentDiv === null && hasOpenMessage) {
                setHasOpenMessage(false);
            }
        } else if (inMessage) {
            setInMessage(false);
        }
    }, 500);
    useLoadVideos(hasOpenMessage);
    return (
        <>
            <aside className="absolute inset-y-0 left-0 w-1/3 text-black h-auto dark:text-white bg-gray-300 dark:bg-slate-800 z-[10000] opacity-50 pointer-events-none">
                <div className="flex justify-center items-center">
                    <span>
                        {inMessage
                            ? hasOpenMessage
                                ? " And now wait"
                                : "Now Seelect a Chat of which message you want to archive"
                            : "Go to messages"}
                    </span>
                </div>
            </aside>
        </>
    );
};

root.render(
    <>
        <DispalyAside />
    </>
);

try {
    console.log(document.querySelector("#__root"));
    console.log("content script loaded");
} catch (e) {
    console.error(e);
}
