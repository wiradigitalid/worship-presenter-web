package plan

import (
	"regexp"
	"strconv"
	"strings"
	"unicode"
)

var (
	sectionHeader = regexp.MustCompile(`(?i)^(Verse(?:\s+(\d+))?|Chorus|Reff|Refrain)\s*$`)
	terminalPunct = regexp.MustCompile(`[.!,?;:]["'` + "`" + `’”)\]]?$`)
)

const continuousCharBudget = 320

type lyricSection struct {
	kind       string
	verseIndex int
	lines      []string
}

type LyricSlide struct {
	Label string
	Text  string
}

func joinLinesContinuous(lines []string) string {
	if len(lines) == 0 {
		return ""
	}
	result := lines[0]
	for i := 1; i < len(lines); i++ {
		sep := "; "
		if terminalPunct.MatchString(result) {
			sep = " "
		}
		result = result + sep + lines[i]
	}
	return result
}

func chunkContinuousText(text string, maxChars int) []string {
	if text == "" {
		return nil
	}
	if len(text) <= maxChars {
		return []string{text}
	}
	var chunks []string
	remaining := text
	seps := []string{"; ", ". ", "! ", "? ", ": "}
	for len(remaining) > maxChars {
		breakAt := -1
		for _, sep := range seps {
			idx := strings.LastIndex(remaining[:maxChars], sep)
			for idx > 0 {
				end := idx + len(sep)
				if end <= maxChars && end < len(remaining) {
					if end > breakAt {
						breakAt = end
					}
					break
				}
				if idx == 0 {
					break
				}
				prev := strings.LastIndex(remaining[:idx], sep)
				if prev == idx {
					break
				}
				idx = prev
			}
		}
		if breakAt <= 0 {
			spaceIdx := strings.LastIndex(remaining[:maxChars], " ")
			if spaceIdx > 0 {
				breakAt = spaceIdx + 1
			} else {
				breakAt = maxChars
			}
		}
		chunks = append(chunks, strings.TrimRightFunc(remaining[:breakAt], unicode.IsSpace))
		remaining = strings.TrimLeftFunc(remaining[breakAt:], unicode.IsSpace)
	}
	if remaining != "" {
		chunks = append(chunks, remaining)
	}
	return chunks
}

func chunkLines(lines []string, maxLinesPerSlide int, preserve bool) []string {
	if len(lines) == 0 {
		return nil
	}
	if preserve {
		var chunks []string
		for i := 0; i < len(lines); i += maxLinesPerSlide {
			end := i + maxLinesPerSlide
			if end > len(lines) {
				end = len(lines)
			}
			chunks = append(chunks, strings.Join(lines[i:end], "\n"))
		}
		return chunks
	}
	return chunkContinuousText(joinLinesContinuous(lines), continuousCharBudget)
}

func parseSections(lyrics string) []lyricSection {
	normalized := strings.ReplaceAll(strings.ReplaceAll(lyrics, "\r\n", "\n"), "\r", "\n")
	rawLines := strings.Split(normalized, "\n")
	var sections []lyricSection
	var current *lyricSection
	autoVerse := 0
	push := func() {
		if current == nil {
			return
		}
		var kept []string
		for _, l := range current.lines {
			l = strings.TrimSpace(l)
			if l != "" {
				kept = append(kept, l)
			}
		}
		if len(kept) > 0 {
			current.lines = kept
			sections = append(sections, *current)
		}
		current = nil
	}
	for _, raw := range rawLines {
		line := strings.TrimSpace(raw)
		m := sectionHeader.FindStringSubmatch(line)
		if m != nil {
			push()
			kindRaw := strings.ToLower(m[1])
			cur := lyricSection{}
			if strings.HasPrefix(kindRaw, "verse") {
				autoVerse++
				n := autoVerse
				if m[2] != "" {
					if parsed, err := strconv.Atoi(m[2]); err == nil {
						n = parsed
					}
				}
				cur.kind = "verse"
				cur.verseIndex = n
			} else if strings.HasPrefix(kindRaw, "chorus") {
				cur.kind = "chorus"
			} else {
				cur.kind = "reff"
			}
			current = &cur
			continue
		}
		if current == nil {
			current = &lyricSection{kind: "body"}
		}
		if line != "" {
			current.lines = append(current.lines, line)
		}
	}
	push()
	return sections
}

