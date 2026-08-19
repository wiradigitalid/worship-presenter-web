package parse

import (
	"database/sql"
	"encoding/json"
	"regexp"
	"strconv"
	"strings"
)

var structuredKeys = []string{
	"themeVerse", "verseReading", "familyYouth", "familyPrayerRequest",
	"youthPrayerRequest", "sermon", "specialSong", "closingPrayerPerson",
	"song1Number", "song2Number", "song3Number", "song4Number",
	"sermonSpeaker", "sermonTitle",
}

func HasStructuredFields(body map[string]any) bool {
	src := body
	if f, ok := body["fields"]; ok {
		m, ok := f.(map[string]any)
		if !ok {
			return false
		}
		src = m
	}
	for _, k := range structuredKeys {
		if _, ok := src[k]; ok {
			return true
		}
	}
	return false
}

func ApplyStructuredFields(db *sql.DB, parsed *Rundown, body map[string]any) {
	src := body
	if f, ok := body["fields"]; ok {
		if m, ok := f.(map[string]any); ok {
			src = m
		}
	}
	if v, ok := src["themeVerse"]; ok {
		parsed.ThemeVerse = coerceScripture(v)
	}
	if v, ok := src["verseReading"]; ok {
		parsed.VerseReading = coerceScripture(v)
	}
	if v, ok := src["familyYouth"]; ok {
		parsed.FamilyYouth = coerceNullableString(v)
	}
	if _, ok := src["familyPrayerRequest"]; ok {
		parsed.FamilyPrayerRequest = coerceNullableString(src["familyPrayerRequest"])
		parsed.FamilyYouth = nil
	}
	if _, ok := src["youthPrayerRequest"]; ok {
		parsed.YouthPrayerRequest = coerceNullableString(src["youthPrayerRequest"])
		parsed.FamilyYouth = nil
	}
	if v, ok := src["specialSong"]; ok {
		parsed.SpecialSong = coerceSpecialSong(v)
	}
	if v, ok := src["sermon"]; ok {
		parsed.Sermon = coerceSermon(v)
		applySermonItem(parsed)
	} else if _, hasSpeaker := src["sermonSpeaker"]; hasSpeaker || hasKey(src, "sermonTitle") {
		speaker, _ := src["sermonSpeaker"].(string)
		title, _ := src["sermonTitle"].(string)
		speaker = strings.TrimSpace(speaker)
		title = strings.TrimSpace(title)
		if speaker == "" {
			parsed.Sermon = nil
		} else {
			parsed.Sermon = &Sermon{Speaker: speaker, Title: title}
		}
		applySermonItem(parsed)
	}
	if v, ok := src["closingPrayerPerson"]; ok {
		person := coerceNullableString(v)
		if person != nil && regexp.MustCompile(`(?i)^the\s+speaker$`).MatchString(strings.TrimSpace(*person)) && parsed.Sermon != nil && parsed.Sermon.Speaker != "" {
			s := parsed.Sermon.Speaker
			person = &s
		}
		parsed.ClosingPrayerPerson = person
		applyClosingItem(parsed)
	}
	if db != nil {
		for i, key := range []string{"song1Number", "song2Number", "song3Number", "song4Number"} {
			if v, ok := src[key]; ok {
				if n := CoerceSongNumber(v); n != nil {
					applySongOverlay(db, parsed, i, *n)
				}
			}
		}
	}
}

func hasKey(m map[string]any, k string) bool {
	_, ok := m[k]
	return ok
}

func coerceScripture(v any) *Scripture {
	if v == nil {
		return nil
	}
	if s, ok := v.(string); ok {
		return ParseScriptureValue(s)
	}
	m, ok := v.(map[string]any)
	if !ok {
		return nil
	}
	var ref *string
	if r, ok := m["reference"].(string); ok && strings.TrimSpace(r) != "" {
		t := strings.TrimSpace(r)
		ref = &t
	}
	text := ""
	if t, ok := m["text"].(string); ok {
		text = strings.TrimSpace(t)
	}
	if ref == nil && text == "" {
		return nil
	}
	return &Scripture{Reference: ref, Text: text}
}

