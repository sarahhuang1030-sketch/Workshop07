package org.example.service;

import org.example.dto.ManagerLocationDTO;
import org.example.model.Location;
import org.example.repository.LocationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LocationService {

    private final LocationRepository locationRepository;

    public LocationService(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    public List<ManagerLocationDTO> getAllLocations() {
        return locationRepository.findAll()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public ManagerLocationDTO getLocationById(Integer id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found"));
        return toDTO(location);
    }

    public ManagerLocationDTO createLocation(ManagerLocationDTO request) {
        Location location = new Location();
        applyRequest(location, request);
        return toDTO(locationRepository.save(location));
    }

    public ManagerLocationDTO updateLocation(Integer id, ManagerLocationDTO request) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found"));

        applyRequest(location, request);
        return toDTO(locationRepository.save(location));
    }

    public void deleteLocation(Integer id) {
        if (!locationRepository.existsById(id)) {
            throw new RuntimeException("Location not found");
        }
        locationRepository.deleteById(id);
    }

    private void applyRequest(Location location, ManagerLocationDTO request) {
        location.setLocationName(request.getLocationName());
        location.setLocationType(request.getLocationType());
        location.setStreet1(request.getStreet1());
        location.setStreet2(request.getStreet2());
        location.setCity(request.getCity());
        location.setProvince(request.getProvince());
        location.setPostalCode(request.getPostalCode());
        location.setCountry(request.getCountry());
        location.setPhone(request.getPhone());
        location.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
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