// frontend/utils/db.js
import Dexie from "dexie";

// Create a new local database instance
export const db = new Dexie("ChapelAttendanceDB");

// Define the database schema (tables and indexed columns)
db.version(1).stores({
  // ++id means it will auto-increment a primary key for us
  unsynced_scans: "++id, matric_number, scan_type, timestamp",
});

// v2 adds the compound index used by the local duplicate-scan lookup.
db.version(2).stores({
  unsynced_scans:
    "++id, matric_number, scan_type, timestamp, eventId, [matric_number+scan_type+eventId]",
});
