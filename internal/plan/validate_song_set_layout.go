package plan

import (
	"encoding/json"
	"fmt"
)

// ValidateSongSetLayout validates one song-set trio layout payload (LC-11
// PUT /api/admin/song-set-layouts/{role}). It enforces the AD-15 layout shape
// and, for verse/reff, the AD-33 blank-canvas rule: no background image on
// the layout and no image element — backgrounds resolve at hydrate/live time.
// The blank-canvas check runs before generic validation so a rejected verse
// save always names the offending element, not its imageRef. The returned
// bytes are the canonical compact JSON to store.
func ValidateSongSetLayout(raw []byte, role, repoRoot string) ([]byte, error) {
	var v any
	if err := json.Unmarshal(raw, &v); err != nil {
		return nil, failf("Invalid JSON")
	}
	label := fmt.Sprintf("layouts.%s", role)
	if role == "verse" || role == "reff" {
		obj, err := asObject(v, label)
		if err != nil {
			return nil, err
		}
		if _, has := obj["backgroundImage"]; has {
			return nil, failf("%s must not set a background image", label)
		}
		if rawEls, ok := obj["elements"].([]any); ok {
			for i, rawEl := range rawEls {
				el, ok := rawEl.(map[string]any)
				if !ok {
					continue
				}
				typ, _ := el["type"].(string)
				if _, hasImg := el["imageRef"]; hasImg || typ == "image" || typ == "image-placeholder" {
					return nil, failf("%s.elements[%d] must not set a background image", label, i)
				}
			}
		}
	}
	layout, err := parseLayout(v, label, repoRoot)
	if err != nil {
		return nil, err
	}
	return json.Marshal(marshalLayout(layout))
}
