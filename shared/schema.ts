import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  real,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums - declared first to be used in tables
export const planEnum = pgEnum("plan", ["FREE", "PRO", "BUSINESS"]);
export const documentTypeEnum = pgEnum("document_type", ["EBOOK", "TUTORIAL", "GUIDE", "RECIPE", "PRESENTATION", "SUMMARY"]);
export const processStatusEnum = pgEnum("process_status", ["PROCESSING", "COMPLETED", "FAILED"]);
export const jobStatusEnum = pgEnum("job_status", ["PENDING", "PROCESSING", "COMPLETED", "FAILED"]);

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  plan: planEnum("plan").default("FREE"),
  hoursUsed: real("hours_used").default(0).notNull(),
  hoursLimit: real("hours_limit").default(0.5).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id),
  youtubeUrl: text("youtube_url").notNull(),
  videoTitle: text("video_title"),
  videoDuration: integer("video_duration"), // in seconds
  documentType: documentTypeEnum("document_type").notNull(),
  content: jsonb("content"),
  status: processStatusEnum("status").default("PROCESSING"),
  filePath: text("file_path"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Jobs table for processing queue
export const jobs = pgTable("jobs", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id),
  documentId: integer("document_id").notNull().references(() => documents.id),
  status: jobStatusEnum("status").default("PENDING"),
  progress: integer("progress").default(0),
  currentStep: text("current_step"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  jobs: many(jobs),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one }) => ({
  user: one(users, {
    fields: [jobs.userId],
    references: [users.id],
  }),
  document: one(documents, {
    fields: [jobs.documentId],
    references: [documents.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;
export type Plan = typeof users.$inferSelect.plan;
export type DocumentType = typeof documents.$inferSelect.documentType;
export type ProcessStatus = typeof documents.$inferSelect.status;
export type JobStatus = typeof jobs.$inferSelect.status;
