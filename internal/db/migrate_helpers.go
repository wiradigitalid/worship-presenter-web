package db

import (
	"fmt"
	"strings"
	"time"
)

// nowUTCString returns the migration-time stamp matching StampNowSQL's grain.
// Used by migrate_song_set_shape.go and migrate_predefined_fields.go to
// stamp rows they write.
func nowUTCString() string {
	return time.Now().UTC().Format(time.RFC3339Nano)
}

// needsReviewTag is the small marker logged when a row could not be
// deterministically migrated (custom song-set variable_name, unmatched
// reference/text template id). The migration does not write needs-review to
// the row itself (no column for it yet) — it just logs the id.
func needsReviewTag(id, reason string) string {
	return fmt.Sprintf("[registry] migration needs-review: %s (%s)", strings.TrimSpace(id), reason)
}
