# Product Glossary

**Loaded when:** writing any document in the corpus.

SSOT for **product** vocabulary — what this product talks about. Each term is defined **once**
here, then used as written throughout the corpus.

**Method** vocabulary lives in `.constitution/method/method-glossary.md` and MUST NOT be redefined
here. The split test: would this term still apply on a different product? Yes →
`.constitution/method/method-glossary.md`, no → here.

## Rules

- A new term that appears in any document MUST be added here **in the same pass**.
- A definition MUST name its relation to other terms and its cardinality when relevant.
- One term MUST NOT have two entries.
- This file is born **empty** and filled from the product. Its first entries are born with the brief at G1.

## Entries

**Admin** — account holder who manages access, Hub settings, and the Artifact Registry. Not the Operator while presenting.

**Artifact Registry** — ordered set of Artifact Templates; the source of *which slides exist* and *their order*. One Registry for this congregation's flow, not per-church.

**Artifact Template** — one Artifact Registry entry: the layout of one slide (elements, sizes, content bindings). The unit Admin edits.

**Congregation** — the audience of the projection. Never opens the product.

**Data Locale** — the language of a **corpus** (a Bible translation or Song Book). Not UI Locale. Never controls what the Congregation sees.

**Deck** — the presentation generated for one Service, guaranteed as an offline PPTX.

**Events** — a group separate from Operator. Later they hand over the Rundown via Telegram. Not Hub users this phase.

**Hub** — logged-in Service list where the Operator creates, reviews, edits, regenerates, and downloads PPTX. Not a public site.

**Operator** — a multimedia-team member who logs in, enters this week's Rundown in Hub, reviews the Service, and presents it on Sabbath. The **primary** user.

**picoclaw** — the agent that reads the Rundown on Telegram and calls the API. Last-phase intake. Not the Operator interface.

**Placeholder Catalog** — closed set of weekly-payload placeholders that may be bound on a General entry. Extending the catalog is a development change.

**PPTX** — the OpenXML file downloaded before worship; the Sabbath guarantee independent of venue internet.

**Presenter** — two-screen browser surface (Operator control + Congregation image) plus slideshow; not an offline guarantee.

**Projector Liveness** — verdict on whether the projector window still answers: `none`, `live`, or `lost`. Not a state stored in SQLite.

**Run-Sheet** — web view of one Service's full worship order (roles, names, songs, times) for the Operator, not for the Congregation screen.

**Rundown** — the semi-structured text describing one Service's order. This phase the Operator enters it in Hub; later Events may send it on Telegram.

**Sabbath** — the weekly worship day on which the Deck is presented.

**Service** — one dated worship gathering; the unit the system manages. One Service has one weekly payload, one Deck, one Run-Sheet, and its uploaded images.

**Service Registry Snapshot** — a copy of the Artifact Registry taken when the Service is created, and which it renders afterwards.

**Slide Kind** — authoring-authority category: General, SongSet, or Announcement. Nothing extends a kind's authority.

**Song Book** — lyrics source (title + verse/chorus) shipped as seed, indexed by number in that book. Not a web search result.

**SongSet Slot** — one of four fixed song-block positions (opening/closing Bible Talk, opening/closing Divine Service). Slot identity belongs to the system, not Admin.

**Sync Artifact** — Admin action that replaces a Service's Snapshot with the live Artifact Registry.

**Telegram** — later-phase intake channel for Events; not the Operator interface and not this phase's handover path.

**UI Locale** — the Operator interface language. Does not reach the Congregation screen.
