package org.example.dto;

public class RegisterAsCustomerRequestDTO {

        public String customerType;   // "Individual" or "Business"
        public String firstName;
        public String lastName;
        public String businessName;
        public String homePhone;

        // address (billing)
        public String street1;
        public String street2;
        public String city;
        public String province;
        public String postalCode;
        public String country;

        // if you want service address too (optional)
        public Boolean addServiceAddress; // true/false


}
