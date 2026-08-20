package plan

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func repoRoot(t *testing.T) string {
	t.Helper()
	wd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	dir := wd
	for i := 0; i < 6; i++ {
		if _, err := os.Stat(filepath.Join(dir, "data", "default-registry.json")); err == nil {
			return dir
		}
		dir = filepath.Dir(dir)
	}
	t.Fatal("repo root not found")
	return ""
}

func TestValidateArtifactTemplateNamesProperty(t *testing.T) {
	root := repoRoot(t)
	raw, err := os.ReadFile(filepath.Join(root, "data", "default-registry.json"))
	if err != nil {
		t.Fatal(err)
	}
	var list []map[string]any
	if err := json.Unmarshal(raw, &list); err != nil {
		t.Fatal(err)
	}
	var welcome map[string]any
	for _, tmpl := range list {
		if id, _ := tmpl["id"].(string); id == "welcome" {
			welcome = tmpl
			break
		}
	}
	if welcome == nil {
		t.Fatal("no welcome")
	}
	_, err = ValidateArtifactTemplate(mustJSON(welcome), root)
	if err != nil {
		t.Fatalf("seed welcome must validate: %v", err)
	}

	welcome["extraField"] = true
	_, err = ValidateArtifactTemplate(mustJSON(welcome), root)
	if err == nil || !strings.Contains(err.Error(), "Unknown field: template.extraField") {
		t.Fatalf("unknown field: %v", err)
	}
	delete(welcome, "extraField")

	layouts, _ := welcome["layouts"].(map[string]any)
	def, _ := layouts["default"].(map[string]any)
	els, _ := def["elements"].([]any)
	first, _ := els[0].(map[string]any)
	style, _ := first["style"].(map[string]any)
	style["fontSize"] = 0.0
	_, err = ValidateArtifactTemplate(mustJSON(welcome), root)
	if err == nil || !strings.Contains(err.Error(), "layouts.default.elements[0].style.fontSize must be positive") {
		t.Fatalf("fontSize: %v", err)
	}
}

func TestValidateArtifactTemplateCatalogKey(t *testing.T) {
	root := repoRoot(t)
	payload := map[string]any{
		"schemaVersion": 1,
		"id":            "custom-board",
		"label":         "Board",
		"baseType":      "general",
		"placeholders": []any{
			map[string]any{"key": "inventedWeekly", "type": "text", "required": false},
		},
		"layouts": map[string]any{
			"default": map[string]any{
				"aspectRatio":     "16:9",
				"backgroundColor": "#000000",
				"elements":        []any{},
			},
		},
	}
	_, err := ValidateArtifactTemplate(mustJSON(payload), root)
	if err == nil || !strings.Contains(err.Error(), "placeholder key is not in the catalog: inventedWeekly") {
		t.Fatalf("catalog: %v", err)
	}
}

func TestAuthoredGeneralAppearsInPlan(t *testing.T) {
	empty := Layout{AspectRatio: "16:9", BackgroundColor: "#000000"}
	snap := Snapshot{
		Order: []string{"custom-board"},
		ByID: map[string]Template{
			"custom-board": {
				ID:       "custom-board",
				Label:    "Board",
				BaseType: "general",
				Layouts:  map[string]Layout{"default": empty},
			},
		},
	}
	items, err := BuildSlidePlan("2026-07-11", ParsedRundown{}, Media{}, snap)
	if err != nil {
		t.Fatal(err)
	}
	if len(items) != 1 || items[0].Artifact.TemplateID != "custom-board" {
		t.Fatalf("authored general missing from plan: %#v", items)
	}
}

func mustJSON(v any) []byte {
	b, err := json.Marshal(v)
	if err != nil {
		panic(err)
	}
	return b
}
