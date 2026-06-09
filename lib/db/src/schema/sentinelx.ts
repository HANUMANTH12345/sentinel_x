import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const urlScansTable = pgTable("url_scans", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  score: integer("score").notNull(),
  indicators: text("indicators").array().notNull().default([]),
  chain: text("chain").array().notNull().default([]),
  breakdown: jsonb("breakdown").notNull().default({}),
  aiText: text("ai_text").notNull().default(""),
  trackers: text("trackers").array().notNull().default([]),
  hasSSL: boolean("has_ssl").notNull().default(false),
  hasHSTS: boolean("has_hsts").notNull().default(false),
  statusCode: integer("status_code"),
  sourceIp: text("source_ip"),
sourceCountry: text("source_country"),
sourceCity: text("source_city"),
sourceLat: text("source_lat"),
sourceLon: text("source_lon"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const qrScansTable = pgTable("qr_scans", {
  id: serial("id").primaryKey(),
  extractedUrl: text("extracted_url").notNull(),
  rawContent: text("raw_content"),
  score: integer("score").notNull(),
  indicators: text("indicators").array().notNull().default([]),
  aiText: text("ai_text").notNull().default(""),
  scamProbability: integer("scam_probability").notNull().default(0),
  hasSSL: boolean("has_ssl").notNull().default(false),
  sourceIp: text("source_ip"),
sourceCountry: text("source_country"),
sourceCity: text("source_city"),
sourceLat: text("source_lat"),
sourceLon: text("source_lon"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const communityReportsTable = pgTable("community_reports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  reporter: text("reporter").notNull(),
  type: text("type").notNull(),
  domain: text("domain").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"),
  votes: integer("votes").notNull().default(0),
  commentsCount: integer("comments_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contactSubmissionsTable = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUrlScanSchema = createInsertSchema(urlScansTable).omit({ id: true, createdAt: true });
export const insertQrScanSchema = createInsertSchema(qrScansTable).omit({ id: true, createdAt: true });
export const insertCommunityReportSchema = createInsertSchema(communityReportsTable).omit({ id: true, createdAt: true, votes: true, commentsCount: true });
export const insertContactSubmissionSchema = createInsertSchema(contactSubmissionsTable).omit({ id: true, createdAt: true });

export type UrlScan = typeof urlScansTable.$inferSelect;
export type InsertUrlScan = z.infer<typeof insertUrlScanSchema>;
export type QrScan = typeof qrScansTable.$inferSelect;
export type InsertQrScan = z.infer<typeof insertQrScanSchema>;
export type CommunityReport = typeof communityReportsTable.$inferSelect;
export type InsertCommunityReport = z.infer<typeof insertCommunityReportSchema>;
export type ContactSubmission = typeof contactSubmissionsTable.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
