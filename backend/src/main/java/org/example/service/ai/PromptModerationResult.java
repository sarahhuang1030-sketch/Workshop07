package org.example.service.ai;

public class PromptModerationResult {

    private final boolean allowed;
    private final String message;
    private final String category;

    public PromptModerationResult(boolean allowed, String message, String category) {
        this.allowed = allowed;
        this.message = message;
        this.category = category;
    }

    public boolean isAllowed() {
        return allowed;
    }

    public String getMessage() {
        return message;
    }

    public String getCategory() {
        return category;
    }

    public static PromptModerationResult allowed() {
        return new PromptModerationResult(true, null, null);
    }

    public static PromptModerationResult blocked(String message, String category) {
        return new PromptModerationResult(false, message, category);
    }
}