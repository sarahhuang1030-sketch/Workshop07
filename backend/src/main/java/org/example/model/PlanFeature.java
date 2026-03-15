package org.example.model;

import jakarta.persistence.*;

@Entity
@Table(name = "planfeatures")
public class PlanFeature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "FeatureId")
    private Integer featureId;

    @Column(name = "PlanId", nullable = false)
    private Integer planId;

    @Column(name = "FeatureName", nullable = false, length = 100)
    private String featureName;

    @Column(name = "FeatureValue", nullable = false, length = 255)
    private String featureValue;

    @Column(name = "Unit", length = 50)
    private String unit;

    @Column(name = "SortOrder")
    private Integer sortOrder;

    public Integer getFeatureId() {
        return featureId;
    }

    public void setFeatureId(Integer featureId) {
        this.featureId = featureId;
    }

    public Integer getPlanId() {
        return planId;
    }

    public void setPlanId(Integer planId) {
        this.planId = planId;
    }

    public String getFeatureName() {
        return featureName;
    }

    public void setFeatureName(String featureName) {
        this.featureName = featureName;
    }

    public String getFeatureValue() {
        return featureValue;
    }

    public void setFeatureValue(String featureValue) {
        this.featureValue = featureValue;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}