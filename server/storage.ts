import {
  users,
  documents,
  jobs,
  type User,
  type UpsertUser,
  type Document,
  type InsertDocument,
  type Job,
  type InsertJob,
  type DocumentType,
  type ProcessStatus,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  getUserDocuments(userId: string, limit?: number, offset?: number): Promise<Document[]>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  
  // Job operations
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: number): Promise<Job | undefined>;
  getUserJobs(userId: string): Promise<Job[]>;
  updateJob(id: number, updates: Partial<Job>): Promise<Job>;
  getJobByDocumentId(documentId: number): Promise<Job | undefined>;
  
  // Statistics
  getUserStats(userId: string): Promise<{
    documentsCount: number;
    hoursUsed: number;
    hoursLimit: number;
    successRate: number;
    plan: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Document operations
  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db
      .insert(documents)
      .values(document)
      .returning();
    return newDocument;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    return document;
  }

  async getUserDocuments(userId: string, limit = 10, offset = 0): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document> {
    const [updatedDocument] = await db
      .update(documents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Job operations
  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db
      .insert(jobs)
      .values(job)
      .returning();
    return newJob;
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id));
    return job;
  }

  async getUserJobs(userId: string): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.userId, userId))
      .orderBy(desc(jobs.createdAt));
  }

  async updateJob(id: number, updates: Partial<Job>): Promise<Job> {
    const [updatedJob] = await db
      .update(jobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return updatedJob;
  }

  async getJobByDocumentId(documentId: number): Promise<Job | undefined> {
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.documentId, documentId))
      .orderBy(desc(jobs.createdAt))
      .limit(1);
    return job;
  }

  // Statistics
  async getUserStats(userId: string): Promise<{
    documentsCount: number;
    hoursUsed: number;
    hoursLimit: number;
    successRate: number;
    plan: string;
  }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { documentsCount: 0, hoursUsed: 0, hoursLimit: 0.5, successRate: 0, plan: 'FREE' };
    }

    const [{ count: documentsCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(eq(documents.userId, userId));

    const [{ completed = 0, total = 0 }] = await db
      .select({
        completed: sql<number>`count(*) filter (where status = 'COMPLETED')`,
        total: sql<number>`count(*)`
      })
      .from(documents)
      .where(eq(documents.userId, userId));

    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      documentsCount: Number(documentsCount),
      hoursUsed: user.hoursUsed || 0,
      hoursLimit: user.hoursLimit || 0.5,
      successRate,
      plan: user.plan || 'FREE',
    };
  }
}

export const storage = new DatabaseStorage();
