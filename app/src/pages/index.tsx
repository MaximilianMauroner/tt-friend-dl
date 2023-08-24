import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { z } from "zod";
import NavBar from "~/components/nav";
import { api } from "~/utils/api";

export default function Home() {
    const { status } = useSession({
        required: process.env.NODE_ENV !== "development",
    });
    return (
        <>
            <Head>
                <title>TikTok Message Downloader</title>
                <meta name="description" content="Generated by create-t3-app" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main
                className={
                    "h-screen min-h-full text-gray-900 dark:bg-slate-800 dark:text-gray-200"
                }
            >
                <DisplayMessages />
            </main>
            <NavBar />
        </>
    );
}

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
