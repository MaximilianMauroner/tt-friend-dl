import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { z } from "zod";
import { api } from "~/utils/api";

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
                                @{message.tiktokUserId}
                            </span>
                        </div>
                        {message.content.includes(
                            "https://www.tiktokv.com/share/video"
                        ) ? (
                            <Link
                                target={"_blank"}
                                href={message.content}
                                onClick={() =>
                                    void mutation.mutate({
                                        messageId: message.id,
                                        userId: session?.user.id,
                                    })
                                }
                                className="col-span-3 overflow-ellipsis"
                            >
                                <span>{message.content}</span>
                            </Link>
                        ) : (
                            <span>{message.content}</span>
                        )}
                        <input
                            type="checkbox"
                            defaultChecked={
                                message.MessageSeenBy.findIndex(
                                    (e) => e.userId == session?.user.id
                                ) === 0
                            }
                            onClick={() =>
                                void mutation.mutate({
                                    messageId: message.id,
                                    userId: session?.user.id,
                                })
                            }
                        />
                    </div>
                );
            })}
        </div>
    );
};
