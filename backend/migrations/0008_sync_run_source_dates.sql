-- Full cadastral snapshots need not have a declared reference period.
ALTER TABLE source_sync_runs ALTER COLUMN requested_start DROP NOT NULL;
ALTER TABLE source_sync_runs ALTER COLUMN requested_end DROP NOT NULL;
