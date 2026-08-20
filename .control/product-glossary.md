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

**Announcement Set** — an Admin-authored, ordered sequence of General slides, held and composed only in the Artifact Registry. A Main-spine marker splices one Announcement Set into the deck at that position; 0..N may exist, none mandatory. Supersedes the earlier shape where an Announcement registry row expanded the whole live Hub announcement list (DEC-004).

**Artifact Registry** — ordered set of Artifact Templates; the source of *which slides exist* and *their order*. One Registry for this congregation's flow, not per-church.

**Artifact Template** — one Artifact Registry entry: the layout of one slide (elements, sizes, content bindings). The unit Admin edits.

**Background Library** — Admin's set of images (no colours, no gradients) usable as a Song Set Verse/Reff background, plus one entry marked the global default. A Verse/Reff slide resolves its background: its own weekly choice → the global default → blank.

**Congregation** — the audience of the projection. Never opens the product.

**Data Locale** — the language of a **corpus** (a Bible translation or Song Book). Not UI Locale. Never controls what the Congregation sees.

**Deck** — the presentation generated for one Service, guaranteed as an offline PPTX.

**Events** — a group separate from Operator. Later they hand over the Rundown via Telegram. Not Hub users this phase.

**Hub** — logged-in Service list where the Operator creates, reviews, edits, regenerates, and downloads PPTX. Not a public site.

**Lyric Override** — a Service's own edited text for one Song Set entry's hymn, entered on the Hub form. Scoped to that Service only by default; a separate, explicit action saves the edit back to the Song Book so later Services start from the corrected text. An untouched entry falls through to the Song Book (DEC-004).

**Operator** — a multimedia-team member who logs in, enters this week's Rundown in Hub, reviews the Service, and presents it on Sabbath. The **primary** user.

**picoclaw** — the agent that reads the Rundown on Telegram and calls the API. Last-phase intake. Not the Operator interface.

**PPTX** — the OpenXML file downloaded before worship; the Sabbath guarantee independent of venue internet.

**Predefined Field** — a named weekly-payload key (e.g. `family_name`, `song_number`) that fills an authored slide. A text Predefined Field is a `{key}` token mixed into an authored text element's content, one style per element; an image Predefined Field stays its own geometry box. An unrecognised token renders empty and never blocks generation — the Registry editor flags it at save time. Supersedes **Placeholder Catalog**, whose whole-element `placeholderKey` binding is retired (DEC-004).

**Presenter** — two-screen browser surface (Operator control + Congregation image) plus slideshow; not an offline guarantee.

**Projector Liveness** — verdict on whether the projector window still answers: `none`, `live`, or `lost`. Not a state stored in SQLite.

**Run-Sheet** — web view of one Service's full worship order (roles, names, songs, times) for the Operator, not for the Congregation screen.

**Rundown** — the semi-structured text describing one Service's order. This phase the Operator enters it in Hub; later Events may send it on Telegram.

**Sabbath** — the weekly worship day on which the Deck is presented.

**Service** — one dated worship gathering; the unit the system manages. One Service has one weekly payload, one Deck, one Run-Sheet, and its uploaded images.

**Service Registry Snapshot** — a copy of the Artifact Registry taken when the Service is created, and which it renders afterwards.

**Slide Kind** — authoring-authority category: General, Song Set, or Announcement. Nothing extends a kind's authority.

**Song Book** — lyrics source (title + verse/chorus) shipped as seed, indexed by number in that book. Not a web search result. Admin may keep more than one; a Song Set entry picks its own, or falls back to the Admin-set global default.

**Song Set** — one Main-spine entry that expands into many slides for one week's hymn: a Title slide once, then Verse/Reff slides from the lyrics. Admin defines the Song Set list itself — its own `variable_name` and title per entry, any number of entries, no fixed count — and every entry shares the same Title/Verse/Reff layout trio. Supersedes **SongSet Slot**, whose four fixed positions are retired (DEC-004).

**Sync Artifact** — Admin action that replaces a Service's Snapshot with the live Artifact Registry.

**Telegram** — later-phase intake channel for Events; not the Operator interface and not this phase's handover path.

**UI Locale** — the Operator interface language. Does not reach the Congregation screen.
