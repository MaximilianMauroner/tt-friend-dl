import { z } from "zod";
import { reformattedData } from "~/pages";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const messagesRouter = createTRPCRouter({
    import: publicProcedure
        .input(reformattedData)
        .mutation(async ({ input, ctx }) => {
            const person = input;
            const userName = person.tiktokName;
            const user = await ctx.prisma.user.findFirst({
                where: {
                    name: userName,
                },
            });
            if (!user) {
                await ctx.prisma.user.create({
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
                            tiktokUserId: messsage.From,
                            created_at: new Date(messsage.Date),
                        },
                    },
                });
                if (!createdMessage) {
                    await ctx.prisma.message.create({
                        data: {
                            content: messsage.Content,
                            tiktokUserId: messsage.From,
                            created_at: new Date(messsage.Date),
                        },
                    });
                }
            }
            return input.messages.length;
        }),
    list: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.session?.user) {
            return [];
        }
        return await ctx.prisma.message.findMany({
            orderBy: { created_at: "asc" },
            include: {
                MessageSeenBy: {
                    where: {
                        userId: ctx.session?.user.id,
                    },
                },
            },
            take: 1000,
            skip: 0,
        });
    }),
    seen: publicProcedure
        .input(z.object({ userId: z.string(), messageId: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const seen = await ctx.prisma.messageSeenBy.findFirst({
                where: {
                    userId: input.userId,
                    messageId: input.messageId,
                },
            });
            if (seen) {
                await ctx.prisma.messageSeenBy.delete({
                    where: {
                        messageId_userId: {
                            messageId: input.messageId,
                            userId: input.userId,
                        },
                    },
                });
                return;
            }
            await ctx.prisma.messageSeenBy.create({
                data: {
                    messageId: input.messageId,
                    userId: input.userId,
                },
            });
        }),
});
