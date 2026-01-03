# Integration Testing Checklist

## Prerequisites
- [ ] PostgreSQL running via Docker
- [ ] Backend started on port 3001
- [ ] Frontend started on port 3000
- [ ] Test project created with API key

## Backend Tests

```bash
cd apps/backend
pnpm test:e2e
```

Expected results:
- [ ] All project CRUD tests pass
- [ ] All lock tests pass
- [ ] All hook API tests pass
- [ ] API key authentication works

## Frontend Tests

```bash
cd apps/frontend
pnpm test
```

Expected results:
- [ ] ProjectCard renders correctly
- [ ] LockStatus shows correct state
- [ ] Hook tests pass

## Manual Integration Tests

### 1. Project Lifecycle
- [ ] Create project from dashboard
- [ ] View project in list
- [ ] Open editor for project
- [ ] Update project settings
- [ ] Delete project

### 2. Lock Mechanism
- [ ] Lock acquired when opening editor
- [ ] Lock displayed in dashboard
- [ ] Lock banner shows for locked projects
- [ ] Lock released when closing editor
- [ ] WebSocket broadcasts lock events

### 3. Docs Management
- [ ] Sync docs from GitHub
- [ ] Edit doc in Monaco editor
- [ ] Save doc (Ctrl+S)
- [ ] Push doc to GitHub
- [ ] Preview updates in real-time

### 4. Hook Integration
- [ ] check-platform.sh detects lock
- [ ] check-platform.sh syncs docs
- [ ] protect-docs.sh blocks .docs/ writes
- [ ] Offline mode uses cached docs

### 5. WebSocket Real-time
- [ ] Connection established on page load
- [ ] Lock events received by other clients
- [ ] Reconnection after disconnect

## E2E Flow Test

1. Start fresh database
2. Create project via API
3. Generate API key
4. Run check-platform.sh (should sync)
5. Open editor (lock acquired)
6. Run check-platform.sh in another terminal (should fail - locked)
7. Close editor (lock released)
8. Run check-platform.sh again (should succeed)

## Performance Checks

- [ ] Projects list loads < 1s
- [ ] Editor loads < 2s
- [ ] Lock check API < 200ms
- [ ] WebSocket reconnects within 5s

---

## Test Coverage Goals

| Area | Target |
|------|--------|
| Backend Controllers | 80% |
| Backend Services | 70% |
| Frontend Components | 60% |
| Frontend Hooks | 50% |
| E2E Critical Paths | 100% |

---

## Known Limitations

1. **GitHub API mocking**: Tests skip actual GitHub calls
2. **WebSocket testing**: Manual verification recommended
3. **Hook scripts**: Require real Platform connection for full test

## Future Test Additions

- [ ] Playwright E2E tests
- [ ] Load testing for WebSocket
- [ ] Security penetration testing
- [ ] Accessibility testing (a11y)
