import type {
  account,
  assets,
  guestRole,
  noteGuests,
  notes,
  noteSnapshots,
  planTier,
  publish,
  publishStatus,
  snapshotKind,
  user,
  userQuota,
  verification,
  workspace,
} from "./schema/index";

// ── Enums ───────────────────────────────────────────────────
export type PlanTier = (typeof planTier.enumValues)[number];
export type GuestRole = (typeof guestRole.enumValues)[number];
export type SnapshotKind = (typeof snapshotKind.enumValues)[number];
export type PublishStatus = (typeof publishStatus.enumValues)[number];

// ── Auth Types ──────────────────────────────────────────────
export type User = typeof user.$inferSelect;
export type InsertUser = typeof user.$inferInsert;

export type Account = typeof account.$inferSelect;
export type InsertAccount = typeof account.$inferInsert;

export type Verification = typeof verification.$inferSelect;
export type InsertVerification = typeof verification.$inferInsert;

// ── App Types ───────────────────────────────────────────────
export type UserQuota = typeof userQuota.$inferSelect;
export type InsertUserQuota = typeof userQuota.$inferInsert;

export type CloudWorkspace = typeof workspace.$inferSelect;
export type InsertCloudWorkspace = typeof workspace.$inferInsert;
export type Workspace = CloudWorkspace;
export type InsertWorkspace = InsertCloudWorkspace;

export type CloudNote = typeof notes.$inferSelect;
export type InsertCloudNote = typeof notes.$inferInsert;
export type Note = CloudNote;
export type InsertNote = InsertCloudNote;

export type CloudNoteGuest = typeof noteGuests.$inferSelect;
export type InsertCloudNoteGuest = typeof noteGuests.$inferInsert;
export type NoteGuest = CloudNoteGuest;
export type InsertNoteGuest = InsertCloudNoteGuest;

export type CloudNoteSnapshot = typeof noteSnapshots.$inferSelect;
export type InsertCloudNoteSnapshot = typeof noteSnapshots.$inferInsert;
export type NoteSnapshot = CloudNoteSnapshot;
export type InsertNoteSnapshot = InsertCloudNoteSnapshot;

export type CloudAsset = typeof assets.$inferSelect;
export type InsertCloudAsset = typeof assets.$inferInsert;
export type Asset = CloudAsset;
export type InsertAsset = InsertCloudAsset;

export type CloudPublish = typeof publish.$inferSelect;
export type InsertCloudPublish = typeof publish.$inferInsert;
export type Publish = CloudPublish;
export type InsertPublish = InsertCloudPublish;