func fillEmptyRefrains(sections []lyricSection) []lyricSection {
	var template *lyricSection
	for i := range sections {
		s := &sections[i]
		if (s.kind == "chorus" || s.kind == "reff") && len(s.lines) > 0 {
			template = s
			break
		}
	}
	if template == nil {
		return sections
	}
	out := make([]lyricSection, len(sections))
	for i, s := range sections {
		if (s.kind == "chorus" || s.kind == "reff") && len(s.lines) == 0 {
			s.lines = append([]string{}, template.lines...)
		}
		out[i] = s
	}
	return out
}

func expandTrailingRefrain(sections []lyricSection) []lyricSection {
	var verses, refrains, bodies []lyricSection
	for _, s := range sections {
		switch s.kind {
		case "verse":
			verses = append(verses, s)
		case "chorus", "reff":
			refrains = append(refrains, s)
		case "body":
			bodies = append(bodies, s)
		}
	}
	if len(verses) == 0 || len(refrains) == 0 {
		return sections
	}
	var template *lyricSection
	for i := range refrains {
		if len(refrains[i].lines) > 0 {
			template = &refrains[i]
			break
		}
	}
	if template == nil {
		return sections
	}
	var expanded []lyricSection
	for _, v := range verses {
		copyRef := *template
		copyRef.lines = append([]string{}, template.lines...)
		expanded = append(expanded, v, copyRef)
	}
	expanded = append(expanded, bodies...)
	return expanded
}

func SplitLyricsLabeled(lyrics string, maxLinesPerSlide int) []LyricSlide {
	if maxLinesPerSlide <= 0 || strings.TrimSpace(lyrics) == "" {
		return nil
	}
	sections := expandTrailingRefrain(fillEmptyRefrains(parseSections(lyrics)))
	verseTotal := 0
	for _, s := range sections {
		if s.kind == "verse" {
			verseTotal++
		}
	}
	var slides []LyricSlide
	for _, section := range sections {
		chunks := chunkLines(section.lines, maxLinesPerSlide, false)
		if len(chunks) == 0 {
			continue
		}
		label := ""
		switch section.kind {
		case "verse":
			n := section.verseIndex
			if n == 0 {
				n = 1
			}
			if verseTotal > 0 {
				label = itoa(n) + "/" + itoa(verseTotal)
			} else {
				label = itoa(n)
			}
		case "reff":
			label = "Reff"
		case "chorus":
			label = "Chorus"
		}
		for _, text := range chunks {
			slides = append(slides, LyricSlide{Label: label, Text: text})
		}
	}
	if len(slides) == 0 {
		normalized := strings.ReplaceAll(strings.ReplaceAll(lyrics, "\r\n", "\n"), "\r", "\n")
		for _, stanza := range regexpSplitBlank(normalized) {
			var lines []string
			for _, l := range strings.Split(strings.TrimSpace(stanza), "\n") {
				l = strings.TrimSpace(l)
				if l != "" {
					lines = append(lines, l)
				}
			}
			for _, text := range chunkLines(lines, maxLinesPerSlide, false) {
				slides = append(slides, LyricSlide{Text: text})
			}
		}
	}
	return slides
}

func regexpSplitBlank(s string) []string {
	var parts []string
	cur := strings.Builder{}
	blank := 0
	for _, line := range strings.Split(s, "\n") {
		if strings.TrimSpace(line) == "" {
			blank++
			if blank >= 1 && cur.Len() > 0 {
				parts = append(parts, cur.String())
				cur.Reset()
			}
			continue
		}
		blank = 0
		if cur.Len() > 0 {
			cur.WriteByte('\n')
		}
		cur.WriteString(line)
	}
	if cur.Len() > 0 {
		parts = append(parts, cur.String())
	}
	return parts
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var b [12]byte
	i := len(b)
	neg := n < 0
	if neg {
		n = -n
	}
	for n > 0 {
		i--
		b[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		b[i] = '-'
	}
	return string(b[i:])
}
