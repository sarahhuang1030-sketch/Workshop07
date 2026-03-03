/**
 Description: This DTO class is used for updating the user's profile information,
 specifically their first name, last name, and home phone number.
 It serves as a data transfer object between the client and server when a user wants to update their
 profile details.

 Created by: Sarah
 Created on: February 2026
 **/

package org.example.dto;

public class UpdateMyProfileDTO {
    public String firstName;
    public String lastName;
    public String homePhone; // keep naming consistent with DB
}
