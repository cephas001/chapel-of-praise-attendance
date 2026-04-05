// frontend/utils/db.js
import Dexie from "dexie";

// Create a new local database instance
export const db = new Dexie("ChapelAttendanceDB");

// Define the database schema (tables and indexed columns)
db.version(1).stores({
  // ++id means it will auto-increment a primary key for us
  unsynced_scans: "++id, matric_number, scan_type, timestamp",
});
