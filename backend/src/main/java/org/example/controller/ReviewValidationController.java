package org.example.controller;

import org.example.dto.ReviewValidationRequest;
import org.example.dto.ReviewValidationResponse;
import org.example.service.ai.AiSafetyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/reviews")
public class ReviewValidationController {

    private final AiSafetyService aiSafetyService;

    public ReviewValidationController(AiSafetyService aiSafetyService) {
        this.aiSafetyService = aiSafetyService;
    }

    @PostMapping("/validate")
    public ResponseEntity<ReviewValidationResponse> validateReview(
            @RequestBody ReviewValidationRequest request
    ) {
        String text = request.getText();

        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ReviewValidationResponse(false, "Review cannot be empty.", null));
        }

        String sanitized = aiSafetyService.sanitizeInput(text);

        boolean changed = !text.equals(sanitized);

        if (changed) {
            return ResponseEntity.ok(
                    new ReviewValidationResponse(
                            false,
                            "Your review contains inappropriate or unsafe language.",
                            sanitized
                    )
            );
        }

        return ResponseEntity.ok(
                new ReviewValidationResponse(
                        true,
                        "Review is safe.",
                        sanitized
                )
        );
    }
}
