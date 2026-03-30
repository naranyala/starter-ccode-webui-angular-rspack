# Refactoring Roadmap 2026

**Based on:** Comprehensive Abstraction Audit Report  
**Created:** March 30, 2026  
**Time Horizon:** 12 months  
**Total Estimated Effort:** 160 hours (~4 weeks)

---

## Executive Summary

This roadmap prioritizes refactoring efforts based on the abstraction audit findings. Items are organized by priority and estimated effort.

### Priority Matrix

```
                    Urgent
                      │
         ┌────────────┼────────────┐
         │  P0: Fix   │  P1: High  │
         │  Now       │  Value     │
         │            │            │
    ─────┼────────────┼────────────┼───── Impact
         │            │            │
         │  P2: Medium│  P3: Low   │
         │  Priority  │  Priority  │
         │            │            │
         └────────────┼────────────┘
                      │
                  Not Urgent
```

---

## Phase 0: Critical Fixes (Week 1)

### P0-1: Standardize Error Handling

**Priority:** P0 (Critical)  
**Effort:** 16 hours  
**Impact:** High - Reduces bugs, improves debugging  
**Risk:** Low

**Current State:**
```c
// Inconsistent patterns across services
ServiceResult result = logger_init(...);  // ServiceResult
int result = sqlite_open(...);            // int 0/1
char* result = file_read_text(...);       // NULL on error
void event_emit(...);                      // No error return
```

**Target State:**
```c
// All services use ServiceResult
ServiceResult result = logger_init(...);
ServiceResult result = sqlite_open(...);
ServiceResult result = file_read_text(...);
ServiceResult result = event_emit(...);
```

**Tasks:**
- [ ] Update EventService to return ServiceResult
- [ ] Update FileService to return ServiceResult
- [ ] Update SQLiteService to use ServiceResult consistently
- [ ] Update DuckDBService to match SQLite patterns
- [ ] Update all callers to handle ServiceResult
- [ ] Add tests for error paths

**Files Modified:** ~15 header files, ~15 implementation files

---

### P0-2: Document Memory Ownership

**Priority:** P0 (Critical)  
**Effort:** 8 hours  
**Impact:** High - Prevents memory leaks  
**Risk:** None

**Current State:**
```c
// Unclear who should free
char* file_read_text(FileService* self, const char* path);
// Caller must free? Or internal?

JsonValue* json_create_object(void);
// When to call json_free?
```

**Target State:**
```c
/**
 * @brief Read entire file contents
 * @param self FileService instance
 * @param path Path to file
 * @return Allocated string - CALLER MUST FREE
 * @retval NULL on error
 */
char* file_read_text(FileService* self, const char* path);

/**
 * @brief Create JSON object
 * @return Allocated JsonValue - CALLER MUST CALL json_free()
 */
JsonValue* json_create_object(void);
```

**Tasks:**
- [ ] Audit all functions returning pointers
- [ ] Add `@returns` documentation with ownership
- [ ] Add `@note` for special cases
- [ ] Create memory management guide in docs

**Files Modified:** ~10 header files

---

### P0-3: Fix Direct Instantiation

**Priority:** P0 (Critical)  
**Effort:** 4 hours  
**Impact:** High - Testability, consistency  
**Risk:** Low

**Current State:**
```typescript
// frontend/src/core/webui/winbox.service.ts
export class WinBoxService {
  private readonly logger = new LoggerService(); // ❌ Direct instantiation
}
```

**Target State:**
```typescript
export class WinBoxService {
  private readonly logger = inject(LoggerService); // ✅ DI
}
```

**Tasks:**
- [ ] Update WinBoxService to use inject()
- [ ] Verify no other direct instantiations
- [ ] Add linting rule to prevent future occurrences

**Files Modified:** 1 file

---

### P0-4: Remove Unused Dependencies

**Priority:** P0 (High)  
**Effort:** 2 hours  
**Impact:** Medium - Bundle size, clarity  
**Risk:** None

