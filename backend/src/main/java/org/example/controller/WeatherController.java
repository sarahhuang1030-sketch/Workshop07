package org.example.controller;

import org.example.model.UserAccount;
import org.example.repository.CustomerAddressRepository;
import org.example.repository.UserAccountRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.security.Principal;
import java.util.LinkedHashMap;
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

        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        String username = principal.getName();

        UserAccount ua = userAccountRepo
                .findByUsernameIgnoreCase(username)
                .orElse(null);

        if (ua == null || ua.getCustomerId() == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Customer not found"));
        }

        var address = addressRepo
                .findFirstByCustomerIdOrderByIsPrimaryDesc(ua.getCustomerId())
                .orElse(null);

        if (address == null) {
            return ResponseEntity.status(400).body(Map.of("error", "No address found"));
        }

        String city = address.getCity();

        String url =
                "https://api.openweathermap.org/data/2.5/weather?q="
                        + city
                        + "&units=metric&appid="
                        + apiKey;

        RestTemplate rest = new RestTemplate();
        Map<?, ?> response = rest.getForObject(url, Map.class);

        Map<String, Object> out = new LinkedHashMap<>();

        out.put("city", city);

        if (response != null) {

            Map<?, ?> main = (Map<?, ?>) response.get("main");
            Map<?, ?> wind = (Map<?, ?>) response.get("wind");

            out.put("tempC", main.get("temp"));
            out.put("windSpeed", wind.get("speed"));

            var weatherList = (java.util.List<?>) response.get("weather");

            if (weatherList != null && !weatherList.isEmpty()) {
                Map<?, ?> weather = (Map<?, ?>) weatherList.get(0);
                out.put("description", weather.get("description"));
            }
        }

        return ResponseEntity.ok(out);
    }
}