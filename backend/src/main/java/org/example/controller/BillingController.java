package org.example.controller;

import org.example.model.Customer;
import org.example.model.CustomerAddress;
import org.example.repository.CustomerAddressRepository;
import org.example.repository.CustomerRepository;
import org.example.repository.UserAccountRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.LinkedHashMap;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private final UserAccountRepository userAccountRepo;
    private final CustomerRepository customerRepo;
    private final CustomerAddressRepository customerAddressRepo;

    public BillingController(
            UserAccountRepository userAccountRepo,
            CustomerRepository customerRepo,
            CustomerAddressRepository customerAddressRepo
    ) {
        this.userAccountRepo = userAccountRepo;
        this.customerRepo = customerRepo;
        this.customerAddressRepo = customerAddressRepo;
    }

    public record AddressUpdateRequest(
            String street1,
            String street2,
            String city,
            String province,
            String postalCode,
            String country
    ) {}

    @Transactional
    @PutMapping("/address")
    public ResponseEntity<?> updateAddress(Principal principal,
                                           @RequestBody AddressUpdateRequest req) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("Not authenticated");
            }

            var uaOpt = userAccountRepo.findByUsernameIgnoreCase(principal.getName());
            if (uaOpt.isEmpty()) {
                return ResponseEntity.status(401).body("Not authenticated");
            }

            var ua = uaOpt.get();
            Integer customerId = ua.getCustomerId();

            // ✅ OPTION 2: create a customer if missing
            if (customerId == null) {
                Customer c = new Customer();

                // REQUIRED fields in your Customer entity (nullable=false)
                c.setCustomerType("Individual");

                // Use username as email if it looks like one; otherwise make a placeholder
                String email = ua.getUsername();
                if (email == null || !email.contains("@")) {
                    email = "ua-" + ua.getUserId() + "@placeholder.local";
                }

                var existing = customerRepo.findFirstByEmailIgnoreCase(email);
                if (existing.isPresent()) {
                    customerId = existing.get().getCustomerId();
                } else {
                    c = new Customer();
                    c.setCustomerType("Individual");
                    c.setEmail(email);
                    c.setHomePhone("0000000000");
                    c.setPasswordHash(ua.getPasswordHash());
                    c = customerRepo.save(c);
                    customerId = c.getCustomerId();
                }

                ua.setCustomerId(customerId);
                userAccountRepo.save(ua);

            }
            final Integer finalCustomerId = customerId;
            // ✅ Prefer BILLING address (since you have AddressType)
            var addr = customerAddressRepo
                    .findFirstByCustomerIdAndAddressTypeOrderByIsPrimaryDesc(customerId, "Billing")
                    .orElseGet(() -> {
                        var a = new CustomerAddress();
                        a.setCustomerId(finalCustomerId);
                        a.setAddressType("Billing");  // IMPORTANT: AddressType is NOT NULL
                        a.setIsPrimary(1);
                        return a;
                    });


            if (addr.getAddressType() == null) addr.setAddressType("Billing");
            if (addr.getIsPrimary() == null) addr.setIsPrimary(1);

            addr.setStreet1(req.street1());
            addr.setStreet2(req.street2());
            addr.setCity(req.city());
            addr.setProvince(req.province());
            addr.setPostalCode(req.postalCode());
            addr.setCountry(req.country());

            customerAddressRepo.save(addr);



            // return what the frontend needs (keep same shape)
            var out = new LinkedHashMap<String, Object>();
            out.put("street1", addr.getStreet1());
            out.put("street2", addr.getStreet2());
            out.put("city", addr.getCity());
            out.put("province", addr.getProvince());
            out.put("postalCode", addr.getPostalCode());
            out.put("country", addr.getCountry());

            // (optional but useful) return new customerId so UI can show it immediately
            out.put("customerId", customerId);

            return ResponseEntity.ok(out);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to update billing address");
        }
    }
}
