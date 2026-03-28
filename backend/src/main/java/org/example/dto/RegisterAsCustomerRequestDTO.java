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
//        public Boolean addServiceAddress; // true/false


        public String getCustomerType() {
                return customerType;
        }

        public void setCustomerType(String customerType) {
                this.customerType = customerType;
        }

        public String getFirstName() {
                return firstName;
        }

        public void setFirstName(String firstName) {
                this.firstName = firstName;
        }

        public String getLastName() {
                return lastName;
        }

        public void setLastName(String lastName) {
                this.lastName = lastName;
        }

        public String getBusinessName() {
                return businessName;
        }

        public void setBusinessName(String businessName) {
                this.businessName = businessName;
        }

        public String getHomePhone() {
                return homePhone;
        }

        public void setHomePhone(String homePhone) {
                this.homePhone = homePhone;
        }

        public String getEmail() {
                return email;
        }

        public void setEmail(String email) {
                this.email = email;
        }

        public String getStreet1() {
                return street1;
        }

        public void setStreet1(String street1) {
                this.street1 = street1;
        }

        public String getStreet2() {
                return street2;
        }

        public void setStreet2(String street2) {
                this.street2 = street2;
        }

        public String getCity() {
                return city;
        }

        public void setCity(String city) {
                this.city = city;
        }

        public String getProvince() {
                return province;
        }

        public void setProvince(String province) {
                this.province = province;
        }

        public String getPostalCode() {
                return postalCode;
        }

        public void setPostalCode(String postalCode) {
                this.postalCode = postalCode;
        }

        public String getCountry() {
                return country;
        }

        public void setCountry(String country) {
                this.country = country;
        }
}
