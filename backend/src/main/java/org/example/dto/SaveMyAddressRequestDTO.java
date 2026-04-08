package org.example.dto;

public class SaveMyAddressRequestDTO {
    public String addressType;   // Billing or Service
    public Integer isPrimary;    // optional, backend forces 1
    public String street1;
    public String street2;
    public String city;
    public String province;
    public String postalCode;
    public String country;
}