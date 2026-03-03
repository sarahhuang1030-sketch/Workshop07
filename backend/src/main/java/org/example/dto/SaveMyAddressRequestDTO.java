/**
 Description: This DTO class is used for saving a user's address information,
 including the type of address (billing or service),

 Created by: Sarah
 Created on: February 2026
 **/

package org.example.dto;

public class SaveMyAddressRequestDTO {
    public String addressType;  // "Billing" or "Service"
    public Integer isPrimary;   // 1 or 0 (we'll force 1 in controller for first-time)
    public String street1;
    public String street2;
    public String city;
    public String province;
    public String postalCode;
    public String country;
}
