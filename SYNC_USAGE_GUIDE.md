# Database Sync Usage Guide - Avoiding Unexpected Writes

## 🐛 Issues Fixed

The database sync system had several critical issues causing unpredictable behavior and unexpected writes during data loading:

### 1. Automatic Sync on Component Mount

**Problem**: Every time `useDatabaseSync` was mounted, it automatically triggered a full sync after 3 seconds, causing unexpected writes during data loading.

**Fix**: Removed automatic sync on mount. Sync now only occurs:

- When explicitly triggered via `startInitialSync()`
- When coming back online after being offline

### 2. Sync During Data Loading

**Problem**: Sync operations could run while loading data, causing race conditions and unexpected writes.

**Fix**: Added data loading state management that prevents sync during loading operations.

### 3. Complex Circular Dependency Handling

**Problem**: The complex logic for handling `training_plans` and `training_models` circular dependencies was causing temporary NULL writes and updates.

**Fix**: Simplified the circular dependency handling to use standard sync for both tables.

### 4. Double Sync System Conflicts

**Problem**: Both table-level sync (`useDatabaseSync`) and record-level sync (`useRecordSync`) could operate on the same data simultaneously.

**Fix**: Added coordination between sync systems and proper loading state management.

## 🔧 New Usage Patterns

### For Data Loading (Read Operations)

**❌ OLD - Problematic:**

```typescript
// This could trigger unexpected sync/writes
const plans = await getTrainingPlansWithModels(userId);
```

**✅ NEW - Safe:**

```typescript
import { useSafeDataLoading } from "./hooks/useSafeDataLoading";

function MyComponent() {
  const { loadTrainingPlansWithModels, loadTrainingModels } =
    useSafeDataLoading();

  const loadData = async () => {
    // These prevent sync during loading
    const plans = await loadTrainingPlansWithModels(userId);
    const models = await loadTrainingModels();
  };
}
```

### For Manual Sync Control

**✅ NEW - Explicit Control:**

```typescript
import { useDatabaseSync } from "./hooks/useDatabaseSync";

function MyComponent() {
  const { startInitialSync, syncStatus, loading } = useDatabaseSync();

  const handleSyncClick = async () => {
    await startInitialSync(true); // force = true for full sync
  };

  // Only sync when user explicitly requests it
  return (
    <button onClick={handleSyncClick} disabled={loading}>
      {loading ? "Syncing..." : "Sync Data"}
    </button>
  );
}
```

### For Data Updates (Write Operations)

**✅ Use Record-Level Sync for Updates:**

```typescript
import { useTrainingPlanSync } from "./hooks/useTrainingPlanSync";

function MyComponent() {
  const { updatePlanWeeks, createSession } = useTrainingPlanSync();

  const handleUpdateWeeks = async (planId: string, weeks: number) => {
    // This safely updates locally and queues for remote sync
    await updatePlanWeeks(planId, weeks);
  };
}
```

### For Custom Loading Operations

**✅ Wrap Custom Operations:**

```typescript
import { useSafeDataLoading } from "./hooks/useSafeDataLoading";

function MyComponent() {
  const { safeLoad } = useSafeDataLoading();

  const loadCustomData = async () => {
    return safeLoad(async () => {
      // Any database read operations here
      // Sync will be prevented during this operation
      const data = await myCustomDataLoader();
      return data;
    });
  };
}
```

## 🔄 Migration Guide

### Step 1: Update Data Loading

Replace direct calls to `getTrainingPlans`, `getTrainingModels`, etc. with safe loading functions:

```typescript
// Before
const plans = await getTrainingPlansWithModels(userId);

// After
const { loadTrainingPlansWithModels } = useSafeDataLoading();
const plans = await loadTrainingPlansWithModels(userId);
```

### Step 2: Control Initial Sync

Instead of relying on automatic sync, explicitly control when sync happens:

```typescript
// Before - sync happened automatically
useEffect(() => {
  loadData(); // This could cause unexpected writes
}, []);

// After - explicit control
const { startInitialSync } = useDatabaseSync();
const { loadTrainingPlansWithModels } = useSafeDataLoading();

useEffect(() => {
  const initializeApp = async () => {
    // 1. Load data safely (no sync during loading)
    await loadData();

    // 2. Then sync if needed (user choice or app logic)
    if (shouldSync) {
      await startInitialSync();
    }
  };

  initializeApp();
}, []);
```

### Step 3: Use Appropriate Sync for Updates

For data modifications, use the record-level sync functions:

```typescript
// Before - might trigger full table sync
await updateTrainingPlanMetadata(planId, { nOfWeeks: weeks });
await syncTrainingPlans(); // Syncs 9-10 tables!

// After - queues specific record for sync
const { updatePlanWeeks } = useTrainingPlanSync();
await updatePlanWeeks(planId, weeks); // Only syncs this record
```

## 🎯 Best Practices

### 1. Separate Read and Write Operations

- Use `useSafeDataLoading` for reading data
- Use `useTrainingPlanSync` for modifying data
- Use `useDatabaseSync.startInitialSync()` for explicit full syncs

### 2. Loading State Management

```typescript
const { startDataLoading, endDataLoading } = useSafeDataLoading();

const customOperation = async () => {
  startDataLoading(); // Prevents sync during operation
  try {
    // Your data loading logic
  } finally {
    endDataLoading(); // Re-enables sync
  }
};
```

### 3. Error Handling

```typescript
const { safeLoad } = useSafeDataLoading();

try {
  const data = await safeLoad(async () => {
    // Loading operation that might fail
    return await riskyDataLoad();
  });
} catch (error) {
  // safeLoad ensures sync is re-enabled even if operation fails
  console.error("Load failed:", error);
}
```

### 4. Monitoring Sync State

```typescript
const { syncStatus, loading, error } = useDatabaseSync();

// Display sync status to user
if (loading) return <div>Syncing...</div>;
if (error) return <div>Sync error: {error}</div>;
if (syncStatus === "success") return <div>Data up to date</div>;
```

## 🔍 Debugging

### Enable Sync Logging

The fixed system includes comprehensive logging. Look for these log patterns:

```
📖 Loading training plans for user 123 (read-only operation)  // Safe loading
🔄 Data loading state: START                                   // Sync prevention active
🔄 Data loading state: END                                     // Sync prevention lifted
⚠️ Skipping sync - data loading in progress                   // Sync properly blocked
🚀 Manually starting initial sync...                          // Explicit sync trigger
```

### Check Sync State

```typescript
const { getCurrentSyncMetadata, resetSyncMetadata } = useDatabaseSync();

// Debug sync metadata
console.log("Current sync state:", getCurrentSyncMetadata());

// Reset if needed (forces full sync next time)
resetSyncMetadata();
```

This guide should eliminate the unpredictable behavior and unexpected writes you were experiencing. The key is using the right tool for each operation: safe loading for reads, record sync for writes, and explicit control for full syncs.
