package db

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

// dataVersionAtLeast reports whether the stored data_version string represents
// an integer version at least targetVersion.
//
// An empty, non-numeric, or negative marker is treated as version 0 (older than
// any migration), so a fresh, missing, or corrupt marker runs the migration
// ladder rather than skipping it.
func dataVersionAtLeast(ver string, targetVersion int) bool {
	v, err := strconv.Atoi(strings.TrimSpace(ver))
	if err != nil || v < 0 {
		return false
	}
	return v >= targetVersion
}

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
