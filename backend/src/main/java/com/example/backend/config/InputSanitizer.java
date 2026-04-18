package com.example.backend.config;

import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * Input sanitization utility for preventing XSS and injection attacks.
 * Removes/escapes potentially dangerous characters from user input.
 */
@Component
public class InputSanitizer {

    private static final Pattern XSS_PATTERN = Pattern.compile(
        "<|>|[\r\n]|['\"]|--|(;)|(/\\*|\\*/)|javascript:|on\\w+\\s*=|script",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
        "(')|(\")|(;)|(\\*)|(%)|(--)|(/\\*)|\"?\\s*or\\s*\"?|\"?\\s*and\\s*\"?",
        Pattern.CASE_INSENSITIVE
    );

    /**
     * Sanitize string input to prevent XSS attacks.
     * Removes HTML tags and dangerous JavaScript.
     */
    public static String sanitizeXss(String input) {
        if (input == null) {
            return null;
        }
        return XSS_PATTERN.matcher(input).replaceAll("");
    }

    /**
     * Sanitize string input to prevent SQL injection.
     * Note: This is a basic protection. Use parameterized queries (JPA) for real protection.
     */
    public static String sanitizeSql(String input) {
        if (input == null) {
            return null;
        }
        return SQL_INJECTION_PATTERN.matcher(input).replaceAll("");
    }

    /**
     * Escape HTML entities to prevent XSS in output.
     */
    public static String escapeHtml(String input) {
        if (input == null) {
            return null;
        }
        return input
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }

    /**
     * Validate and trim string input.
     */
    public static String sanitizeBasic(String input) {
        if (input == null) {
            return null;
        }
        return input.trim();
    }

    /**
     * Validate email format (basic check).
     */
    public static boolean isValidEmail(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    }

    /**
     * Validate password strength.
     * Requirements: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special char.
     */
    public static boolean isValidPassword(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }
        return password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$");
    }
}
