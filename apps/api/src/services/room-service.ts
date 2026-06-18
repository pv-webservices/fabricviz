import { Pool } from 'pg';
import type { CreateRoomInput, UpdateRoomInput, RoomQueryInput } from '../validators/room-validators';

export interface RoomRow {
  id: string;
  name: string;
  image_url: string;
  thumbnail_url: string | null;
  end_use: string;
  display_order: number;
  active: boolean;
  created_at: Date;
}

export async function listRooms(
  db: Pool,
  filters: RoomQueryInput,
): Promise<{ items: RoomRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.endUse) {
    conditions.push(`(end_use = $${idx} OR end_use = 'both')`);
    params.push(filters.endUse);
    idx++;
  }
  if (filters.active !== undefined) {
    conditions.push(`active = $${idx++}`);
    params.push(filters.active);
  }
  if (filters.search) {
    conditions.push(`name ILIKE $${idx++}`);
    params.push(`%${filters.search}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM predefined_rooms ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const offset = (filters.page - 1) * filters.limit;
  const rows = await db.query<RoomRow>(
    `SELECT * FROM predefined_rooms ${where} ORDER BY display_order ASC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, offset],
  );

  return { items: rows.rows, total };
}

export async function getRoomById(
  db: Pool,
  id: string,
): Promise<RoomRow | null> {
  const result = await db.query<RoomRow>(
    `SELECT * FROM predefined_rooms WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createRoom(
  db: Pool,
  data: CreateRoomInput,
): Promise<RoomRow> {
  const result = await db.query<RoomRow>(
    `INSERT INTO predefined_rooms (name, image_url, thumbnail_url, end_use, display_order, active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.name,
      data.imageUrl,
      data.thumbnailUrl ?? null,
      data.endUse,
      data.displayOrder,
      data.active,
    ],
  );
  return result.rows[0];
}

export async function updateRoom(
  db: Pool,
  id: string,
  data: UpdateRoomInput,
): Promise<RoomRow | null> {
  const fieldMap: Record<string, { column: string; value: unknown }> = {
    name: { column: 'name', value: data.name },
    imageUrl: { column: 'image_url', value: data.imageUrl },
    thumbnailUrl: { column: 'thumbnail_url', value: data.thumbnailUrl },
    endUse: { column: 'end_use', value: data.endUse },
    displayOrder: { column: 'display_order', value: data.displayOrder },
    active: { column: 'active', value: data.active },
  };

  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  for (const [key, mapping] of Object.entries(fieldMap)) {
    if (key in data && data[key as keyof UpdateRoomInput] !== undefined) {
      setClauses.push(`${mapping.column} = $${idx++}`);
      params.push(mapping.value);
    }
  }

  if (setClauses.length === 0) return getRoomById(db, id);

  params.push(id);

  const result = await db.query<RoomRow>(
    `UPDATE predefined_rooms SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    params,
  );
  return result.rows[0] ?? null;
}

export async function deleteRoom(
  db: Pool,
  id: string,
): Promise<boolean> {
  const result = await db.query(
    `UPDATE predefined_rooms SET active = false WHERE id = $1`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}
