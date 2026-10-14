# ADR 0015: Realtime updates

- **Status:** Proposed (not implemented, 2026-10-14)

## Context

`socket.io-client` is a dependency, and `AppShell`'s header comment lists a
"WebSocket / realtime provider" as planned. There are currently **no imports of
`socket.io-client`** in `src/`.

## Proposed decision

- Realtime connections are owned by **one provider mounted in `AppShell`**
  (ADR 0005), created only after the session is authenticated.
- Modules subscribe to events through that provider, not by opening their own
  sockets.

## Consequences if adopted

- One authenticated connection per session; modules stay unaware of transport.
- The socket must use the same token lifecycle as HTTP (ADR 0007), including
  reconnecting after a refresh.

## Open questions

- Which events need realtime (focus session sync? cross-device task changes)?
- Does the backend expose a gateway yet?
- If not needed soon, remove the unused dependency.