**Current State:**
```typescript
// frontend/src/core/http.service.ts
export class HttpService {
  private readonly storage = inject(StorageService); // ❌ Never used
}
```

**Target State:**
```typescript
export class HttpService {
  // No unused dependencies
}
```

**Tasks:**
- [ ] Remove StorageService from HttpService
- [ ] Run tests to verify no breakage
- [ ] Update any documentation

**Files Modified:** 1 file

---

## Phase 1: High Value (Week 2-3)

### P1-1: Extract Magic Numbers

**Priority:** P1 (High)  
**Effort:** 12 hours  
**Impact:** Medium - Maintainability  
**Risk:** Low

**Current State:**
```c
#define EVENT_MAX_HANDLERS 32
#define EVENT_MAX_NAME 64
#define EVENT_MAX_PAYLOAD 1024

char message[4096];  // Hardcoded in implementation
char old_path[1024]; // Hardcoded in implementation
```

**Target State:**
```c
/* constants.h */
#define MAX_EVENT_HANDLERS 32
#define MAX_EVENT_NAME_LENGTH 64
#define MAX_EVENT_PAYLOAD_SIZE 1024
#define MAX_LOG_MESSAGE_SIZE 4096
#define MAX_FILE_PATH_SIZE 1024
#define DEFAULT_BUFFER_SIZE 4096
```

**Tasks:**
- [ ] Create src/constants.h with all named constants
- [ ] Replace magic numbers in all services
- [ ] Add documentation for each constant
- [ ] Review buffer sizes for security

**Files Modified:** ~20 files

---

### P1-2: Split CommunicationService

**Priority:** P1 (High)  
**Effort:** 20 hours  
**Impact:** High - Maintainability, testability  
**Risk:** Medium

**Current State:**
```typescript
// One service with 5 responsibilities
export class CommunicationService {
  call();           // WebUI bridge
  subscribe();      // Event bus
  publish();        // Event bus
  getState();       // Shared state
  setState();       // Shared state
  enqueue();        // Message queue
  dequeue();        // Message queue
  broadcast();      // Broadcast channel
}
```

**Target State:**
```typescript
export class WebUIBridgeService {
  call();
  callWithResponse();
}

export class EventBusService {
  subscribe();
  publish();
  emit();
}

export class StateSyncService {
  getState();
  setState();
  sync();
}

export class MessageQueueService {
  enqueue();
  dequeue();
  processQueue();
}
```

**Tasks:**
- [ ] Create WebUIBridgeService (extract WebUI methods)
- [ ] Create EventBusService (extract pub/sub methods)
- [ ] Create StateSyncService (extract state methods)
- [ ] Create MessageQueueService (extract queue methods)
- [ ] Update all consumers
- [ ] Add tests for each service
- [ ] Update documentation

**Files Created:** 4 new service files  
**Files Modified:** ~10 consumer files

---

### P1-3: Complete DevToolsService

**Priority:** P1 (Medium)  
**Effort:** 8 hours  
**Impact:** Medium - Developer experience  
**Risk:** Low

**Current State:**
```typescript
recordMetric(): void {
  // Mock implementation
}

reportError(): void {
  // Mock implementation
}

getMetrics(): Record<string, number> {
  return {}; // Mock
}
```

**Target State:**
```typescript
recordMetric(name: string, value: number): void {
  this.metrics.update(m => ({ ...m, [name]: value }));
  this.storage.set(`metric:${name}`, value);
}

reportError(error: Error): void {
  this.errors.update(e => [...e, { error, timestamp: Date.now() }]);
  this.logger.error('DevTools captured error', error);
}
```

**Tasks:**
- [ ] Implement metric recording with storage
- [ ] Implement error reporting
- [ ] Add metric retrieval methods
- [ ] Add error history methods
- [ ] Create dev tools UI panel
- [ ] Add tests

**Files Modified:** 1 service file, 1 component file

---

### P1-4: Migrate DataTableComponent to Signals

**Priority:** P1 (Medium)  
**Effort:** 8 hours  
**Impact:** Medium - Consistency, reactivity  
**Risk:** Low

