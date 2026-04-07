import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

/**
 * Core user table with civic participation metrics
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 320 }).unique(),
  name: text("name"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // Civic metrics
  trustScore: int("trustScore").default(50).notNull(), // 0-100 scale
  totalReports: int("totalReports").default(0).notNull(),
  verifiedReports: int("verifiedReports").default(0).notNull(),
  
  // Profile
  avatar: text("avatar"), // S3 URL
  bio: text("bio"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Core issues/reports table
 */
export const issues = mysqlTable(
  "issues",
  {
    id: int("id").autoincrement().primaryKey(),
    reporterId: int("reporterId").notNull(),
    
    // Issue content
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    category: mysqlEnum("category", [
      "road_damage",
      "traffic_hazard",
      "sanitation",
      "water",
      "electrical",
      "other",
    ]).notNull(),
    
    // Status tracking
    status: mysqlEnum("status", [
      "pending",
      "verified",
      "in_progress",
      "resolved",
      "rejected",
    ])
      .default("pending")
      .notNull(),
    
    // Location
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    address: text("address"),
    landmark: varchar("landmark", { length: 255 }),
    
    // Media
    imageUrl: text("imageUrl"), // S3 URL
    
    // Engagement
    upvoteCount: int("upvoteCount").default(0).notNull(),
    commentCount: int("commentCount").default(0).notNull(),
    
    // Admin tracking
    verifiedBy: int("verifiedBy"), // Admin user ID
    resolvedBy: int("resolvedBy"), // Admin user ID
    rejectionReason: text("rejectionReason"),
    
    // Timestamps
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    resolvedAt: timestamp("resolvedAt"),
  },
  (table) => ({
    // Indexes for faster queries (not unique - multiple issues can have same status/category)
  })
);

export type Issue = typeof issues.$inferSelect;
export type InsertIssue = typeof issues.$inferInsert;

/**
 * Comments on issues for community discussion
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  issueId: int("issueId").notNull(),
  authorId: int("authorId").notNull(),
  
  content: text("content").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Upvotes on issues - tracks community validation
 */
export const upvotes = mysqlTable(
  "upvotes",
  {
    id: int("id").autoincrement().primaryKey(),
    issueId: int("issueId").notNull(),
    userId: int("userId").notNull(),
    
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    uniqueUpvote: uniqueIndex("idx_unique_upvote").on(table.issueId, table.userId),
  })
);

export type Upvote = typeof upvotes.$inferSelect;
export type InsertUpvote = typeof upvotes.$inferInsert;

/**
 * Notifications for users about status updates and activity
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  issueId: int("issueId"),
  
  type: mysqlEnum("type", [
    "status_update",
    "comment",
    "upvote",
    "mention",
  ]).notNull(),
  message: text("message").notNull(),
  
  isRead: boolean("isRead").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
