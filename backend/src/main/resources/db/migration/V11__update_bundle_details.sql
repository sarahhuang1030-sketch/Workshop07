-- Update bundle descriptions
UPDATE Plans
SET Description = 'Affordable home bundle with reliable internet and essential live TV channels.'
WHERE PlanName = 'Internet + TV Starter';

UPDATE Plans
SET Description = 'Great for families who want faster speeds, more entertainment, and everyday value.'
WHERE PlanName = 'Internet + TV Plus';

UPDATE Plans
SET Description = 'A convenient bundle for home internet and mobile service in one monthly package.'
WHERE PlanName = 'Mobile + Internet Bundle';

UPDATE Plans
SET Description = 'Our most complete bundle with premium internet, TV, and mobile benefits included.'
WHERE PlanName = 'Ultimate Bundle';


-- Add bundle perks using PlanFeatures with FeatureName = Perk
INSERT INTO PlanFeatures (PlanId, FeatureName, FeatureValue, Unit, SortOrder)
SELECT PlanId, 'Perk', 'Free installation', NULL, 10
FROM Plans
WHERE PlanName = 'Internet + TV Starter';

INSERT INTO PlanFeatures (PlanId, FeatureName, FeatureValue, Unit, SortOrder)
SELECT PlanId, 'Perk', 'Wi-Fi modem included', NULL, 11
FROM Plans
WHERE PlanName = 'Internet + TV Starter';


INSERT INTO PlanFeatures (PlanId, FeatureName, FeatureValue, Unit, SortOrder)
SELECT PlanId, 'Perk', '1 month free streaming', NULL, 10
FROM Plans
WHERE PlanName = 'Internet + TV Plus';

INSERT INTO PlanFeatures (PlanId, FeatureName, FeatureValue, Unit, SortOrder)
SELECT PlanId, 'Perk', 'Wi-Fi modem included', NULL, 11
FROM Plans
WHERE PlanName = 'Internet + TV Plus';


INSERT INTO PlanFeatures (PlanId, FeatureName, FeatureValue, Unit, SortOrder)
SELECT PlanId, 'Perk', 'Shared account discount', NULL, 10
FROM Plans
WHERE PlanName = 'Mobile + Internet Bundle';

INSERT INTO PlanFeatures (PlanId, FeatureName, FeatureValue, Unit, SortOrder)
SELECT PlanId, 'Perk', 'Bundle savings applied monthly', NULL, 11
FROM Plans
WHERE PlanName = 'Mobile + Internet Bundle';


INSERT INTO PlanFeatures (PlanId, FeatureName, FeatureValue, Unit, SortOrder)
SELECT PlanId, 'Perk', 'Priority support', NULL, 10
FROM Plans
WHERE PlanName = 'Ultimate Bundle';

INSERT INTO PlanFeatures (PlanId, FeatureName, FeatureValue, Unit, SortOrder)
SELECT PlanId, 'Perk', 'Streaming bonus included', NULL, 11
FROM Plans
WHERE PlanName = 'Ultimate Bundle';