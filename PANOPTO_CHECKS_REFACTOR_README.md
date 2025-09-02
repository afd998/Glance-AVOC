# Panopto Checks Refactor: JSONB Array → Relational Table

## Overview

This refactor migrates the `panopto_checks` field from a JSONB boolean array in the `events` table to a dedicated `panopto_checks` table. This provides better data integrity, performance, and analytics capabilities.

## Current Structure (JSONB Array)
```sql
-- events.panopto_checks: Json (boolean[])
-- Example: [true, false, true, false, null, null]
```

## New Structure (Relational Table)
```sql
CREATE TABLE panopto_checks (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id),
    check_time TIME NOT NULL,
    completed_time TIME NULL,
    completed_by_user_id UUID NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Benefits of the New Structure

### 1. **Better Data Integrity**
- Foreign key constraints ensure data consistency
- Prevents orphaned records
- Proper NULL handling for incomplete checks

### 2. **Enhanced Analytics**
- Track who completed each check
- Historical completion data
- Better reporting and metrics
- User productivity tracking

### 3. **Improved Performance**
- Efficient queries for specific checks
- Better indexing capabilities
- Faster aggregation queries
- Reduced memory usage for large arrays

### 4. **Flexible Schema**
- Easy to add new fields (completion notes, timestamps, etc.)
- Support for different check types
- Future extensibility

### 5. **Better Security**
- Row Level Security (RLS) policies
- Granular access control
- Audit trail capabilities

## Migration Process

### Step 1: Create the New Table
Run the migration script:
```bash
psql -f supabase_migration_panopto_checks.sql
```

### Step 2: Migrate Existing Data
Run the data migration script (only for today's events to avoid conflicts):
```bash
psql -f migrate_existing_panopto_checks.sql
```

### Step 3: Update Application Code
1. Update hooks to use new table queries
2. Update UI components to work with new data structure
3. Update TypeScript types

### Step 4: Verify and Clean Up
1. Test all functionality with new structure
2. Add comment to old column: `COMMENT ON COLUMN events.panopto_checks IS 'DEPRECATED: Use panopto_checks table instead';`
3. Eventually drop the old column: `ALTER TABLE events DROP COLUMN panopto_checks;`

## Key Differences in Usage

### Old Approach (JSONB Array)
```typescript
// Check if check #3 is completed
const checks = event.panopto_checks as boolean[];
const isCompleted = checks[2]; // true/false

// Complete check #3
checks[2] = true;
await supabase.from('events').update({ panopto_checks: checks });
```

### New Approach (Relational Table)
```typescript
// Check if check at 10:30 is completed
const { data } = await supabase
  .from('panopto_checks')
  .select('completed_time')
  .eq('event_id', eventId)
  .eq('check_time', '10:30:00')
  .single();

const isCompleted = data?.completed_time !== null;

// Complete check at 10:30
await supabase
  .from('panopto_checks')
  .update({
    completed_time: new Date().toTimeString().split(' ')[0],
    completed_by_user_id: user.id
  })
  .eq('event_id', eventId)
  .eq('check_time', '10:30:00');
```

## Common Query Patterns

### Get all checks for an event
```sql
SELECT * FROM panopto_checks
WHERE event_id = :event_id
ORDER BY check_time;
```

### Get completion status
```sql
SELECT
    COUNT(*) as total_checks,
    COUNT(completed_time) as completed_checks,
    COUNT(*) - COUNT(completed_time) as pending_checks
FROM panopto_checks
WHERE event_id = :event_id;
```

### Get user's completed checks today
```sql
SELECT pc.*, e.event_name
FROM panopto_checks pc
JOIN events e ON pc.event_id = e.id
WHERE pc.completed_by_user_id = :user_id
AND pc.completed_time IS NOT NULL
AND e.date = CURRENT_DATE;
```

## Files Created/Modified

### New Files:
- `supabase_migration_panopto_checks.sql` - Table creation and setup
- `migrate_existing_panopto_checks.sql` - Data migration script
- `panopto_checks_queries.sql` - Common query examples
- `src/types/panoptoChecks.ts` - TypeScript types for new structure

### Modified Files:
- `src/types/supabase.ts` - Added panopto_checks table to Database type

## Rollback Plan

If issues arise, you can rollback by:
1. Keep the old `panopto_checks` JSONB column
2. Switch back to using the old hook functions
3. Drop the new table: `DROP TABLE panopto_checks;`

## Future Enhancements

With the new structure, you can easily add:
- Check completion notes
- Automatic check scheduling
- Check reminder notifications
- Performance analytics
- Check type categories (required vs optional)
- Bulk check operations

## Testing Checklist

- [ ] All existing checks migrate correctly
- [ ] UI displays checks properly
- [ ] Completing checks works
- [ ] Notifications still trigger
- [ ] Performance is improved
- [ ] Analytics queries work
- [ ] RLS policies are enforced
- [ ] No orphaned records exist
