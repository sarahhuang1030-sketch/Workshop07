package org.example.controller;

import org.example.model.UserAccount;
import org.example.repository.CustomerAddressRepository;
import org.example.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
public class WeatherController {

    private final UserAccountRepository userAccountRepo;
    private final CustomerAddressRepository addressRepo;

    @Value("${weather.openweather.apiKey}")
    private String apiKey;

    public WeatherController(UserAccountRepository userAccountRepo,
                             CustomerAddressRepository addressRepo) {
        this.userAccountRepo = userAccountRepo;
        this.addressRepo = addressRepo;
    }

    @GetMapping("/api/weather")
    public ResponseEntity<?> getWeather(Principal principal) {
        boolean guestMode = (principal == null);

        String city = resolveCity(principal);

        if (city == null || city.isBlank()) {
            city = "Calgary";
        }

        try {
            String encodedCity = URLEncoder.encode(city, StandardCharsets.UTF_8);
            String url = "https://api.openweathermap.org/data/2.5/weather?q="
                    + encodedCity
                    + "&units=metric&appid="
                    + apiKey;

            RestTemplate rest = new RestTemplate();
            Map<?, ?> response = rest.getForObject(url, Map.class);

            Map<String, Object> out = new LinkedHashMap<>();
            out.put("city", city);
            out.put("guestMode", guestMode);
            out.put("source", guestMode ? "guest" : "user");

            if (response != null) {
                Map<?, ?> main = (Map<?, ?>) response.get("main");
                Map<?, ?> wind = (Map<?, ?>) response.get("wind");

                if (main != null) {
                    out.put("tempC", main.get("temp"));
                }

                if (wind != null) {
                    out.put("windSpeed", wind.get("speed"));
                }

                List<?> weatherList = (List<?>) response.get("weather");
                if (weatherList != null && !weatherList.isEmpty()) {
                    Map<?, ?> weather = (Map<?, ?>) weatherList.get(0);
                    out.put("description", weather.get("description"));
                }
            }

            return ResponseEntity.ok(out);
        } catch (Exception ex) {
            return ResponseEntity.ok(Map.of(
                    "city", city,
                    "tempC", 0,
                    "description", "weather unavailable",
                    "windSpeed", 0,
                    "guestMode", guestMode,
                    "source", guestMode ? "guest" : "user"
            ));
        }
    }

    private String resolveCity(Principal principal) {
        if (principal != null) {
            String username = principal.getName();

            UserAccount ua = userAccountRepo
                    .findByUsernameIgnoreCase(username)
                    .orElse(null);

            if (ua != null && ua.getCustomerId() != null) {
                var address = addressRepo
                        .findFirstByCustomerIdOrderByIsPrimaryDesc(ua.getCustomerId())
                        .orElse(null);

                if (address != null && address.getCity() != null && !address.getCity().isBlank()) {
                    return address.getCity();
                }
            }

            // logged-in fallback: do NOT rotate
            return "Calgary";
        }

        List<String> guestCities = List.of("Calgary", "Toronto", "Vancouver");
        long timeBucket = System.currentTimeMillis() / 15000;
        int index = (int) (timeBucket % guestCities.size());

        return guestCities.get(index);
    }
}