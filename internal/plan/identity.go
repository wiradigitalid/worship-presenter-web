package plan

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
)

// Identity fingerprints the assembled deck: snapshot membership, order, and
// resolved announcement content as they reached the plan. Presenter and
// projector compare this string on the AD-10 channel; a mismatch means the
// receiver must not follow the index.
func Identity(items []DrawItem) string {
	if items == nil {
		items = []DrawItem{}
	}
	raw, err := json.Marshal(items)
	if err != nil {
		return ""
	}
	sum := sha256.Sum256(raw)
	return hex.EncodeToString(sum[:])
}
