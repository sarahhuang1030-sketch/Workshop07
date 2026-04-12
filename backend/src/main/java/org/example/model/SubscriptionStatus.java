package org.example.model;

import jakarta.persistence.*;

@Entity
@Table(name = "subscriptionstatuses")
public class SubscriptionStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "StatusId")
    private Integer statusId;

    @Column(name = "StatusCode", nullable = false, length = 30)
    private String statusCode;

    @Column(name = "DisplayName", nullable = false, length = 50)
    private String displayName;

    @Column(name = "IsActive")
    private Boolean isActive;

    @Column(name = "SortOrder")
    private Integer sortOrder;

//    @Column(name = "BadgeColor", length = 20)
//    private String badgeColor;

    public SubscriptionStatus() {
    }

    public Integer getStatusId() {
        return statusId;
    }

    public void setStatusId(Integer statusId) {
        this.statusId = statusId;
    }

    public String getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(String statusCode) {
        this.statusCode = statusCode;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
//
//    public String getBadgeColor() {
//        return badgeColor;
//    }
//
//    public void setBadgeColor(String badgeColor) {
//        this.badgeColor = badgeColor;
//    }
}