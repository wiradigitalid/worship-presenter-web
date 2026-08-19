package pptx

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
)

func Draw(root string, payload []byte) ([]byte, error) {
	node := os.Getenv("NODE_BIN")
	if node == "" {
		node = "node"
	}
	// Relative paths: Node's --import treats a Windows "D:\..." path as a URL scheme.
	cmd := exec.Command(
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
		return nil, fmt.Errorf("pptx worker: %w: %s", err, stderr.String())
	}
	return stdout.Bytes(), nil
}
