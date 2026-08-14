import { db } from "../db";
import { assets, notes } from "../schema/index";
import { createSelectSchema, createInsertSchema } from "drizzle-orm/zod";
import type z from "zod";
import { eq, desc } from "drizzle-orm";

export const selectAssetSchema = createSelectSchema(assets);
export const insertAssetSchema = createInsertSchema(assets);

export type Asset = z.infer<typeof selectAssetSchema>;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type AssetWithNoteName = Asset & {
  noteName: string | null;
};

/**
 * Inserts a new asset.
 * 
 * @param input The asset data to insert
 * @returns The newly created asset
 */
export async function createAsset(input: Omit<InsertAsset, "createdAt"> & { createdAt?: Date }): Promise<Asset> {
  try {
    const insertData = insertAssetSchema.parse({
      ...input,
      createdAt: input.createdAt ?? new Date(),
    });

    const result = await db
      .insert(assets)
      .values(insertData)
      .returning();

    return selectAssetSchema.parse(result[0]);
  } catch (error) {
    console.error("Failed to create asset:", error);
    throw new Error("Failed to create asset");
  }
}

/**
 * Deletes an asset by its ID.
 * 
 * @param id The ID of the asset to delete
 * @returns true if deleted, false if the asset didn't exist
 */
export async function deleteAsset(id: string): Promise<boolean> {
  try {
    const result = await db
      .delete(assets)
      .where(eq(assets.id, id))
      .returning({ deletedId: assets.id });

    return result.length > 0;
  } catch (error) {
    console.error("Failed to delete asset:", error);
    throw new Error("Failed to delete asset");
  }
}

/**
 * Fetches assets with pagination, optional mimetype filtering,
 * and includes the parent note's name.
 * 
 * @param limit Maximum number of assets to return (default: 20)
 * @param offset Number of assets to skip (default: 0)
 * @param mimeType Optional mimeType to filter by (e.g. 'image/png')
 */
export async function fetchAllAssets(
  limit: number = 20,
  offset: number = 0,
  mimeType?: string
): Promise<AssetWithNoteName[]> {
  try {
    const queryConditions = mimeType ? eq(assets.mimeType, mimeType) : undefined;

    const data = await db
      .select({
        id: assets.id,
        noteId: assets.noteId,
        name: assets.name,
        mimeType: assets.mimeType,
        size: assets.size,
        createdAt: assets.createdAt,
        noteName: notes.name,
      })
      .from(assets)
      .leftJoin(notes, eq(assets.noteId, notes.id))
      .where(queryConditions)
      .orderBy(desc(assets.createdAt))
      .limit(limit)
      .offset(offset);

    // Zod parsing only the base asset parts, passing through noteName
    return data.map(row => {
      const asset = selectAssetSchema.parse({
        id: row.id,
        noteId: row.noteId,
        name: row.name,
        mimeType: row.mimeType,
        size: row.size,
        createdAt: row.createdAt,
      });
      return {
        ...asset,
        noteName: row.noteName,
      };
    });
  } catch (error) {
    console.error("Failed to fetch assets:", error);
    throw new Error("Failed to fetch assets");
  }
}
