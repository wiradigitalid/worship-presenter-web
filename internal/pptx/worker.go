package pptx

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"time"
)

var DefaultDrawTimeout = 45 * time.Second

func Draw(root string, payload []byte) ([]byte, error) {
	return DrawWithTimeout(root, payload, DefaultDrawTimeout)
}

func DrawWithTimeout(root string, payload []byte, timeout time.Duration) ([]byte, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	return DrawWithContext(ctx, root, payload)
}

func DrawWithContext(ctx context.Context, root string, payload []byte) ([]byte, error) {
	node := os.Getenv("NODE_BIN")
	if node == "" {
		node = "node"
	}
	// Relative paths: Node's --import treats a Windows "D:\..." path as a URL scheme.
	cmd := exec.CommandContext(
		ctx,
		node,
		"--import", "./workers/pptx/register.mjs",
		"--experimental-strip-types",
		"./workers/pptx/draw.mjs",
	)
	cmd.Dir = root
	cmd.Stdin = bytes.NewReader(payload)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		if errors.Is(ctx.Err(), context.DeadlineExceeded) {
			return nil, fmt.Errorf("pptx worker timed out: %w", ctx.Err())
		}
		if ctx.Err() != nil {
			return nil, fmt.Errorf("pptx worker cancelled: %w", ctx.Err())
		}
		return nil, fmt.Errorf("pptx worker: %w: %s", err, stderr.String())
	}
	return stdout.Bytes(), nil
}

