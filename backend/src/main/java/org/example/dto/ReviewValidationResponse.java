package org.example.dto;

public class ReviewValidationResponse {
    private boolean safe;
    private String message;
    private String sanitizedText;

    public ReviewValidationResponse() {}

    public ReviewValidationResponse(boolean safe, String message, String sanitizedText) {
        this.safe = safe;
        this.message = message;
        this.sanitizedText = sanitizedText;
    }

    public boolean isSafe() {
        return safe;
    }

    public void setSafe(boolean safe) {
        this.safe = safe;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getSanitizedText() {
        return sanitizedText;
    }

    public void setSanitizedText(String sanitizedText) {
        this.sanitizedText = sanitizedText;
    }
}