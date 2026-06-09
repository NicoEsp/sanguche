-- Adds the one-shot plan values to subscription_plan enum.
--
-- The values productprepa_business and productastic_review existed in earlier
-- local migration files (20260508140000 and 20260608230000) but were never
-- applied to the production database, which caused the webhook to silently
-- misclassify the Firmaway B2B order (variant 1626770) as a Premium monthly
-- subscription. This migration brings prod in sync.

ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'productprepa_business';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'productastic_review';
