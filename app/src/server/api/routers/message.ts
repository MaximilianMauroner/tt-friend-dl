import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { reformattedData } from "~/utils/types";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const messagesRouter = createTRPCRouter({
    import: protectedProcedure
        .input(reformattedData)
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
            }
            const person = input;
            const userName = person.tiktokName;
            let user = await ctx.prisma.user.findFirst({
                where: {
                    name: userName,
                },
            });
            if (!user) {
                user = await ctx.prisma.user.create({
                    data: {
                        name: userName,
                    },
                });
            }
            for (const messsage of person.messages) {
                const createdMessage = await ctx.prisma.message.findUnique({
                    where: {
                        messageIdentifier: {
                            content: messsage.Content,
                            fromUserId: user?.id,
                            toUserId: ctx.session?.user.id,
                            created_at: new Date(messsage.Date),
                        },
                    },
                });
                if (!createdMessage) {
                    await ctx.prisma.message.create({
                        data: {
                            content: messsage.Content,
                            fromUserId: user?.id,
                            toUserId: ctx.session?.user.id,
                            created_at: new Date(messsage.Date),
                        },
                    });
                }
            }
            return input.messages.length;
        }),
    list: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.session?.user) {
            return [];
        }
        return await ctx.prisma.message.findMany({
            where: {
                OR: [
                    { toUserId: ctx.session?.user.id },
                    { fromUserId: ctx.session?.user.id },
                ],
            },
            orderBy: { created_at: "asc" },
            include: {
                seenBy: {
                    where: {
                        userId: ctx.session?.user.id,
                    },
                },
                fromUser: true,
            },
        });
    }),
    seen: protectedProcedure
        .input(z.object({ messageId: z.string() }))
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user) {
                return [];
            }
            const seen = await ctx.prisma.messageSeenBy.findFirst({
                where: {
                    userId: ctx.session.user.id,
                    messageId: input.messageId,
                },
            });
            if (seen) {
                await ctx.prisma.messageSeenBy.delete({
                    where: {
                        messageId_userId: {
                            messageId: input.messageId,
                            userId: ctx.session.user.id,
                        },
                    },
                });
            } else {
                await ctx.prisma.messageSeenBy.create({
                    data: {
                        messageId: input.messageId,
                        userId: ctx.session.user.id,
                    },
                });
            }
        }),
});
