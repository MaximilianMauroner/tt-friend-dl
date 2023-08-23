import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { z } from "zod";
import { RouterOutputs, api } from "~/utils/api";

export const chatMessage = z.object({
    Content: z.string(),
    Date: z.string(),
    From: z.string(),
});

const tiktokExport = z.object({
    "Direct Messages": z.object({
        "Chat History": z.object({
            ChatHistory: z.record(z.string(), z.array(chatMessage)),
        }),
    }),
});
export const reformattedData = z.object({
    tiktokName: z.string(),
    messages: z.array(chatMessage),
});

type TikTokExportType = z.infer<typeof tiktokExport>;
type ChatMessageType = z.infer<typeof chatMessage>;
type ReformattedDataType = z.infer<typeof reformattedData>;

export default function Home() {
    const { data: session, status } = useSession();
    return (
        <>
            <Head>
                <title>TikTok Message Downloader</title>
                <meta name="description" content="Generated by create-t3-app" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            {!session ? (
                <button onClick={() => void signIn("tiktok")}>Login</button>
            ) : (
                <>
                    <button onClick={() => void signOut()}>Logout</button>
                    <UploadFile />
                    <DisplayMessages />
                </>
            )}
        </>
    );
}

const UploadFile = () => {
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
                        {`Inserting ${data[insertingPerson]?.tiktokName ?? ""}:
          ${insertingCount} of ${data[insertingPerson]?.messages?.length ?? ""}
          messages`}
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="p-4">
            {data.length > 0 && displayProgress()}
            <form onSubmit={onSubmit}>
                <input
                    type="file"
                    name="file"
                    accept=".json"
                    onChange={(e) => setFile(e.target.files?.[0])}
                />
                <button className="rounded-xl bg-gray-400 p-4"> Upload</button>
            </form>
        </div>
    );
};
const DisplayMessages = () => {
    const { data: session, status } = useSession();
    const { data, refetch, isLoading } = api.messages.list.useQuery();
    const context = api.useContext();
    const mutation = api.messages.seen.useMutation({
        onSuccess() {
            void refetch();
        },
    });
    if (isLoading || data?.length == 0 || !session?.user.id) {
        return <div>Loading...</div>;
    }
    return (
        <div className="flex flex-col">
            {data?.map((message, index) => {
                return (
                    <div
                        className="grid w-full grid-cols-5 gap-1 p-2"
                        key={
                            message.created_at.toLocaleString() +
                            "_" +
                            index.toString()
                        }
                    >
                        <div className="flex flex-col">
                            <span className="text-gray-800">
                                {message.created_at.toLocaleString()}
                            </span>
                            <span className="text-gray-400">
                                @{message?.fromUser?.name ?? "Unknown"}
                            </span>
                        </div>
                        {message.content.includes(
                            "https://www.tiktokv.com/share/video"
                        ) ? (
                            <Link
                                target={"_blank"}
                                href={message.content}
                                className="col-span-3 overflow-ellipsis"
                            >
                                <span>{message.content}</span>
                            </Link>
                        ) : (
                            <span className="col-span-3 overflow-ellipsis">
                                {message.content}
                            </span>
                        )}
                        <SeenBy message={message} />
                    </div>
                );
            })}
        </div>
    );
};
const SeenBy = ({
    message,
}: {
    message: RouterOutputs["messages"]["list"]["0"];
}) => {
    const utils = api.useContext();
    const seenMuation = api.messages.seen.useMutation({
        onSettled() {
            // Sync with server once mutation has settled
            void utils.messages.list.invalidate();
        },
        async onMutate(newPost) {
            // Cancel outgoing fetches (so they don't overwrite our optimistic update)
            await utils.messages.list.cancel();

            // Get the data from the queryCache
            const prevData = utils.messages.list.getData();

            // Optimistically update the data with our new post
            utils.messages.list.setData(undefined, (old) => {
                if (message.seenBy.length > 0) {
                    return old?.map((message) => {
                        if (message.id === newPost.messageId) {
                            return {
                                ...message,
                                seenBy: [],
                            };
                        }
                        return message;
                    });
                } else {
                    return old?.map((message) => {
                        if (message.id === newPost.messageId) {
                            return {
                                ...message,
                                seenBy: [
                                    {
                                        messageId: message.toUserId,
                                        seenAt: new Date(),
                                        userId: message.toUserId,
                                    },
                                ],
                            };
                        }
                        return message;
                    });
                }
            });

            // Return the previous data so we can revert if something goes wrong
            return { prevData };
        },
    });
    return (
        <>
            <button
                onClick={() =>
                    void seenMuation.mutate({ messageId: message.id })
                }
            >
                {message.seenBy.length === 0 ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-10 w-10"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                    </svg>
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-10text-green-500 h-10"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                )}
            </button>
        </>
    );
};
