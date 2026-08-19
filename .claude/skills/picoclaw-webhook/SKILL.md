---
name: picoclaw-webhook
description: Post Telegram rundowns to BIC PPTX /api/webhook with WEBHOOK_SECRET and read back resolvedHymns / failedHymnNumbers for chat confirmation.
---

# picoclaw webhook intake

## When to use

Events Department pasted a Sabbath rundown in Telegram. Create/update the Service and confirm hymn titles in chat.

Telegram never overwrites a Service that already exists for that date. Intake that would clobber the hub is refused with HTTP 409 and the hub's current content. A correction is a separate call that carries the hub's `updated_at` token.

## Steps

1. Ensure `WEBHOOK_SECRET` matches the app env.
2. `POST /api/webhook` with JSON body `{ "text": "<rundown>" }` and header `x-webhook-secret: <secret>` (or `Authorization: Bearer <secret>`).
3. On **201**, the Service was created. Read:
   - `resolvedHymns`: `[{ number, title }, ...]` — use for Telegram readback
   - `failedHymnNumbers`: numbers that did not resolve in the hymnal — report these clearly
4. On **409**, a Service already exists for that date. The body carries the hub's current `id`, `date`, `raw_payload`, `parsed_data`, and `updated_at`. Show that current content in chat. Do not retry the same intake POST. To overwrite, `POST /api/webhook` with `{ "action": "correct", "serviceId": <id>, "text": "<rundown>", "updated_at": "<token from the 409>" }`. A stale token is another 409 with the newest content; re-read and retry. A missing token is 400.
5. On **401**, secret mismatch. On **503**, `WEBHOOK_SECRET` not configured on the server.

## Example

```bash
curl -sS -X POST "$BASE_URL/api/webhook" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -d '{"text":"SABBATH, JULY 11, 2026\n\nBIBLE TALK\n[  ] Opening song : SDAH #159\n"}'
```

Correction after a 409 (token from that response):

```bash
curl -sS -X POST "$BASE_URL/api/webhook" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -d '{"action":"correct","serviceId":12,"updated_at":"2026-08-20 02:38:01.123","text":"SABBATH, JULY 11, 2026\n\nBIBLE TALK\n[  ] Opening song : SDAH #159\n"}'
```
