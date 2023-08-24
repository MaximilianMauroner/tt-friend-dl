import {
    ArrowUpOnSquareStackIcon,
    ArrowRightOnRectangleIcon,
    UserIcon,
    MapIcon,
    PhotoIcon,
} from "@heroicons/react/24/outline";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
    type ChatMessageType,
    type ReformattedDataType,
    type TikTokExportType,
    tiktokExport,
} from "~/utils/types";
import { api } from "~/utils/api";

const NavBar = () => {
    const iconClass = "m-auto w-8 h-8";
    const [showAccount, setShowAccount] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    useEffect(() => {
        if (window.location.pathname === "/account") {
            setShowAccount(false);
        }
    }, []);

    return (
        <>
            <nav
                id="bottom-navigation"
                className="fixed inset-x-0 bottom-0 z-10 block bg-gray-200 text-gray-700 dark:bg-slate-900 dark:text-gray-200"
            >
                <div id="tabs" className="relative flex justify-between">
                    <div
                        className={"inline-block w-full pb-1 pt-2 text-center"}
                    >
                        {showAccount ? (
                            <Link
                                href={"/account"}
                                className="m-auto block w-min  hover:text-gray-300  focus:text-gray-300"
                            >
                                <UserIcon className={iconClass} />
                                <span className="tab tab-home block text-xs">
                                    {"Account"}
                                </span>
                            </Link>
                        ) : (
                            <Link
                                href={"/"}
                                className="m-auto block w-min hover:text-gray-300 focus:text-gray-300"
                            >
                                <MapIcon className={iconClass} />
                                <span className="tab tab-home block text-xs">
                                    {"Map"}
                                </span>
                            </Link>
                        )}
                    </div>
                    <div
                        className={"inline-block w-full pb-1 pt-2 text-center"}
                    >
                        <button
                            onClick={() => void signOut()}
                            className="m-auto block w-auto hover:text-gray-300 focus:text-gray-300"
                        >
                            <ArrowRightOnRectangleIcon className={iconClass} />
                            <span className="tab tab-home block text-xs">
                                {"Sign Out"}
                            </span>
                        </button>
                    </div>
                    <div
                        className={
                            "absolute bottom-6 left-0 right-0 ml-auto mr-auto w-20"
                        }
                    >
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className={
                                "bg-slate-00 h-20 w-20 rounded-full border-4 border-slate-800 bg-white text-green-500 "
                            }
                        >
                            <ArrowUpOnSquareStackIcon
                                className={"m-auto h-16"}
                            />
                        </button>
                    </div>
                </div>
                <UploadFile
                    showUploadModal={showUploadModal}
                    toggleUploadModal={() => setShowUploadModal(false)}
                />
            </nav>
        </>
    );
};
const UploadFile = ({
    showUploadModal,
    toggleUploadModal,
}: {
    showUploadModal: boolean;
    toggleUploadModal: () => void;
}) => {
    const [file, setFile] = useState<File>();
    const [insertingCount, setInsertingCount] = useState<number>(0);
    const [insertingPerson, setInsertingPerson] = useState<number>(0);
    const [data, setData] = useState<ReformattedDataType[]>([]);

    const mutation = api.messages.import.useMutation({
        onSuccess(data) {
            setInsertingCount((count) => count + data);
        },
    });

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!file) return;
        const fr = new FileReader();
        fr.readAsText(file);
        fr.onload = function (e) {
            if (typeof e?.target?.result !== "string") return;
            const result = JSON.parse(e?.target?.result) as TikTokExportType;
            const validatedResult = tiktokExport.parse(result);
            formatData(validatedResult);
        };
    };

    const formatData = (data: TikTokExportType) => {
        const reformattedData: ReformattedDataType[] = [];
        Object.keys(
            data["Direct Messages"]["Chat History"].ChatHistory
        ).forEach((key) => {
            const chatMessages =
                data["Direct Messages"]["Chat History"].ChatHistory[key];
            if (chatMessages && chatMessages?.length > 0 && key) {
                reformattedData.push({
                    tiktokName: key
                        .replace("Chat History with ", "")
                        .replace(":", ""),
                    messages: chatMessages,
                });
            }
        });
        console.log(reformattedData);

        if (reformattedData.length > 0) {
            setData(reformattedData);
        }
    };
    useEffect(() => {
        queueMessageMigration(insertingCount);
    }, [data, insertingPerson, insertingCount]);

    const queueMessageMigration = (start: number) => {
        const person = data[insertingPerson];
        let counter = 0;
        const messageQueue: ChatMessageType[] = [];

        if (!person?.messages?.length) {
            return;
        }
        for (
            let index = start;
            index < person?.messages?.length && counter < 10;
            index++
        ) {
            const message = person.messages[index];
            if (message) {
                messageQueue.push(message);
                counter++;
            }
        }
        if (messageQueue.length === 0) {
            setInsertingPerson((person) => person + 1);
            setInsertingCount(0);
            return;
        }
        mutation.mutate({
            messages: messageQueue,
            tiktokName: person.tiktokName,
        });
    };
    const displayProgress = () => {
        return (
            <>
                {insertingPerson === data.length ? (
                    "Done"
                ) : (
                    <div>
                        {`Inserting ${
                            data[insertingPerson]?.tiktokName ?? ""
                        }:${insertingCount} of ${
                            data[insertingPerson]?.messages?.length ?? ""
                        } messages`}
                    </div>
                )}
            </>
        );
    };

    return (
        <dialog
            open={showUploadModal}
            className="fixed inset-0 w-1/2 rounded-lg p-4"
        >
            <div className="modal p-4">
                {data.length > 0 && displayProgress()}
                <form onSubmit={onSubmit}>
                    <div className="col-span-full">
                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                            <div className="text-center">
                                <PhotoIcon
                                    className="mx-auto h-12 w-12 text-gray-300"
                                    aria-hidden="true"
                                />
                                {file ? (
                                    <p className="text-xs leading-5 text-gray-600">
                                        {file.name}
                                    </p>
                                ) : (
                                    <>
                                        <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                            <label
                                                htmlFor="file-upload"
                                                className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                                            >
                                                <span>
                                                    Select the TikTok export
                                                    file
                                                </span>
                                                <input
                                                    id="file-upload"
                                                    name="file-upload"
                                                    type="file"
                                                    accept=".json"
                                                    onChange={(e) =>
                                                        setFile(
                                                            e.target.files?.[0]
                                                        )
                                                    }
                                                    className="sr-only"
                                                />
                                            </label>
                                            <p className="pl-1">
                                                or drag and drop it
                                            </p>
                                        </div>
                                        <p className="text-xs leading-5 text-gray-600">
                                            it is called user_data.json
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center justify-end gap-x-6">
                        <button
                            type="button"
                            onClick={() => toggleUploadModal()}
                            className="text-sm font-semibold leading-6 text-gray-900"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            Upload
                        </button>
                    </div>
                </form>
            </div>
        </dialog>
    );
};
export default NavBar;
