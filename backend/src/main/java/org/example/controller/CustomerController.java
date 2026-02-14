package org.example.controller;

import java.security.Principal;

import org.example.dto.CustomerProfileDTO;
import org.example.model.UserAccount;
import org.example.repository.CustomerAddressRepository;
import org.example.repository.UserAccountRepository;
import org.example.model.CustomerAddress;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final UserAccountRepository userAccountRepo;
    private final CustomerAddressRepository addressRepo;

    public CustomerController(UserAccountRepository userAccountRepo, CustomerAddressRepository addressRepo) {

        this.userAccountRepo = userAccountRepo;
        this.addressRepo = addressRepo;

    }



    @GetMapping("/{customerId}/profile")
    public ResponseEntity<?> getProfile(
            @PathVariable Integer customerId,
            Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }

        // Find logged-in user
        UserAccount ua = userAccountRepo
                .findByUsernameIgnoreCase(principal.getName())
                .orElse(null);

        if (ua == null || ua.getCustomerId() == null) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        // 🔒 Prevent accessing someone else’s profile
        if (!ua.getCustomerId().equals(customerId)) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        // ✅ Create DTO INSTANCE
        CustomerProfileDTO dto = new CustomerProfileDTO(
                ua.getCustomerId(),
                ua.getEmployeeId(),
                ua.getRole()
                // add more fields later
        );

        //find the address
        Integer cid = ua.getCustomerId();
        CustomerAddress billing = addressRepo
                .findByCustomerIdAndAddressType(cid, "Billing")
                .orElse(null);

        CustomerProfileDTO.BillingDTO billingDTO = new CustomerProfileDTO.BillingDTO();

        if (billing != null) {
            CustomerProfileDTO.AddressDTO addr = new CustomerProfileDTO.AddressDTO();
            addr.street1 = billing.getStreet1();
            addr.city = billing.getCity();
            addr.province = billing.getProvince();
            addr.postalCode = billing.getPostalCode();
            addr.country = billing.getCountry();
            billingDTO.address = addr;
        }

        dto.billing = billingDTO;


        return ResponseEntity.ok(dto);
    }

    @PutMapping("/me/billing-address")
    public ResponseEntity<?> updateBillingAddress(
            @RequestBody CustomerProfileDTO.AddressDTO address,
            Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }

        UserAccount ua = userAccountRepo
                .findByUsernameIgnoreCase(principal.getName())
                .orElse(null);

        if (ua == null || ua.getCustomerId() == null) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        Integer cid = ua.getCustomerId();

        CustomerAddress billing = addressRepo
                .findByCustomerIdAndAddressType(cid, "Billing")
                .orElse(new CustomerAddress());

        billing.setCustomerId(cid);
        billing.setAddressType("Billing");
        billing.setStreet1(address.street1);
        // optional if your DTO has it; if not, remove these 2 lines
        // billing.setStreet2(address.street2);

        billing.setCity(address.city);
        billing.setProvince(address.province);
        billing.setPostalCode(address.postalCode);
        billing.setCountry(address.country);
        billing.setIsPrimary(1);

        addressRepo.save(billing);

        return ResponseEntity.ok().build();
    }

}
