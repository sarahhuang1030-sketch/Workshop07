package org.example.service.ai;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class AiSafetyService {

    private static final List<String> BANNED_WORDS = List.of(
            "badword1",
            "badword2",
            "shit",
            "fuck"
    );

    public String sanitizeInput(String input) {
        if (input == null) return null;

        String sanitized = input;

        for (String word : BANNED_WORDS) {
            String regex = "(?i)\\b" + Pattern.quote(word) + "\\b";
            sanitized = sanitized.replaceAll(regex, "***");
        }

        return sanitized.trim();
    }
}