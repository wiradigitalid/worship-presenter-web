package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/wiradigitalid/worship-presenter-web/internal/db"
	"github.com/wiradigitalid/worship-presenter-web/internal/httpapi"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	root, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}
	if env := os.Getenv("REPO_ROOT"); env != "" {
		root = env
	}
	root, err = filepath.Abs(root)
	if err != nil {
		log.Fatal(err)
	}
	handle, err := db.Open(os.Getenv("DB_PATH"))
	if err != nil {
		log.Fatal(err)
	}
	defer handle.Close()
	srv := &httpapi.Server{DB: handle, Root: root}
	addr := ":" + port
	log.Printf("api listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, srv.Handler()))
}
