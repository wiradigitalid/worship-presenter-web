package plan

import (
	"fmt"
	"sort"
	"strings"
)

const runtimeVersion = 1

type resolution struct {
	present bool
	value   string
}

func firstImageRef(entries []string) resolution {
	for _, e := range entries {
		if strings.TrimSpace(e) != "" {
			return resolution{true, e}
		}
	}
	return resolution{}
}

func asStringSlice(v interface{}) ([]string, bool) {
	switch t := v.(type) {
	case []string:
		return t, true
	case []interface{}:
		out := make([]string, 0, len(t))
		for _, x := range t {
			s, ok := x.(string)
			if !ok {
				return nil, false
			}
			out = append(out, s)
		}
		return out, true
	default:
		return nil, false
	}
}

func resolvePlaceholderValue(def Placeholder, raw interface{}) resolution {
	candidate := raw
	if candidate == nil {
		candidate = def.DefaultValue
	}
	if candidate == nil {
		return resolution{}
	}
	isImage := def.Type == "image" || def.Type == "image[]"
	if arr, ok := asStringSlice(candidate); ok {
		if len(arr) == 0 {
			return resolution{}
		}
		if isImage {
			return firstImageRef(arr)
		}
		return resolution{true, strings.Join(arr, "\n")}
	}
	s, ok := candidate.(string)
	if !ok {
		return resolution{}
	}
	if isImage {
		if strings.TrimSpace(s) == "" {
			return resolution{}
		}
		return resolution{true, s}
	}
	return resolution{true, s}
}

func sortElements(elements []CanvasElement) []CanvasElement {
	indexed := make([]CanvasElement, len(elements))
	copy(indexed, elements)
	sort.SliceStable(indexed, func(i, j int) bool {
		return indexed[i].ZIndex < indexed[j].ZIndex
	})
	return indexed
}

func strPtr(s string) *string { return &s }

func hydrateArtifact(template Template, instanceID, layoutKey string, values map[string]interface{}, group *GroupRef) (ArtifactInstance, error) {
	if layoutKey == "" {
		layoutKey = "default"
	}
	layout, ok := template.Layouts[layoutKey]
	if !ok {
		return ArtifactInstance{}, fmt.Errorf("unknown layout %s on %s", layoutKey, template.ID)
	}
	defs := map[string]Placeholder{}
	for _, p := range template.Placeholders {
		defs[p.Key] = p
	}
	if values == nil {
		values = map[string]interface{}{}
	}
	elements := make([]ResolvedElement, 0, len(layout.Elements))
	for _, element := range sortElements(layout.Elements) {
		style := element.Style
		if style == nil {
			style = map[string]interface{}{}
		}
		resolved := ResolvedElement{
			ID:     element.ID,
			Type:   element.Type,
			X:      element.X,
			Y:      element.Y,
			W:      element.W,
			H:      element.H,
			ZIndex: element.ZIndex,
			Style:  style,
		}
		if element.PlaceholderKey == nil || *element.PlaceholderKey == "" {
			if element.Type == "text" && element.Content != nil {
				resolved.Text = element.Content
			} else if (element.Type == "image" || element.Type == "image-placeholder") && element.ImageRef != nil {
				resolved.ImageURL = element.ImageRef
			}
			elements = append(elements, resolved)
			continue
		}
		def, ok := defs[*element.PlaceholderKey]
		if !ok {
			return ArtifactInstance{}, fmt.Errorf("undeclared placeholder %s", *element.PlaceholderKey)
		}
		value := resolvePlaceholderValue(def, values[def.Key])
		if !value.present {
			if element.Required {
				return ArtifactInstance{}, fmt.Errorf("missing required placeholder %s", def.Key)
			}
			continue
		}
		resolved.PlaceholderKey = strPtr(def.Key)
		if element.Type == "text" {
			resolved.Text = strPtr(value.value)
		} else if element.Type == "image" || element.Type == "image-placeholder" {
			resolved.ImageURL = strPtr(value.value)
		}
		elements = append(elements, resolved)
	}
	inst := ArtifactInstance{
		RuntimeVersion: runtimeVersion,
		InstanceID:     instanceID,
		TemplateID:     template.ID,
		Label:          template.Label,
		BaseType:       template.BaseType,
		LayoutKey:      layoutKey,
		Layout: ResolvedLayout{
			AspectRatio:     layout.AspectRatio,
			BackgroundColor: layout.BackgroundColor,
			BackgroundImage: layout.BackgroundImage,
			Elements:        elements,
		},
		Group: group,
	}
	return inst, nil
}

func findResolvedText(instance ArtifactInstance, placeholderKey string) string {
	for _, el := range instance.Layout.Elements {
		if el.PlaceholderKey != nil && *el.PlaceholderKey == placeholderKey && el.Text != nil {
			return *el.Text
		}
	}
	return ""
}

func derivedLines(instance ArtifactInstance, title string) []string {
	type box struct {
		x, y float64
		text string
	}
	var boxes []box
	for _, el := range instance.Layout.Elements {
		if el.Type == "text" && el.Text != nil {
			boxes = append(boxes, box{el.X, el.Y, *el.Text})
		}
	}
	sort.SliceStable(boxes, func(i, j int) bool {
		if boxes[i].y != boxes[j].y {
			return boxes[i].y < boxes[j].y
		}
		return boxes[i].x < boxes[j].x
	})
	normalized := strings.TrimSpace(title)
	var lines []string
	for _, b := range boxes {
		for _, line := range strings.Split(b.text, "\n") {
			line = strings.TrimSpace(line)
			if line != "" && line != normalized {
				lines = append(lines, line)
			}
		}
	}
	return lines
}
