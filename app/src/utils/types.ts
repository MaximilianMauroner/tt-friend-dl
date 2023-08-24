import { z } from "zod";

export const chatMessage = z.object({
    Content: z.string(),
    Date: z.string(),
    From: z.string(),
});

export const tiktokExport = z.object({
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

export type TikTokExportType = z.infer<typeof tiktokExport>;
export type ChatMessageType = z.infer<typeof chatMessage>;
export type ReformattedDataType = z.infer<typeof reformattedData>;
