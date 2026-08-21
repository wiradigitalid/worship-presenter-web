package httpapi

import (
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
)

func (s *Server) getHymns(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	all := q.Get("all") == "1" || q.Get("all") == "true"
	search := strings.TrimSpace(q.Get("q"))
	limit := parseHymnLimit(q.Get("limit"))
	type row struct {
		Number int    `json:"number"`
		Title  string `json:"title"`
		Lyrics string `json:"lyrics,omitempty"`
	}
	var rows []row
	var err error
	if all {
		err = s.queryHymns(`SELECT number, title, lyrics FROM hymns ORDER BY number ASC`, func(n int, t, l string) {
			rows = append(rows, row{Number: n, Title: t, Lyrics: l})
		})
	} else if q.Has("numbers") {
		nums := parseHymnNumbers(q.Get("numbers"))
		if len(nums) == 0 {
			rows = []row{}
		} else {
			placeholders := strings.TrimRight(strings.Repeat("?,", len(nums)), ",")
			args := make([]any, len(nums))
			for i, n := range nums {
				args[i] = n
			}
			err = s.queryHymnsArgs(
				`SELECT number, title, lyrics FROM hymns WHERE number IN (`+placeholders+`) ORDER BY number ASC`,
				args,
				func(n int, t, l string) { rows = append(rows, row{Number: n, Title: t, Lyrics: l}) },
			)
		}
	} else if search != "" {
		pattern := "%" + escapeLike(search) + "%"
		err = s.queryHymnsArgs(
			`SELECT number, title, lyrics FROM hymns
			  WHERE CAST(number AS TEXT) LIKE ? ESCAPE '\'
			     OR title LIKE ? ESCAPE '\'
			  ORDER BY number ASC LIMIT ?`,
			[]any{pattern, pattern, limit},
			func(n int, t, l string) { rows = append(rows, row{Number: n, Title: t, Lyrics: l}) },
		)
	} else {
		err = s.queryHymnsArgs(
			`SELECT number, title, lyrics FROM hymns ORDER BY number ASC LIMIT ?`,
			[]any{limit},
			func(n int, t, l string) { rows = append(rows, row{Number: n, Title: t, Lyrics: l}) },
		)
	}
	if err != nil {
		log.Printf("Error searching hymns: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if rows == nil {
		rows = []row{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"hymns": rows})
}

func (s *Server) queryHymns(sql string, fn func(int, string, string)) error {
	return s.queryHymnsArgs(sql, nil, fn)
}

func (s *Server) queryHymnsArgs(sql string, args []any, fn func(int, string, string)) error {
	rows, err := s.DB.Query(sql, args...)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var n int
		var t, l string
		if err := rows.Scan(&n, &t, &l); err != nil {
			return err
		}
		fn(n, t, l)
	}
	return rows.Err()
}

func parseHymnLimit(raw string) int {
	if raw == "" {
		return 15
	}
	if !regexp.MustCompile(`^\d+$`).MatchString(strings.TrimSpace(raw)) {
		return 15
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n <= 0 {
		return 15
	}
	if n > 40 {
		return 40
	}
	return n
}

func parseHymnNumbers(raw string) []int {
	seen := map[int]struct{}{}
	var out []int
	for _, part := range strings.Split(raw, ",") {
		token := strings.TrimSpace(part)
		if !regexp.MustCompile(`^\d+$`).MatchString(token) {
			continue
		}
		n, err := strconv.Atoi(token)
		if err != nil || n <= 0 {
			continue
		}
		if _, ok := seen[n]; ok {
			continue
		}
		seen[n] = struct{}{}
		out = append(out, n)
		if len(out) >= 40 {
			break
		}
	}
	return out
}

func escapeLike(value string) string {
	r := strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)
	return r.Replace(value)
}
