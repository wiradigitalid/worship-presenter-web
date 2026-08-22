# Brief — two small fixes found while verifying W5

Both were found by me while verifying stories 5-1 and 5-2. Neither is a defect in
what you built; both are gaps I can name precisely.

## Fix 1 — SSE will not survive nginx without one header

`internal/httpapi/remote.go` sets `Content-Type: text/event-stream`,
`Cache-Control` and `Connection` on the stream, and it is missing
**`X-Accel-Buffering: no`**.

The dev deployment runs behind nginx, which **buffers proxied responses by
default**. Without that header every event sits in a buffer instead of reaching
the phone, so the feature works on a laptop and appears broken the moment it is
deployed. The header is the standard fix and it belongs in our code rather than in
an nginx config file that lives in a different repository — a feature whose
correctness depends on a file we do not ship is a feature that breaks when
somebody else edits that file.

Add the header where the other three are set. One line, plus a comment saying why
it is there so nobody tidies it away.

The read timeout is already handled and needs nothing: the stream's ticker fires
at `StreamFreshnessWindow / 2` and flushes, which keeps nginx's 120-second
`proxy_read_timeout` from ever firing on an idle stream.

## Fix 2 — the AD-29 guard misses the shape somebody would actually write

`tests/remote-presenting-client.test.mjs` AC-5 scans the `LivenessEvent` union in
`src/lib/projector-liveness.ts` and asserts no variant matches `/remote/i`, with
the union pinned in both directions. That is a good guard and it stays.

It does not catch the violation that matters more. I injected this into
`src/operator/present/PresenterOperator.tsx` and the whole suite stayed green:

```
dispatchLiveness({ type: 'ack' });
if (remoteConnected) dispatchLiveness({ type: 'ack' });
```

The union is untouched, so the existing guard cannot see it. Nobody would name an
event `remote-ack`; somebody might well write that second line while making a
reconnect feel responsive. AD-29 is explicit that a remote's silence must not move
the projector's verdict, and this is how it would.

Add a guard asserting that **no `dispatchLiveness` call site in
`PresenterOperator.tsx` is conditioned on remote state**. Parse it rather than
regex-matching a single spelling if you can — the point is the condition, not the
identifier `remoteConnected`, and a guard that only catches that one name is a
guard against one typo.

Prove it: write that exact injected line, watch the new guard fail, then revert.
The existing AC-5 must still pass unchanged, and the three AC-6 proofs must still
pass — I verified AC-6 against the real file and it has teeth, so do not disturb
it.

## Constraints

- Do not edit anything under `.what/`, `.how/`, or any `DEC-` file.
- Do not weaken or delete an existing guard.
- Do not touch `src/lib/present-channel.ts`, `src/projected/`, or
  `spa/src/projected/`.
- Register any new test file in `package.json` `scripts.test` in the same change
  set — that list does not glob.
- Run `npm test`, `npm run typecheck`, `npm run spa:build`, `go build ./...`,
  `go vet ./...`, `go test ./...` and report failures with their output.
