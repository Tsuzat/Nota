package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
)

var honeypotPaths = []string{
	"/.env",
	"/.git",
	"/wp-config.php",
	"/config.php",
	"/id_rsa",
	"/.ssh",
	"/phpinfo.php",
	"/admin.php",
	"/.ds_store",
	"/composer.lock",
	"/package.json",
	"/node_modules",
	"/public/.env",
	"/storage/logs",
	"/docker-compose.yml",
	"/Dockerfile",
	"/.aws/credentials",
	"/.azure/credentials",
	"/api-keys.json",
	"/secrets.json",
	"/web.config",
	"/crossdomain.xml",
	"/.htaccess",
	"/parameters.json",
	"/parameters.yml",
	"/app.yml",
	"/app.json",
	"/settings.json",
	"/settings.php",
	"/.gitconfig",
	"/k8s.yaml",
	"/kubernetes.yml",
	"/.docker",
	"/.dockerenv",
	"/docker-compose.yaml",
	"/apikeys.json",
	"/api_keys.json",
	"/tokens.json",
	"/keys.json",
	"/credentials.json",
	"/azure.json",
	"/gcp-credentials.json",
	"/.gcloud",
	"/s3.yml",
	"/.s3cfg",
	"/aws-config.json",
	"/aws.json",
	"/.aws",
	"/php_error.log",
	"/php_errors.log",
	"/error_log",
	"/debug.txt",
	"/errors.log",
	"/error.log",
	"/debug.log",
	"/config~",
	"/config.save",
	"/config.old",
	"/config.bak",
	"/www.zip",
	"/site.zip",
	"/backup.tar.gz",
	"/backup.zip",
	"/database.sql",
	"/backup.sql",
	"/wp-config.txt",
	"/bootstrap/cache",
}

var (
	honeypotExact  = make(map[string]bool)
	honeypotPrefix []string
	honeypotSuffix []string
)

func init() {
	for _, p := range honeypotPaths {
		lower := strings.ToLower(p)
		honeypotExact[lower] = true
		honeypotPrefix = append(honeypotPrefix, lower+"/")
		honeypotSuffix = append(honeypotSuffix, lower)
	}
}

func BanMiddleware(c fiber.Ctx) error {
	path := strings.ToLower(c.Path())
	
	if honeypotExact[path] {
		log.Warnf("[SECURITY] Dropping suspicious request to path: %s", path)
		return c.Drop()
	}

	for _, pre := range honeypotPrefix {
		if strings.HasPrefix(path, pre) {
			log.Warnf("[SECURITY] Dropping suspicious request to path: %s", path)
			return c.Drop()
		}
	}

	for _, suf := range honeypotSuffix {
		if strings.HasSuffix(path, suf) {
			log.Warnf("[SECURITY] Dropping suspicious request to path: %s", path)
			return c.Drop()
		}
	}

	return c.Next()
}