**Current State:**
```typescript
export class DataTableComponent {
  filteredItems: any[] = [];      // ❌ Property
  searchQuery: string = '';       // ❌ Property
  showModal: boolean = false;     // ❌ Property
  // ...
}
```

**Target State:**
```typescript
export class DataTableComponent {
  readonly filteredItems = signal<any[]>([]);    // ✅ Signal
  readonly searchQuery = signal<string>('');     // ✅ Signal
  readonly showModal = signal<boolean>(false);   // ✅ Signal
  // ...
}
```

**Tasks:**
- [ ] Convert all properties to signals
- [ ] Update template to use signal syntax
- [ ] Add computed signals for derived state
- [ ] Test reactivity
- [ ] Update documentation

**Files Modified:** 1 component file

---

## Phase 2: Medium Priority (Month 2-3)

### P2-1: Create Wrapper Types for Prepared Statements

**Priority:** P2 (Medium)  
**Effort:** 16 hours  
**Impact:** Medium - Abstraction quality  
**Risk:** Medium

**Current State:**
```c
// Exposing sqlite3_stmt* directly
sqlite3_stmt* sqlite_prepare(SQLiteService* self, const char* sql);
int sqlite_bind_int(sqlite3_stmt* stmt, int index, int value);
```

**Target State:**
```c
// Opaque wrapper type
typedef struct PreparedStatement PreparedStatement;

PreparedStatement* sqlite_prepare(SQLiteService* self, const char* sql);
int sqlite_bind_int(PreparedStatement* stmt, int index, int value);
void sqlite_finalize(PreparedStatement* stmt);
```

**Tasks:**
- [ ] Create PreparedStatement wrapper struct
- [ ] Update all prepared statement functions
- [ ] Add error handling to wrapper
- [ ] Update documentation
- [ ] Add tests
- [ ] Repeat for DuckDB prepared statements

**Files Modified:** ~6 files

---

### P2-2: Extract Child Components

**Priority:** P2 (Medium)  
**Effort:** 24 hours  
**Impact:** Medium - Maintainability  
**Risk:** Low

**Current State:**
```typescript
// DashboardComponent - 700+ lines
@Component({
  selector: 'app-dashboard',
  template: `
    <!-- Complex template with multiple sections -->
    <aside class="panel-first">...</aside>
    <main class="panel-second">...</main>
    <nav class="mobile-nav">...</nav>
  `
})
```

**Target State:**
```typescript
// DashboardComponent - 200 lines
@Component({
  selector: 'app-dashboard',
  template: `
    <app-dashboard-sidebar [menus]="menus()" />
    <app-dashboard-content [activeView]="activeView()" />
    <app-dashboard-mobile-nav [menus]="menus()" />
  `
})

// New child components
@Component({ selector: 'app-dashboard-sidebar', ... })
@Component({ selector: 'app-dashboard-content', ... })
@Component({ selector: 'app-dashboard-mobile-nav', ... })
```

**Tasks:**
- [ ] Extract DashboardSidebarComponent
- [ ] Extract DashboardContentComponent
- [ ] Extract DashboardMobileNavComponent
- [ ] Extract StatsCardComponent (reusable)
- [ ] Extract DataTableComponent (from CRUD views)
- [ ] Update parent components
- [ ] Add tests for child components

**Files Created:** ~6 new component files  
**Files Modified:** ~5 existing files

---

### P2-3: Add API Versioning

**Priority:** P2 (Medium)  
**Effort:** 12 hours  
**Impact:** Medium - Future compatibility  
**Risk:** Low

**Current State:**
```typescript
// No version negotiation
api.call('getUsers', []);
```

**Target State:**
```typescript
// Version in request
api.call('v1/getUsers', []);

// Version negotiation
const serverVersion = await api.getVersion();
if (serverVersion.major < 1) {
  // Fallback to legacy API
}
```

