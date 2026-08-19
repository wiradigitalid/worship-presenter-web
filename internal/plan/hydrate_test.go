package plan

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestHydrateWelcomeFromSeed(t *testing.T) {
	root, err := filepath.Abs("../..")
	if err != nil {
		t.Fatal(err)
	}
	raw, err := os.ReadFile(filepath.Join(root, "data", "default-registry.json"))
	if err != nil {
		t.Fatal(err)
	}
	var list []Template
	if err := json.Unmarshal(raw, &list); err != nil {
		t.Fatal(err)
	}
	var welcome Template
	for _, tmpl := range list {
		if tmpl.ID == "welcome" {
			welcome = tmpl
			break
		}
	}
	if welcome.ID == "" {
		t.Fatal("no welcome")
	}
	t.Logf("layout keys %v default elements %d", keys(welcome.Layouts), len(welcome.Layouts["default"].Elements))
	inst, err := hydrateArtifact(welcome, "welcome", "default", map[string]interface{}{"date": "2026-07-11"}, nil)
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("resolved elements %d", len(inst.Layout.Elements))
	item := DrawItem{Artifact: inst}
	b, err := json.Marshal(item)
	if err != nil {
		t.Fatal(err)
	}
	var round DrawItem
	if err := json.Unmarshal(b, &round); err != nil {
		t.Fatal(err)
	}
	t.Logf("roundtrip elements %d json %s", len(round.Artifact.Layout.Elements), string(b)[:200])
}

func keys(m map[string]Layout) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return out
}
