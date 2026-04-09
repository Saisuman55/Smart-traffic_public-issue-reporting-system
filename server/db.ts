import { eq, desc, and, like, or, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  issues,
  comments,
  upvotes,
  notifications,
  Issue,
  Comment,
  Upvote,
  Notification,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============= ISSUES =============

export async function createIssue(data: {
  reporterId: number;
  title: string;
  description: string;
  category: string;
  latitude: string;
  longitude: string;
  address?: string;
  landmark?: string;
  imageUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(issues).values({
    reporterId: data.reporterId,
    title: data.title,
    description: data.description,
    category: data.category as any,
    latitude: data.latitude as any,
    longitude: data.longitude as any,
    address: data.address,
    landmark: data.landmark,
    imageUrl: data.imageUrl,
  });

  // Atomically increment totalReports for the reporter
  await db
    .update(users)
    .set({ totalReports: sql`${users.totalReports} + 1` })
    .where(eq(users.id, data.reporterId));

  return result;
}

export async function getIssueById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(issues)
    .where(eq(issues.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listIssues(filters: {
  category?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const pageLimit = filters.limit || 20;
  const pageOffset = filters.offset || 0;

  const conditions = [];

  if (filters.category) {
    conditions.push(eq(issues.category, filters.category as any));
  }

  if (filters.status) {
    conditions.push(eq(issues.status, filters.status as any));
  }

  if (filters.search) {
    const escapedSearch = filters.search.replace(/[%_\\]/g, "\\$&");
    conditions.push(
      or(
        like(issues.title, `%${escapedSearch}%`),
        like(issues.description, `%${escapedSearch}%`)
      )!
    );
  }

  let query = db.select().from(issues);

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const result = await (query as any)
    .orderBy(desc(issues.createdAt))
    .limit(pageLimit)
    .offset(pageOffset);

  return result;
}

export async function updateIssueStatus(
  issueId: number,
  status: string,
  adminId?: number,
  rejectionReason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {
    status: status as any,
    updatedAt: new Date(),
  };

  if (status === "verified" && adminId) {
    updateData.verifiedBy = adminId;
  }

  if (status === "resolved" && adminId) {
    updateData.resolvedBy = adminId;
    updateData.resolvedAt = new Date();
  }

  if (status === "rejected" && rejectionReason) {
    updateData.rejectionReason = rejectionReason;
  }

  await db.update(issues).set(updateData).where(eq(issues.id, issueId));

  // Increment verifiedReports for the reporter when status is set to "verified"
  if (status === "verified") {
    const issue = await getIssueById(issueId);
    if (issue) {
      await db
        .update(users)
        .set({ verifiedReports: sql`${users.verifiedReports} + 1` })
        .where(eq(users.id, issue.reporterId));
    }
  }
}

// ============= COMMENTS =============

export async function createComment(data: {
  issueId: number;
  authorId: number;
  content: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(comments).values({
    issueId: data.issueId,
    authorId: data.authorId,
    content: data.content,
  });

  // Atomically increment comment count on issue
  await db
    .update(issues)
    .set({ commentCount: sql`${issues.commentCount} + 1` })
    .where(eq(issues.id, data.issueId));

  return result;
}

export async function getCommentsByIssue(issueId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(comments)
    .where(eq(comments.issueId, issueId))
    .orderBy(desc(comments.createdAt));

  return result;
}

export async function deleteComment(commentId: number, issueId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(comments).where(eq(comments.id, commentId));

  // Atomically decrement comment count on issue (floor at 0)
  await db
    .update(issues)
    .set({ commentCount: sql`GREATEST(${issues.commentCount} - 1, 0)` })
    .where(eq(issues.id, issueId));
}

// ============= UPVOTES =============

export async function toggleUpvote(issueId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if upvote exists
  const existing = await db
    .select()
    .from(upvotes)
    .where(and(eq(upvotes.issueId, issueId), eq(upvotes.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    // Remove upvote
    await db
      .delete(upvotes)
      .where(
        and(eq(upvotes.issueId, issueId), eq(upvotes.userId, userId))
      );

    // Atomically decrement upvote count (floor at 0)
    await db
      .update(issues)
      .set({ upvoteCount: sql`GREATEST(${issues.upvoteCount} - 1, 0)` })
      .where(eq(issues.id, issueId));

    return false; // Removed
  } else {
    // Add upvote
    await db.insert(upvotes).values({
      issueId,
      userId,
    });

    // Atomically increment upvote count
    await db
      .update(issues)
      .set({ upvoteCount: sql`${issues.upvoteCount} + 1` })
      .where(eq(issues.id, issueId));

    return true; // Added
  }
}

export async function hasUserUpvoted(issueId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(upvotes)
    .where(and(eq(upvotes.issueId, issueId), eq(upvotes.userId, userId)))
    .limit(1);

  return result.length > 0;
}

// ============= NOTIFICATIONS =============

export async function createNotification(data: {
  userId: number;
  issueId?: number;
  type: string;
  message: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(notifications).values({
    userId: data.userId,
    issueId: data.issueId,
    type: data.type as any,
    message: data.message,
  });
}

export async function getNotifications(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return result;
}

export async function getNotificationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));
}

// ============= ANALYTICS =============

export async function getIssueStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalRow] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(issues);

  const statusCounts = await db
    .select({ status: issues.status, count: sql<number>`COUNT(*)` })
    .from(issues)
    .groupBy(issues.status);

  const stats = {
    total: Number(totalRow.total),
    pending: 0,
    verified: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
  };

  for (const row of statusCounts) {
    const cnt = Number(row.count);
    if (row.status === "pending") stats.pending = cnt;
    else if (row.status === "verified") stats.verified = cnt;
    else if (row.status === "in_progress") stats.inProgress = cnt;
    else if (row.status === "resolved") stats.resolved = cnt;
    else if (row.status === "rejected") stats.rejected = cnt;
  }

  return stats;
}

export async function getCategoryBreakdown() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({ category: issues.category, count: sql<number>`COUNT(*)` })
    .from(issues)
    .groupBy(issues.category);

  const categories = [
    "road_damage",
    "traffic_hazard",
    "sanitation",
    "water",
    "electrical",
    "other",
  ];

  return categories.map((cat) => ({
    category: cat,
    count: Number(result.find((r) => r.category === cat)?.count ?? 0),
  }));
}

export async function getTopContributors(limit = 10) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(users)
    .orderBy(desc(users.verifiedReports))
    .limit(limit);

  return result;
}
