//this is just testing for azure

package org.example.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/")
    public String home() {
        return "SJY Telecom backend is running";
    }

    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }
}