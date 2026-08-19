package plan

import "testing"

func TestIdentityStableForSameItems(t *testing.T) {
	items := []DrawItem{
		{Artifact: ArtifactInstance{InstanceID: "a", TemplateID: "welcome"}},
		{Artifact: ArtifactInstance{InstanceID: "b", TemplateID: "sermon"}},
	}
	a := Identity(items)
	b := Identity(items)
	if a == "" || a != b {
		t.Fatalf("expected stable non-empty identity, got %q / %q", a, b)
	}
	other := Identity([]DrawItem{
		{Artifact: ArtifactInstance{InstanceID: "a", TemplateID: "welcome"}},
	})
	if a == other {
		t.Fatal("identity must change when membership changes")
	}
}
