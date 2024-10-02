import { serial, text, varchar } from "drizzle-orm/pg-core"; // Import from pg-core for PostgreSQL
import { pgTable } from "drizzle-orm/pg-core"; // Use pgTable for PostgreSQL

export const MockInterview = pgTable('mockInterview', {
    id: serial('id').primaryKey(),
    jsonMockResp: text('jsonMockResp').notNull(),
    jobPosition: varchar('jobPosition', { length: 255 }).notNull(),  // Specified length
    jobDesc: varchar('jobDesc', { length: 255 }).notNull(),          // Specified length
    jobExperience: varchar('jobExperience', { length: 100 }).notNull(), // Specified length
    createdBy: varchar('createdBy', { length: 100 }).notNull(),      // Specified length
    createdAt: varchar('createdAt', { length: 100 }),                // Specified length
    mockId: varchar('mockId', { length: 100 }).notNull()             // Specified length
});
