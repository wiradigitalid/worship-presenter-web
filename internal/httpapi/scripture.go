package httpapi

import (
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
)

var scriptureRefRE = regexp.MustCompile(`(?i)^((?:[1-3]\s+)?[A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(\d+)\s*:\s*(\d+)(?:\s*[-–]\s*(\d+)|\s*,\s*(\d+))?\s*$`)

var bookAliases = map[string]string{
	"psalm":            "Psalms",
	"psalms":           "Psalms",
	"ps":               "Psalms",
	"song of solomon":  "Song of Solomon",
	"songofsolomon":    "Song of Solomon",
	"sos":              "Song of Solomon",
}

func (s *Server) getScripture(w http.ResponseWriter, r *http.Request) {
	ref := strings.TrimSpace(r.URL.Query().Get("ref"))
	if ref == "" {
		writeError(w, http.StatusBadRequest, "Missing ref query parameter")
		return
	}
	translationParam := strings.TrimSpace(r.URL.Query().Get("translation"))
	installed, err := s.listTranslationCodes()
	if err != nil {
		log.Printf("Error looking up scripture: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	code := "KJV"
	if translationParam != "" {
		normalized := strings.ToUpper(translationParam)
		known := false
		for _, c := range installed {
			if c == normalized {
				known = true
				break
			}
		}
		if !known {
			writeError(w, http.StatusBadRequest, `Unknown bible translation "`+normalized+`"`)
			return
		}
		code = normalized
	}
	var n int
	if err := s.DB.QueryRow(`SELECT COUNT(*) FROM bible_verses WHERE translation_code = ?`, code).Scan(&n); err != nil {
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if n == 0 {
		writeError(w, http.StatusServiceUnavailable,
			code+` corpus is empty. It ships at data/*/bible-translation/`+strings.ToLower(code)+`.json and is reconciled from that file on boot; check it with npm run corpus:verify.`)
		return
	}
	passage, ok := s.lookupScripture(ref, code)
	if !ok {
		writeError(w, http.StatusNotFound, "Scripture reference not found")
		return
	}
	writeJSON(w, http.StatusOK, passage)
}

func (s *Server) listTranslationCodes() ([]string, error) {
	rows, err := s.DB.Query(`SELECT code FROM bible_translations ORDER BY code`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []string
	for rows.Next() {
		var c string
		if err := rows.Scan(&c); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (s *Server) lookupScripture(ref, code string) (map[string]string, bool) {
	value := strings.TrimSpace(strings.ReplaceAll(ref, "+", " "))
	value = regexp.MustCompile(`(?i)^(?:e\.g\.|eg\.|example:)\s*`).ReplaceAllString(value, "")
	value = strings.TrimSpace(value)
	m := scriptureRefRE.FindStringSubmatch(value)
	if m == nil {
		return nil, false
	}
	book := strings.Join(strings.Fields(strings.TrimSpace(m[1])), " ")
	chapter, _ := strconv.Atoi(m[2])
	start, _ := strconv.Atoi(m[3])
	end := start
	if m[4] != "" {
		end, _ = strconv.Atoi(m[4])
	} else if m[5] != "" {
		end, _ = strconv.Atoi(m[5])
	}
	if chapter <= 0 || start <= 0 || end < start {
		return nil, false
	}
	bookID := s.resolveBookID(book)
	if bookID == 0 {
		return nil, false
	}
	rows, err := s.DB.Query(
		`SELECT verse, verse_text FROM bible_verses
		  WHERE book_id = ? AND chapter = ? AND verse >= ? AND verse <= ? AND translation_code = ?
		  ORDER BY verse ASC`,
		bookID, chapter, start, end, code,
	)
	if err != nil {
		return nil, false
	}
	defer rows.Close()
	var texts []string
	for rows.Next() {
		var verse int
		var text string
		if err := rows.Scan(&verse, &text); err != nil {
			return nil, false
		}
		texts = append(texts, stripVerseMarkup(text))
	}
	if len(texts) == 0 {
		return nil, false
	}
	reference := book + " " + strconv.Itoa(chapter) + ":" + strconv.Itoa(start)
	if start != end {
		reference += "-" + strconv.Itoa(end)
	}
	return map[string]string{
		"reference":   reference,
		"text":        strings.Join(texts, " "),
		"translation": code,
	}, true
}

func (s *Server) resolveBookID(bookName string) int {
	normalized := strings.ToLower(strings.TrimSpace(bookName))
	aliased := bookAliases[normalized]
	if aliased == "" {
		aliased = bookName
	}
	candidates := []string{aliased, strings.TrimSpace(bookName), strings.ReplaceAll(aliased, " ", "")}
	seen := map[string]struct{}{}
	for _, c := range candidates {
		key := strings.ToLower(c)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		var id int
		err := s.DB.QueryRow(
			`SELECT id FROM bible_books
			  WHERE lower(name) = ? OR lower(short_name) = ?
			     OR lower(replace(short_name, ' ', '')) = ?
			  LIMIT 1`,
			key, key, strings.ReplaceAll(key, " ", ""),
		).Scan(&id)
		if err == nil {
			return id
		}
	}
	return 0
}

func stripVerseMarkup(text string) string {
	text = regexp.MustCompile(`@\d+`).ReplaceAllString(text, "")
	return strings.Join(strings.Fields(text), " ")
}