func coerceNullableString(v any) *string {
	if v == nil {
		return nil
	}
	s, ok := v.(string)
	if !ok {
		return nil
	}
	t := strings.TrimSpace(s)
	if t == "" {
		return nil
	}
	return &t
}

func coerceSpecialSong(v any) *string {
	if v == nil {
		return nil
	}
	s, ok := v.(string)
	if !ok {
		return nil
	}
	t := strings.TrimSpace(s)
	if t == "" || t == "-" || t == "—" || strings.EqualFold(t, "none") {
		return nil
	}
	return &t
}

func coerceSermon(v any) *Sermon {
	if v == nil {
		return nil
	}
	m, ok := v.(map[string]any)
	if !ok {
		return nil
	}
	speaker := strings.TrimSpace(asAnyString(m["speaker"]))
	title := strings.TrimSpace(asAnyString(m["title"]))
	if speaker == "" {
		return nil
	}
	return &Sermon{Speaker: speaker, Title: title}
}

func asAnyString(v any) string {
	if v == nil {
		return ""
	}
	if s, ok := v.(string); ok {
		return s
	}
	b, err := json.Marshal(v)
	if err != nil {
		return ""
	}
	return strings.Trim(string(b), `"`)
}

func applySermonItem(parsed *Rundown) {
	idx := indexRole(parsed.Items, "Sermon")
	if parsed.Sermon == nil {
		if idx >= 0 {
			parsed.Items = append(parsed.Items[:idx], parsed.Items[idx+1:]...)
		}
		return
	}
	name := parsed.Sermon.Speaker
	if parsed.Sermon.Title != "" {
		name = parsed.Sermon.Speaker + " — " + parsed.Sermon.Title
	}
	item := Item{Type: "role", Role: "Sermon", Name: name}
	if idx >= 0 {
		parsed.Items[idx] = item
	} else {
		parsed.Items = append(parsed.Items, item)
	}
}

func applyClosingItem(parsed *Rundown) {
	idx := indexRole(parsed.Items, "Closing Prayer")
	if parsed.ClosingPrayerPerson == nil {
		if idx >= 0 {
			parsed.Items = append(parsed.Items[:idx], parsed.Items[idx+1:]...)
		}
		return
	}
	item := Item{Type: "role", Role: "Closing Prayer", Name: *parsed.ClosingPrayerPerson}
	if idx >= 0 {
		parsed.Items[idx] = item
	} else {
		parsed.Items = append(parsed.Items, item)
	}
}

func indexRole(items []Item, role string) int {
	re := regexp.MustCompile(`(?i)^` + regexp.QuoteMeta(role) + `$`)
	for i, it := range items {
		if it.Type == "role" && re.MatchString(it.Role) {
			return i
		}
	}
	return -1
}

func CoerceSongNumber(v any) *int {
	if v == nil {
		return nil
	}
	switch t := v.(type) {
	case float64:
		n := int(t)
		if n > 0 {
			return &n
		}
	case string:
		m := regexp.MustCompile(`(\d{1,4})`).FindStringSubmatch(strings.TrimSpace(t))
		if len(m) == 2 {
			n, err := strconv.Atoi(m[1])
			if err == nil && n > 0 {
				return &n
			}
		}
	}
	return nil
}

func applySongOverlay(db *sql.DB, parsed *Rundown, slot, number int) {
	title, lyrics, incomplete := LookupHymn(db, number)
	hymn := Item{Type: "hymn", Number: number, Title: title, Lyrics: lyrics, Incomplete: incomplete}
	bt, ds := bucketHymns(parsed.Items)
	target := ds
	idxInBucket := slot % 2
	if slot < 2 {
		target = bt
	}
	if idxInBucket < len(target) {
		old := target[idxInBucket]
		for i := range parsed.Items {
			if parsed.Items[i].Type == "hymn" && parsed.Items[i].Number == old.Number && parsed.Items[i].Title == old.Title {
				hymn.Timing = parsed.Items[i].Timing
				parsed.Items[i] = hymn
				if old.Number != number {
					parsed.FailedHymnNumbers = withoutInt(parsed.FailedHymnNumbers, old.Number)
				}
				if incomplete {
					parsed.FailedHymnNumbers = appendUniqueInt(parsed.FailedHymnNumbers, number)
				} else {
					parsed.FailedHymnNumbers = withoutInt(parsed.FailedHymnNumbers, number)
				}
				return
			}
		}
	}
	if incomplete {
		parsed.FailedHymnNumbers = appendUniqueInt(parsed.FailedHymnNumbers, number)
	} else {
		parsed.FailedHymnNumbers = withoutInt(parsed.FailedHymnNumbers, number)
	}
	section := "ds"
	if slot < 2 {
		section = "bt"
	}
	insertHymnInSection(&parsed.Items, section, idxInBucket, hymn)
}

