package org.example.controller;

import org.example.dto.SiteFeatureDTO;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/site-features")
public class SiteFeatureController {

    @GetMapping
    public List<SiteFeatureDTO> getFeatures() {
        return List.of(
                new SiteFeatureDTO("signal", "5G+ Network", "Lightning fast speeds"),
                new SiteFeatureDTO("headphones", "24/7 Support", "We’re always here"),
                new SiteFeatureDTO("gift", "Earn Rewards", "Points with every payment"),
                new SiteFeatureDTO("heart", "No Contracts", "Cancel anytime, free")
        );
    }
}
