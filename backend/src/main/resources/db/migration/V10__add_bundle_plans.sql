-- 1. Add new service type
INSERT INTO ServiceTypes (Name)
VALUES ('Bundle');

-- 2. Get Bundle ServiceTypeId
-- (This assumes auto-increment, safe approach using subquery)

-- 3. Insert bundle plans
INSERT INTO Plans (PlanName, MonthlyPrice, Description, ServiceTypeId, IsActive)
VALUES
    ('Internet + TV Starter', 79, 'Starter bundle with internet and TV',
     (SELECT ServiceTypeId FROM ServiceTypes WHERE Name = 'Bundle'), TRUE),

    ('Internet + TV Plus', 99, 'Faster internet with more TV channels',
     (SELECT ServiceTypeId FROM ServiceTypes WHERE Name = 'Bundle'), TRUE),

    ('Mobile + Internet Bundle', 89, 'Mobile and home internet combo',
     (SELECT ServiceTypeId FROM ServiceTypes WHERE Name = 'Bundle'), TRUE),

    ('Ultimate Bundle', 129, 'Full package: internet, TV, and mobile',
     (SELECT ServiceTypeId FROM ServiceTypes WHERE Name = 'Bundle'), TRUE);


-- 4. Add features (same structure you're already using)

INSERT INTO PlanFeatures (PlanId, FeatureName, FeatureValue, Unit, SortOrder)
SELECT PlanId, 'Speed', '150', 'Mbps', 1 FROM Plans WHERE PlanName = 'Internet + TV Starter';

INSERT INTO PlanFeatures (PlanId, FeatureName, FeatureValue, Unit, SortOrder)
SELECT PlanId, 'TV', 'Basic Channels', NULL, 2 FROM Plans WHERE PlanName = 'Internet + TV Starter';


INSERT INTO PlanFeatures (PlanId, FeatureName, FeatureValue, Unit, SortOrder)
SELECT PlanId, 'Speed', '500', 'Mbps', 1 FROM Plans WHERE PlanName = 'Internet + TV Plus';

INSERT INTO PlanFeatures (PlanId, FeatureName, FeatureValue, Unit, SortOrder)
SELECT PlanId, 'TV', 'Premium Channels', NULL, 2 FROM Plans WHERE PlanName = 'Internet + TV Plus';


INSERT INTO PlanFeatures (PlanId, FeatureName, FeatureValue, Unit, SortOrder)
SELECT PlanId, 'Internet', '100 Mbps', NULL, 1 FROM Plans WHERE PlanName = 'Mobile + Internet Bundle';

INSERT INTO PlanFeatures (PlanId, FeatureName, FeatureValue, Unit, SortOrder)
SELECT PlanId, 'Mobile', 'Unlimited Talk & Text', NULL, 2 FROM Plans WHERE PlanName = 'Mobile + Internet Bundle';


INSERT INTO PlanFeatures (PlanId, FeatureName, FeatureValue, Unit, SortOrder)
SELECT PlanId, 'Internet', '1 Gbps', NULL, 1 FROM Plans WHERE PlanName = 'Ultimate Bundle';

INSERT INTO PlanFeatures (PlanId, FeatureName, FeatureValue, Unit, SortOrder)
SELECT PlanId, 'TV', 'Premium Package', NULL, 2 FROM Plans WHERE PlanName = 'Ultimate Bundle';

INSERT INTO PlanFeatures (PlanId, FeatureName, FeatureValue, Unit, SortOrder)
SELECT PlanId, 'Mobile', 'Unlimited Plan', NULL, 3 FROM Plans WHERE PlanName = 'Ultimate Bundle';