type hymnRef struct {
	Number int
	Title  string
}

func bucketHymns(items []Item) (bt, ds []hymnRef) {
	hasBT, hasDS := false, false
	var all []hymnRef
	for _, it := range items {
		if it.Type == "hymn" {
			all = append(all, hymnRef{it.Number, it.Title})
		}
		if it.Type == "section" {
			if regexp.MustCompile(`(?i)^BIBLE\s+TALK\b`).MatchString(it.Title) {
				hasBT = true
			}
			if regexp.MustCompile(`(?i)^DIVINE\s+SERVICE\b`).MatchString(it.Title) {
				hasDS = true
			}
		}
	}
	if !hasBT && !hasDS {
		if len(all) > 2 {
			return all[:2], all[2:]
		}
		return all, nil
	}
	section := ""
	for _, it := range items {
		if it.Type == "section" {
			if regexp.MustCompile(`(?i)^BIBLE\s+TALK\b`).MatchString(it.Title) {
				section = "bt"
			} else if regexp.MustCompile(`(?i)^DIVINE\s+SERVICE\b`).MatchString(it.Title) {
				section = "ds"
			} else {
				section = ""
			}
			continue
		}
		if it.Type != "hymn" {
			continue
		}
		ref := hymnRef{it.Number, it.Title}
		if section == "bt" {
			bt = append(bt, ref)
		} else if section == "ds" {
			ds = append(ds, ref)
		}
	}
	return bt, ds
}

func insertHymnInSection(items *[]Item, section string, slot int, hymn Item) {
	list := *items
	current := ""
	hymnsInSection := 0
	for i, it := range list {
		if it.Type == "section" {
			if regexp.MustCompile(`(?i)^BIBLE\s+TALK\b`).MatchString(it.Title) {
				current = "bt"
			} else if regexp.MustCompile(`(?i)^DIVINE\s+SERVICE\b`).MatchString(it.Title) {
				current = "ds"
			} else {
				current = ""
			}
			continue
		}
		if it.Type != "hymn" || current != section {
			continue
		}
		if hymnsInSection == slot {
			*items = append(list[:i], append([]Item{hymn}, list[i:]...)...)
			return
		}
		hymnsInSection++
	}
	sectionTitle := "DIVINE SERVICE"
	if section == "bt" {
		sectionTitle = "BIBLE TALK"
	}
	hasSection := false
	for _, it := range list {
		if it.Type == "section" && strings.EqualFold(it.Title, sectionTitle) {
			hasSection = true
			break
		}
	}
	if !hasSection {
		list = append(list, Item{Type: "section", Title: sectionTitle})
	}
	last := -1
	current = ""
	for i, it := range list {
		if it.Type == "section" {
			if regexp.MustCompile(`(?i)^BIBLE\s+TALK\b`).MatchString(it.Title) {
				current = "bt"
			} else if regexp.MustCompile(`(?i)^DIVINE\s+SERVICE\b`).MatchString(it.Title) {
				current = "ds"
			} else {
				current = ""
			}
			if current == section {
				last = i
			}
			continue
		}
		if current == section {
			last = i
		}
	}
	if last >= 0 {
		list = append(list[:last+1], append([]Item{hymn}, list[last+1:]...)...)
	} else {
		list = append(list, hymn)
	}
	*items = list
}

func withoutInt(xs []int, n int) []int {
	out := make([]int, 0, len(xs))
	for _, x := range xs {
		if x != n {
			out = append(out, x)
		}
	}
	return out
}

func appendUniqueInt(xs []int, n int) []int {
	for _, x := range xs {
		if x == n {
			return xs
		}
	}
	return append(xs, n)
}

