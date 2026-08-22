// Hand-mirrored port: internal/plan/song_set_snapshot.go <-> src/lib/artifacts/registry-snapshot.ts
// A change to one is incomplete until the other matches. (DEC-004 S4/AD-33)

package plan

import (
	"database/sql"
	"encoding/json"
	"fmt"
)

type songSetLayoutTrio struct {
	title Layout
	verse Layout
	reff  Layout
}

// SongSetLayoutTrio is the shared Title / Verse / Reff canvas trio for song-set-entry rows.
type SongSetLayoutTrio = songSetLayoutTrio

func loadSongSetLayoutTrio(db *sql.DB) (*songSetLayoutTrio, error) {
	return loadSongSetLayoutTrioQuery(db, `SELECT role, payload FROM song_set_layouts`)
}

// loadSongSetLayoutTrioQuery runs the given role/payload query and folds the
// rows into a trio. Callers must finish this query before opening any other
// result set (MaxOpenConns(1) deadlock).
func loadSongSetLayoutTrioQuery(db *sql.DB, query string, args ...any) (*songSetLayoutTrio, error) {
	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	byRole := map[string]Layout{}
	for rows.Next() {
		var role, payload string
		if err := rows.Scan(&role, &payload); err != nil {
			return nil, err
		}
		var layout Layout
		if err := json.Unmarshal([]byte(payload), &layout); err != nil {
			return nil, fmt.Errorf("song set layout %s: %w", role, err)
		}
		byRole[role] = layout
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	title, okT := byRole["title"]
	verse, okV := byRole["verse"]
	reff, okR := byRole["reff"]
	if !okT || !okV || !okR {
		return nil, nil
	}
	return &songSetLayoutTrio{title: title, verse: verse, reff: reff}, nil
}

func placeholdersFromLayouts(layouts ...Layout) []Placeholder {
	seen := map[string]struct{}{}
	var out []Placeholder
	required := map[string]bool{
		"song_number": true, "song_title": true, "verse_content[]": true, "reff[]": true,
	}
	types := map[string]string{
		"song_number": "text", "song_title": "text", "verse_number": "text",
		"verse_content[]": "text", "reff[]": "text",
	}
	for _, layout := range layouts {
		for _, el := range layout.Elements {
			if el.PlaceholderKey == nil {
				continue
			}
			key := *el.PlaceholderKey
			if _, ok := seen[key]; ok {
				continue
			}
			seen[key] = struct{}{}
			typ := types[key]
			if typ == "" {
				typ = "text"
			}
			out = append(out, Placeholder{
				Key: key, Type: typ, Required: required[key],
			})
		}
	}
	return out
}

func composeSongSetEntryTemplate(id, label string, trio *songSetLayoutTrio) Template {
	return Template{
		SchemaVersion: 1,
		ID:            id,
		Label:         label,
		BaseType:      "song-set-entry",
		Placeholders:  placeholdersFromLayouts(trio.title, trio.verse, trio.reff),
		Layouts: map[string]Layout{
			"title": trio.title,
			"verse": trio.verse,
			"reff":  trio.reff,
			// Compat alias for any caller expecting "lyric"
			"lyric": trio.verse,
		},
	}
}

// LoadSongSetLayoutTrio reads the shared song-set layout trio from song_set_layouts.
func LoadSongSetLayoutTrio(db *sql.DB) (*SongSetLayoutTrio, error) {
	return loadSongSetLayoutTrio(db)
}

// SongSetEntryPayloadJSON serializes a virtual song-set-entry template for service snapshots.
func SongSetEntryPayloadJSON(id, label string, trio *SongSetLayoutTrio) (string, error) {
	if trio == nil {
		return "", fmt.Errorf("song-set layout trio missing")
	}
	raw, err := json.Marshal(composeSongSetEntryTemplate(id, label, trio))
	if err != nil {
		return "", err
	}
	return string(raw), nil
}
