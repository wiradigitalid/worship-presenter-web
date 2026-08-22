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

func TestHydrateInlineTokensAndUnknown(t *testing.T) {
	content := "Date: {service_date}, Title: {sermon_title}, ScriptureVer: [{scripture_bible_version}], Family: [{family_name}], Youth: [{youth_name}], Unknown: [{unknown_key}]"
	tmpl := Template{
		SchemaVersion: 1,
		ID:            "custom-test",
		Label:         "Custom Test",
		BaseType:      "general",
		Layouts: map[string]Layout{
			"default": {
				AspectRatio:     "16:9",
				BackgroundColor: "#000000",
				Elements: []CanvasElement{
					{
						ID:       "el-1",
						Type:     "text",
						Required: false,
						X:        10,
						Y:        10,
						W:        80,
						H:        20,
						ZIndex:   1,
						Content:  &content,
					},
				},
			},
		},
	}
	inst, err := hydrateArtifact(tmpl, "inst-1", "default", map[string]interface{}{
		"service_date":            "2026-08-21",
		"sermon_title":            "Living Water",
		"scripture_bible_version": "TB",
		"family_name":             "Keluarga Lee",
		// youth_name is left missing to test that it renders empty rather than erroring
	}, nil)
	if err != nil {
		t.Fatalf("hydrateArtifact failed: %v", err)
	}
	if len(inst.Layout.Elements) != 1 {
		t.Fatalf("expected 1 element, got %d", len(inst.Layout.Elements))
	}
	el := inst.Layout.Elements[0]
	if el.Text == nil {
		t.Fatalf("expected text on element")
	}
	expected := "Date: 2026-08-21, Title: Living Water, ScriptureVer: [TB], Family: [Keluarga Lee], Youth: [], Unknown: []"
	if *el.Text != expected {
		t.Fatalf("expected %q, got %q", expected, *el.Text)
	}
}

func keys(m map[string]Layout) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return out
}
