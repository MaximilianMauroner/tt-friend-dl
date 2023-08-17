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
    link: string;
};
const useLoadVideos = (active: boolean) => {
    const [videos, setVideos] = useState<VideoType[]>([]);
    const [next, setNext] = useState<boolean>(false);
    useEffect(() => {
        if (!active) return;
        console.log("videos", videos);
    }, [videos]);

    useEffect(() => {
        const videoLink = document.querySelector(
            '[data-e2e="browse-video-link"]'
        );
        if (
            videoLink &&
            videos.findIndex((v) => v.link === videoLink.innerHTML) === -1
        ) {
            const cleanLink = videoLink.innerHTML.split("?")[0];
            setVideos((prev) => [...prev, { link: cleanLink }]);
            const nextButton = document.querySelector(
                'button[data-e2e="arrow-left"]'
            ) as HTMLButtonElement;
            if (nextButton) nextButton.click();
        }
    }, [next]);

    if (!active) return null;
    setInterval(() => {
        setNext((prev) => !prev);
    }, 300);

    return {};
};

const DispalyAside = () => {
    const [inMessage, setInMessage] = useState(false);
    const [runProcess, setRunProcess] = useState(false);
    setInterval(() => {
        const videoLink = document.querySelector(
            '[data-e2e="browse-video-link"]'
        );
        if (location.pathname == "/messages") {
            if (!inMessage) {
                setInMessage(true);
            }
            const videoContentDiv = document.querySelector(
                'div[class*="DivChatMainContent"]'
            );
            if (videoContentDiv && !runProcess) {
                setRunProcess(true);
            } else if (videoContentDiv === null && runProcess) {
                setRunProcess(false);
            }
        } else if (videoLink) {
            setRunProcess(true);
        } else if (inMessage) {
            setInMessage(false);
        }
    }, 500);
    useLoadVideos(runProcess);
    return (
        <>
            <aside className="absolute inset-y-0 left-0 w-1/3 text-black h-auto dark:text-white bg-gray-300 dark:bg-slate-800 z-[10000] opacity-50 pointer-events-none">
                <div className="flex justify-center items-center">
                    <span>
                        {inMessage
                            ? runProcess
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
