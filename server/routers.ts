import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router, adminProcedure } from "./_core/trpc";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import * as db from "./db";
import { storeOtp, sendOtpEmail, verifyOtp } from "./_core/email-otp";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";

// ============= VALIDATION SCHEMAS =============

const createIssueSchema = z.object({
  title: z.string().min(5).max(255),
  description: z.string().min(10).max(5000),
  category: z.enum([
    "road_damage",
    "traffic_hazard",
    "sanitation",
    "water",
    "electrical",
    "other",
  ]),
  latitude: z.string(),
  longitude: z.string(),
  address: z.string().optional(),
  landmark: z.string().optional(),
  imageUrl: z.string().optional(),
});

const commentSchema = z.object({
  issueId: z.number(),
  content: z.string().min(1).max(1000),
});

const updateProfileSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
});

// ============= ROUTERS =============

export const appRouter = router({
  system: systemRouter,

  // ============= AUTH =============
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    requestOtp: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const otp = storeOtp(input.email);
        await sendOtpEmail(input.email, otp);
        return { success: true } as const;
      }),

    verifyOtp: publicProcedure
      .input(z.object({ email: z.string().email(), otp: z.string().min(4).max(8) }))
      .mutation(async ({ input, ctx }) => {
        const result = verifyOtp(input.email, input.otp);

        if (!result.success) {
          const msgMap: Record<string, string> = {
            not_found: "No OTP found for this email. Please request a new code.",
            expired: "OTP has expired. Please request a new code.",
            invalid: "Invalid OTP. Please check and try again.",
            too_many_attempts: "Too many failed attempts. Please request a new code.",
          };
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: msgMap[result.reason] ?? "OTP verification failed.",
          });
        }

        // Upsert the user with a synthetic openId based on email
        const openId = `email:${input.email.toLowerCase()}`;
        const isAdmin =
          input.email.toLowerCase() === ENV.adminEmail?.toLowerCase();

        await db.upsertUser({
          openId,
          email: input.email,
          loginMethod: "email_otp",
          lastSignedIn: new Date(),
          ...(isAdmin ? { role: "admin" } : {}),
        });

        const user = await db.getUserByOpenId(openId);
        const sessionToken = await sdk.createSessionToken(openId, {
          name: user?.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return { success: true } as const;
      }),
  }),

  // ============= ISSUES =============
  issues: router({
    list: publicProcedure
      .input(
        z.object({
          category: z.string().optional(),
          status: z.string().optional(),
          search: z.string().optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.listIssues(input);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const issue = await db.getIssueById(input.id);
        if (!issue) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Issue not found",
          });
        }
        return issue;
      }),

    create: protectedProcedure
      .input(createIssueSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await db.createIssue({
          reporterId: ctx.user.id,
          ...input,
        });

        // Update user's report count
        const user = await db.getUserById(ctx.user.id);
        if (user) {
          const newTotal = (user.totalReports || 0) + 1;
          // Update in database
          const dbInstance = await db.getDb();
          if (dbInstance) {
            const { users } = await import("../drizzle/schema");
            const { eq } = await import("drizzle-orm");
            await dbInstance
              .update(users)
              .set({ totalReports: newTotal })
              .where(eq(users.id, ctx.user.id));
          }
        }

        return result;
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          issueId: z.number(),
          status: z.enum([
            "pending",
            "verified",
            "in_progress",
            "resolved",
            "rejected",
          ]),
          rejectionReason: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.updateIssueStatus(
          input.issueId,
          input.status,
          ctx.user.id,
          input.rejectionReason
        );

        // Create notification for issue reporter
        const issue = await db.getIssueById(input.issueId);
        if (issue) {
          await db.createNotification({
            userId: issue.reporterId,
            issueId: input.issueId,
            type: "status_update",
            message: `Your issue status has been updated to: ${input.status}`,
          });
        }

        return { success: true };
      }),
  }),

  // ============= COMMENTS =============
  comments: router({
    list: publicProcedure
      .input(z.object({ issueId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCommentsByIssue(input.issueId);
      }),

    create: protectedProcedure
      .input(commentSchema)
      .mutation(async ({ input, ctx }) => {
        await db.createComment({
          issueId: input.issueId,
          authorId: ctx.user.id,
          content: input.content,
        });

        // Notify issue reporter (if not the commenter)
        const issue = await db.getIssueById(input.issueId);
        if (issue && issue.reporterId !== ctx.user.id) {
          await db.createNotification({
            userId: issue.reporterId,
            issueId: input.issueId,
            type: "comment",
            message: `${ctx.user.name || "Someone"} commented on your issue`,
          });
        }

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ commentId: z.number(), issueId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Verify ownership
        const { comments } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error("Database not available");

        const comment = await dbInstance
          .select()
          .from(comments)
          .where(eq(comments.id, input.commentId))
          .limit(1);

        if (comment.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Comment not found",
          });
        }

        if (comment[0].authorId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only delete your own comments",
          });
        }

        await db.deleteComment(input.commentId, input.issueId);
        return { success: true };
      }),
  }),

  // ============= UPVOTES =============
  upvotes: router({
    toggle: protectedProcedure
      .input(z.object({ issueId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const added = await db.toggleUpvote(input.issueId, ctx.user.id);

        // Notify issue reporter if upvoted
        if (added) {
          const issue = await db.getIssueById(input.issueId);
          if (issue && issue.reporterId !== ctx.user.id) {
            await db.createNotification({
              userId: issue.reporterId,
              issueId: input.issueId,
              type: "upvote",
              message: `${ctx.user.name || "Someone"} upvoted your issue`,
            });
          }
        }

        return { added };
      }),

    hasUpvoted: protectedProcedure
      .input(z.object({ issueId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await db.hasUserUpvoted(input.issueId, ctx.user.id);
      }),
  }),

  // ============= USERS =============
  users: router({
    getProfile: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        // Don't expose sensitive fields
        const { openId, email, loginMethod, ...publicUser } = user;
        return publicUser;
      }),

    updateProfile: protectedProcedure
      .input(updateProfileSchema)
      .mutation(async ({ input, ctx }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error("Database not available");

        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.bio) updateData.bio = input.bio;
        if (input.avatar) updateData.avatar = input.avatar;

        await dbInstance
          .update(users)
          .set(updateData)
          .where(eq(users.id, ctx.user.id));

        return { success: true };
      }),

    getLeaderboard: publicProcedure.query(async () => {
      return await db.getTopContributors(10);
    }),
  }),

  // ============= NOTIFICATIONS =============
  notifications: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        return await db.getNotifications(ctx.user.id, input.limit);
      }),

    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.notificationId);
        return { success: true };
      }),

    send: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          issueId: z.number().optional(),
          type: z.string(),
          message: z.string().min(1).max(500),
        })
      )
      .mutation(async ({ input }) => {
        await db.createNotification({
          userId: input.userId,
          issueId: input.issueId,
          type: input.type,
          message: input.message,
        });
        return { success: true };
      }),
  }),

  // ============= ADMIN =============
  admin: router({
    getStats: adminProcedure.query(async () => {
      return await db.getIssueStats();
    }),

    getCategoryBreakdown: adminProcedure.query(async () => {
      return await db.getCategoryBreakdown();
    }),

    getTopContributors: adminProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getTopContributors(input.limit || 10);
      }),

    adjustTrustScore: adminProcedure
      .input(z.object({ userId: z.number(), adjustment: z.number() }))
      .mutation(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error("Database not available");

        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const newScore = Math.max(0, Math.min(100, (user.trustScore || 50) + input.adjustment));

        await dbInstance
          .update(users)
          .set({ trustScore: newScore })
          .where(eq(users.id, input.userId));

        return { success: true, newScore };
      }),
  }),
});

export type AppRouter = typeof appRouter;
