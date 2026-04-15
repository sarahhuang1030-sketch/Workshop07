package org.example.service.ai;

public class UnsafePromptException extends RuntimeException {

    private final String category;

    public UnsafePromptException(String message, String category) {
        super(message);
        this.category = category;
    }

    public String getCategory() {
        return category;
    }
}