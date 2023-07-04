import { createRoot } from "react-dom/client";
import "./style.css";
import { fetchTest, getUserId } from "./test";
const div = document.createElement("div");
div.id = "__root";
document.body.appendChild(div);

const rootContainer = document.querySelector("#__root");
if (!rootContainer) throw new Error("Can't find Options root element");
const root = createRoot(rootContainer);

const LoadUserInformation = () => {
    const l = async () => {
        const t = await fetchTest();
        const userId = getUserId();
        console.log(t, userId);
    };
    l();
    return <></>;
};
root.render(
    <>
        <LoadUserInformation />
    </>
    // <aside className="absolute inset-y-0 left-0 w-1/3  text-black dark:text-white bg-gray-300 dark:bg-slate-800 z-[100] ">
    //     <div className="flex justify-center items-center">
    //         <span>content script loaded</span>
    //     </div>
    // </aside>
);

try {
    console.log(document.querySelector("#__root"));
    console.log("content script loaded");
} catch (e) {
    console.error(e);
}
