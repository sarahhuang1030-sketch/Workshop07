/**
 Description: This DTO class is used for handling customer registration requests for when employee registerater.
 It contains all the necessary fields for registering a new customer, including
 personal information, contact details, and address information. This class serves
 as a data transfer object between the client and server when a user wants to register as a customer.
 c

 Created by: Sarah
 Created on: February 2026
 **/

package org.example.dto;

public class RegisterAsCustomerRequestDTO {

        public String customerType;   // "Individual" or "Business"
        public String firstName;
        public String lastName;
        public String businessName;
        public String homePhone;
        public String email;

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