**Tasks:**
- [ ] Add version field to API responses
- [ ] Create version negotiation endpoint
- [ ] Add version prefix to all API calls
- [ ] Create API version compatibility matrix
- [ ] Add deprecation warnings
- [ ] Document versioning strategy

**Files Modified:** ~5 files

---

### P2-4: Expand Documentation

**Priority:** P2 (Low-Medium)  
**Effort:** 16 hours  
**Impact:** Medium - Onboarding  
**Risk:** None

**Tasks:**
- [ ] Document all integration layer services
- [ ] Add usage examples to all headers
- [ ] Create architecture decision records (ADRs)
- [ ] Document common patterns
- [ ] Create troubleshooting guide
- [ ] Add inline comments for complex logic

**Files Created:** ~5 documentation files  
**Files Modified:** ~10 header files

---

## Phase 3: Long-term (Quarter 2-4)

### P3-1: Implement Connection Pooling

**Priority:** P3 (Low)  
**Effort:** 40 hours  
**Impact:** High - Performance  
**Risk:** High

**Description:** Implement connection pooling for database services to improve concurrent access performance.

**Tasks:**
- [ ] Design connection pool interface
- [ ] Implement pool manager
- [ ] Add connection borrowing/returning
- [ ] Add pool metrics
- [ ] Add tests for concurrent access
- [ ] Benchmark performance

---

### P3-2: Advanced Query Builder

**Priority:** P3 (Low)  
**Effort:** 32 hours  
**Impact:** Medium - Developer experience  
**Risk:** Medium

**Description:** Expand SQL query builder with JOIN support, subqueries, and query optimization.

---

### P3-3: Performance Monitoring

**Priority:** P3 (Low)  
**Effort:** 24 hours  
**Impact:** Medium - Observability  
**Risk:** Low

**Description:** Add telemetry and performance monitoring throughout the stack.

---

## Summary

### Effort by Phase

| Phase | Duration | Hours | Deliverables |
|-------|----------|-------|--------------|
| P0: Critical | Week 1 | 30h | 4 fixes |
| P1: High Value | Week 2-3 | 48h | 4 improvements |
| P2: Medium | Month 2-3 | 68h | 4 enhancements |
| P3: Long-term | Quarter 2-4 | 96h | 3 advanced features |
| **Total** | **12 months** | **242h** | **15 initiatives** |

### ROI Analysis

| Initiative | Effort | Impact | ROI |
|------------|--------|--------|-----|
| Standardize Error Handling | 16h | High | ⭐⭐⭐⭐⭐ |
| Document Memory Ownership | 8h | High | ⭐⭐⭐⭐⭐ |
| Fix Direct Instantiation | 4h | High | ⭐⭐⭐⭐⭐ |
| Split CommunicationService | 20h | High | ⭐⭐⭐⭐ |
| Extract Magic Numbers | 12h | Medium | ⭐⭐⭐⭐ |
| Migrate to Signals | 8h | Medium | ⭐⭐⭐⭐ |
| Extract Child Components | 24h | Medium | ⭐⭐⭐ |

### Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Abstraction Quality Score | 77% | 85% | Quarterly audit |
| Memory Leaks | Occasional | Zero | Crash reports |
| Test Coverage | 60% | 80% | CI reports |
| Documentation Coverage | 65% | 90% | Doc audit |
| Build Time | Current | -10% | Build logs |

---

## Getting Started

### Week 1 Checklist

- [ ] Set up development environment
- [ ] Create feature branch `refactor/2026-q1`
- [ ] Run existing tests to establish baseline
- [ ] Start with P0-3 (easiest win)
- [ ] Complete P0-2 (documentation)
- [ ] Begin P0-1 (error handling)
- [ ] Complete P0-4 (unused deps)
- [ ] Run full test suite
- [ ] Create PR for review

### Monthly Review

At the end of each month:
1. Review completed items
2. Adjust priorities based on learnings
3. Update effort estimates
4. Demo improvements to team
5. Plan next month's work

---

**Last Updated:** March 30, 2026  
**Next Review:** April 30, 2026  
**Owner:** Development Team
