package org.example.service;

import org.example.dto.RegisterAsCustomerRequestDTO;
import org.example.model.Customer;
import org.example.model.CustomerAddress;
import org.example.model.UserAccount;
import org.example.repository.CustomerAddressRepository;
import org.example.repository.CustomerRepository;
import org.example.repository.UserAccountRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class AgentCustomerService {
    private final UserAccountRepository userAccountRepo;
    private final CustomerRepository customerRepo;
    private final CustomerAddressRepository addressRepo;

    private String oauthPasswordMarker(String provider) {
        String p = (provider == null ? "oauth" : provider.trim().toLowerCase());
        return "OAUTH:" + p; // e.g. OAUTH:google, OAUTH:github, OAUTH:facebook
    }

    private String stripProviderPrefix(String key) {
        if (key == null) return null;
        String s = key.trim();
        int i = s.indexOf(':');
        return (i > 0 ? s.substring(i + 1) : s).trim(); // github:abc -> abc
    }

    public AgentCustomerService(UserAccountRepository userAccountRepo,
                                CustomerRepository customerRepo,
                                CustomerAddressRepository addressRepo) {
        this.userAccountRepo = userAccountRepo;
        this.customerRepo = customerRepo;
        this.addressRepo = addressRepo;
    }


    @Transactional
    public Object registerAsCustomer(String key, String provider, String externalId,
                                     String firstName, String lastName,
                                     RegisterAsCustomerRequestDTO req) {

        String username = stripProviderPrefix(key);

        if (req.customerType == null || req.customerType.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "customerType is required"));
        }

        if (provider == null || provider.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing OAuth provider"));
        }

        if (externalId == null || externalId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing OAuth externalId"));
        }



        if (req.street1 == null || req.street1.isBlank()
                || req.city == null || req.city.isBlank()
                || req.province == null || req.province.isBlank()
                || req.postalCode == null || req.postalCode.isBlank()
                || req.country == null || req.country.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Billing address is incomplete",
                    "street1", req.street1,
                    "city", req.city,
                    "province", req.province,
                    "postalCode", req.postalCode,
                    "country", req.country
            ));
        }

        // Prevent duplicates for the same OAuth identity
        var existing = customerRepo.findByExternalProviderAndExternalCustomerId(provider, externalId);
        if (existing.isPresent()) {
            Customer c = existing.get();
            if (c.getPasswordHash() == null) {
                c.setPasswordHash("OAUTH");
                customerRepo.save(c);
            }

            String marker = oauthPasswordMarker(provider);

            UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(username)
                    .orElseGet(UserAccount::new);

            ua.setUsername(username);
            ua.setRole("Customer");
            ua.setCustomerId(c.getCustomerId());
            ua.setEmployeeId(null);
            ua.setLastLoginAt(LocalDateTime.now());
            ua.setIsLocked(0);
            if (ua.getPasswordHash() == null || ua.getPasswordHash().isBlank()) {
                ua.setPasswordHash(marker);
            }
            userAccountRepo.save(ua);

            return ResponseEntity.ok(Map.of(
                    "status", "REGISTERED",
                    "customerId", c.getCustomerId(),
                    "lookupKey", key
            ));
        }

        // Create new customer
        String normalizedType = "Business".equalsIgnoreCase(req.customerType) ? "Business" : "Individual";

        Customer c = new Customer();
        c.setCustomerType(normalizedType);

        if ("Business".equalsIgnoreCase(normalizedType)) {
            if (req.businessName == null || req.businessName.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "businessName is required for Business"));
            }
            c.setBusinessName(req.businessName.trim());
        } else {
            c.setBusinessName(null);
        }

        // Prefer req first/last if provided, fall back to oauth-derived values
        String fn = (req.firstName != null && !req.firstName.isBlank()) ? req.firstName : firstName;
        String ln = (req.lastName != null && !req.lastName.isBlank()) ? req.lastName : lastName;

        fn = fn == null ? null : fn.trim();
        ln = ln == null ? null : ln.trim();

        if (fn == null || fn.isBlank() || ln == null || ln.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "firstName and lastName are required"));
        }

        c.setFirstName(fn);
        c.setLastName(ln);

        if (req.email == null || req.email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "email is required"));
        }

        if (customerRepo.existsByEmail(req.email.trim().toLowerCase())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
        }
        c.setEmail(req.email.trim().toLowerCase());

        if (req.homePhone == null || req.homePhone.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "homePhone is required"));
        }
        c.setHomePhone(req.homePhone.trim());


        c.setExternalProvider(provider);
        c.setExternalCustomerId(externalId);

        c.setStatus("Active");
        c.setCreatedAt(LocalDateTime.now());

        String marker = oauthPasswordMarker(provider);
        c.setPasswordHash(marker);
        c = customerRepo.save(c);

        // Save billing address
        CustomerAddress billing = new CustomerAddress();
        billing.setCustomerId(c.getCustomerId());
        billing.setAddressType("Billing");
        billing.setStreet1(req.street1.trim());
        billing.setStreet2(req.street2 == null ? null : req.street2.trim());
        billing.setCity(req.city.trim());
        billing.setProvince(req.province.trim());
        billing.setPostalCode(req.postalCode.trim());
        billing.setCountry(req.country.trim());
        billing.setIsPrimary(1);
        addressRepo.save(billing);

        // Create/link user account
        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(key)
                .orElseGet(UserAccount::new);

        ua.setUsername(key);
        ua.setRole("Customer");
        ua.setCustomerId(c.getCustomerId());
        ua.setEmployeeId(null);
        ua.setLastLoginAt(LocalDateTime.now());
        ua.setIsLocked(0);
        ua.setPasswordHash(marker);
        userAccountRepo.save(ua);

        return ResponseEntity.ok(Map.of(
                "status", "REGISTERED",
                "customerId", c.getCustomerId(),
                "lookupKey", key
        ));
    }

}