package org.example.service;

import org.example.dto.PhoneDTO;
import org.example.entity.Phone;
import org.example.repository.PhoneRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PhoneService {

    private final PhoneRepository phoneRepository;

    public PhoneService(PhoneRepository phoneRepository) {
        this.phoneRepository = phoneRepository;
    }

    public List<PhoneDTO> getAllActivePhones() {
        return phoneRepository.findByActiveTrue()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public PhoneDTO getPhoneById(Integer id) {
        Phone phone = phoneRepository.findById(id).orElse(null);
        if (phone == null || Boolean.FALSE.equals(phone.getActive())) {
            return null;
        }
        return toDTO(phone);
    }

    private PhoneDTO toDTO(Phone phone) {
        PhoneDTO dto = new PhoneDTO();
        dto.setPhoneId(phone.getPhoneId());
        dto.setBrand(phone.getBrand());
        dto.setModel(phone.getModel());
        dto.setStorage(phone.getStorage());
        dto.setColor(phone.getColor());
        dto.setMonthlyPrice(phone.getMonthlyPrice());
        dto.setFullPrice(phone.getFullPrice());
        dto.setStockQuantity(phone.getStockQuantity());
        dto.setImageUrl(phone.getImageUrl());
        dto.setDescription(phone.getDescription());
        dto.setActive(phone.getActive());
        dto.setInStock(phone.getStockQuantity() != null && phone.getStockQuantity() > 0);
        return dto;
    }
}