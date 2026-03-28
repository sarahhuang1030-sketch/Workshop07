package org.example.controller;

import org.example.dto.ManagerLocationDTO;
import org.example.model.Location;
import org.example.repository.ManagerLocationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager/location")
public class ManagerLocationController {
    private final ManagerLocationRepository locationRepository;

    public ManagerLocationController(ManagerLocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    @GetMapping
    public List<ManagerLocationDTO> getAllLocations() {
        return locationRepository.findAll()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @PostMapping
    public ManagerLocationDTO createLocation(@RequestBody ManagerLocationDTO dto) {
        Location location = new Location();
        applyDtoToEntity(dto, location);
        Location saved = locationRepository.save(location);
        return toDTO(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ManagerLocationDTO> updateLocation(
            @PathVariable Integer id,
            @RequestBody ManagerLocationDTO dto
    ) {
        return locationRepository.findById(id)
                .map(location -> {
                    applyDtoToEntity(dto, location);
                    Location saved = locationRepository.save(location);
                    return ResponseEntity.ok(toDTO(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLocation(@PathVariable Integer id) {
        if (!locationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        locationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<ManagerLocationDTO> updateLocationActive(
            @PathVariable Integer id,
            @RequestBody Map<String, Boolean> body
    ) {
        return locationRepository.findById(id)
                .map(location -> {
                    Boolean isActive = body.get("isActive");
                    location.setIsActive(isActive);
                    Location saved = locationRepository.save(location);
                    return ResponseEntity.ok(toDTO(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private void applyDtoToEntity(ManagerLocationDTO dto, Location location) {
        location.setLocationName(dto.getLocationName());
        location.setLocationType(dto.getLocationType());
        location.setStreet1(dto.getStreet1());
        location.setStreet2(dto.getStreet2());
        location.setCity(dto.getCity());
        location.setProvince(dto.getProvince());
        location.setPostalCode(dto.getPostalCode());
        location.setCountry(dto.getCountry());
        location.setPhone(dto.getPhone());
        location.setIsActive(dto.getIsActive());
    }

    private ManagerLocationDTO toDTO(Location location) {
        ManagerLocationDTO dto = new ManagerLocationDTO();
        dto.setLocationId(location.getLocationId());
        dto.setLocationName(location.getLocationName());
        dto.setLocationType(location.getLocationType());
        dto.setStreet1(location.getStreet1());
        dto.setStreet2(location.getStreet2());
        dto.setCity(location.getCity());
        dto.setProvince(location.getProvince());
        dto.setPostalCode(location.getPostalCode());
        dto.setCountry(location.getCountry());
        dto.setPhone(location.getPhone());
        dto.setIsActive(location.getIsActive());
        return dto;
    }

}
