package main

import (
	"net"
	"os"
)

// listenAddr is loopback by default (AD-4): a wildcard bind is what makes Windows
// Firewall ask to allow Public/Private networks on every new api.exe path.
// Docker sets LISTEN_HOST=0.0.0.0 so the published 127.0.0.1:3000 mapping can reach the process.
func listenAddr() string {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	host := os.Getenv("LISTEN_HOST")
	if host == "" {
		host = "127.0.0.1"
	}
	return net.JoinHostPort(host, port)
}
