package asynqmon

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

const (
	sessionCookieName = "asynqmon_session"
	sessionTTL        = 24 * time.Hour

	redisUserKeyPrefix    = "asynqmon:auth:user:"
	redisSessionKeyPrefix = "asynqmon:auth:session:"
)

func userRedisKey(username string) string {
	return redisUserKeyPrefix + username
}

func sessionRedisKey(token string) string {
	return redisSessionKeyPrefix + token
}

// SetCredentials stores bcrypt-hashed password for the given username in Redis.
func SetCredentials(rc redis.UniversalClient, username, password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}
	return rc.Set(context.Background(), userRedisKey(username), string(hash), 0).Err()
}

// checkCredentials verifies username and password against the stored hash in Redis.
// Returns nil if credentials are valid.
func checkCredentials(rc redis.UniversalClient, username, password string) error {
	hash, err := rc.Get(context.Background(), userRedisKey(username)).Result()
	if errors.Is(err, redis.Nil) {
		return errors.New("invalid credentials")
	}
	if err != nil {
		return fmt.Errorf("redis error: %w", err)
	}
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)); err != nil {
		return errors.New("invalid credentials")
	}
	return nil
}

// createSession generates a random session token, stores it in Redis, and returns it.
func createSession(rc redis.UniversalClient, username string) (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to generate session token: %w", err)
	}
	token := hex.EncodeToString(b)
	err := rc.Set(context.Background(), sessionRedisKey(token), username, sessionTTL).Err()
	if err != nil {
		return "", fmt.Errorf("failed to store session: %w", err)
	}
	return token, nil
}

// deleteSession removes a session token from Redis.
func deleteSession(rc redis.UniversalClient, token string) error {
	return rc.Del(context.Background(), sessionRedisKey(token)).Err()
}

// getSessionUser returns the username associated with the given session token.
// Returns redis.Nil error if token is not found or expired.
func getSessionUser(rc redis.UniversalClient, token string) (string, error) {
	return rc.Get(context.Background(), sessionRedisKey(token)).Result()
}

// publicAPIPaths are API paths that do not require authentication.
var publicAPIPaths = map[string]bool{
	"/login":        true,
	"/logout":       true,
	"/login_status": true,
}

// authMiddleware protects handlers by requiring a valid session cookie.
// The /api/login, /api/logout, and /api/login_status endpoints are always accessible.
func authMiddleware(rc redis.UniversalClient, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Strip the /api prefix and check if path is public.
		path := r.URL.Path
		// Remove everything before the last path segment group to get the tail.
		// e.g. "/asynqmon/api/login" → check suffix "/login"
		for suffix := range publicAPIPaths {
			if strings.HasSuffix(path, suffix) {
				next.ServeHTTP(w, r)
				return
			}
		}

		cookie, err := r.Cookie(sessionCookieName)
		if err != nil {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}
		if _, err := getSessionUser(rc, cookie.Value); err != nil {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}
