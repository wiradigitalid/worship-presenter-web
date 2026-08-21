package pptx

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestDrawWithTimeoutExceeded(t *testing.T) {
	wd, err := os.Getwd()
	if err != nil {
		t.Fatalf("failed to get working dir: %v", err)
	}
	// Locate repository root (two levels up from internal/pptx)
	root := filepath.Clean(filepath.Join(wd, "..", ".."))

	// 1 millisecond timeout should guarantee DeadlineExceeded when invoking node
	_, err = DrawWithTimeout(root, []byte(`{}`), 1*time.Millisecond)
	if err == nil {
		t.Fatalf("expected error from DrawWithTimeout, got nil")
	}
	if !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("expected context.DeadlineExceeded in error chain, got: %v", err)
	}
}

func TestDrawWithContextCancellation(t *testing.T) {
	wd, err := os.Getwd()
	if err != nil {
		t.Fatalf("failed to get working dir: %v", err)
	}
	root := filepath.Clean(filepath.Join(wd, "..", ".."))

	ctx, cancel := context.WithCancel(context.Background())
	cancel() // cancel immediately

	_, err = DrawWithContext(ctx, root, []byte(`{}`))
	if err == nil {
		t.Fatalf("expected error from cancelled context, got nil")
	}
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("expected context.Canceled in error chain, got: %v", err)
	}
}
