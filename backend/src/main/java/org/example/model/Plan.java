package org.example.model;

import jakarta.persistence.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;

@Entity
@Table(name = "plans")
public class Plan {

    @Id
    @Column(name = "PlanId")
    private Integer planId;

    @Column(name = "ServiceTypeId")
    private Integer serviceTypeId;

    @Column(name = "PlanName")
    private String planName;

    @Column(name = "MonthlyPrice")
    private BigDecimal monthlyPrice;

    @Column(name = "ContractTermMonths")
    private Integer contractTermMonths;

    @Column(name = "Description")
    private String description;

    @Column(name = "IsActive")
    private Boolean isActive;

    @Column(name = "Tagline")
    private String tagline;

    @Column(name = "Badge")
    private String badge;

    @Column(name = "IconKey")
    private String iconKey;

    @Column(name = "ThemeKey")
    private String themeKey;

    @Column(name = "DataLabel")
    private String dataLabel;

    // ===== GETTERS =====

    public Integer getPlanId() {
        return planId;
    }
    public void setPlanId(Integer planId) { this.planId = planId; }

    public Integer getServiceTypeId() {
        return serviceTypeId;
    }

    public String getPlanName() {
        return planName;
    }
    public void setPlanName(String planName) { this.planName = planName; }

    public BigDecimal getMonthlyPrice() {
        return monthlyPrice;
    }
    public void setMonthlyPrice(java.math.BigDecimal monthlyPrice) { this.monthlyPrice = monthlyPrice; }

    public Integer getContractTermMonths() {
        return contractTermMonths;
    }

    public String getDescription() {
        return description;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public String getTagline() {
        return tagline;
    }

    public String getBadge() {
        return badge;
    }

    public String getIconKey() {
        return iconKey;
    }

    public String getThemeKey() {
        return themeKey;
    }

    public String getDataLabel() {
        return dataLabel;
    }
}