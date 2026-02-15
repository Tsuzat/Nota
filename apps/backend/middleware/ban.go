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

func BanMiddleware(c fiber.Ctx) error {
	path := strings.ToLower(c.Path())
	suspicious := false
	for _, badPath := range honeypotPaths {
		p := strings.ToLower(badPath)
		if path == p || strings.HasPrefix(path, p+"/") || strings.HasSuffix(path, p) {
			suspicious = true
			break
		}
	}
	if !suspicious {
		return c.Next()
	}
	log.Warnf("[SECURITY] Dropping suspicious request to path: %s", path)
	return c.Drop()
}
