package org.example.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "serviceappointments")
public class ServiceAppointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "AppointmentId")
    private Integer appointmentId;

    @Column(name = "RequestId")
    private Integer requestId;

    @Column(name = "TechnicianUserId")
    private Integer technicianUserId;

    @Column(name = "AddressId")
    private Integer addressId;

    @Column(name = "LocationId")
    private Integer locationId;

    public enum ServiceLocationType {
        OnSite,
        InStore,
        Remote
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "LocationType")
    private ServiceLocationType locationType;

    @Column(name = "ScheduledStart")
    private LocalDateTime scheduledStart;

    @Column(name = "ScheduledEnd")
    private LocalDateTime scheduledEnd;

    @Column(name = "Status")
    private String status;

    @Column(name = "Notes")
    private String notes;

    // getters & setters

    public Integer getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Integer appointmentId) {
        this.appointmentId = appointmentId;
    }

    public Integer getRequestId() {
        return requestId;
    }

    public void setRequestId(Integer requestId) {
        this.requestId = requestId;
    }

    public Integer getTechnicianUserId() {
        return technicianUserId;
    }

    public void setTechnicianUserId(Integer technicianUserId) {
        this.technicianUserId = technicianUserId;
    }

    public Integer getAddressId() {
        return addressId;
    }

    public void setAddressId(Integer addressId) {
        this.addressId = addressId;
    }

    public Integer getLocationId() {
        return locationId;
    }

    public void setLocationId(Integer locationId) {
        this.locationId = locationId;
    }

    public ServiceLocationType getLocationType() {
        return locationType;
    }

    public void setLocationType(ServiceLocationType locationType) {
        this.locationType = locationType;
    }

    public LocalDateTime getScheduledStart() {
        return scheduledStart;
    }

    public void setScheduledStart(LocalDateTime scheduledStart) {
        this.scheduledStart = scheduledStart;
    }

    public LocalDateTime getScheduledEnd() {
        return scheduledEnd;
    }

    public void setScheduledEnd(LocalDateTime scheduledEnd) {
        this.scheduledEnd = scheduledEnd;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}