import 'dotenv/config';
import { Pool } from 'pg';
import { deleteHistoryItem } from './src/services/history-service';
import { writeAuditLog } from './src/lib/audit';

const p = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const id = 'a5110b7e-2011-4df1-bd22-66fb1d636c0b';
    await deleteHistoryItem(p, id);
    await writeAuditLog(p, {
      userId: undefined,
      action: 'visualization_deleted',
      entityType: 'visualization',
      entityId: id,
      ipAddress: '127.0.0.1'
    });
    console.log("Success!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    p.end();
  }
}
run();
