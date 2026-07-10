-- ============================================
-- Fix Facility Assignment Issues
-- ============================================
-- This script assigns all users without a facility
-- to a default facility so content becomes visible
-- ============================================

-- Step 1: Check current state
SELECT 
  '=== BEFORE FIX: Users without facility ===' as info;

SELECT 
  role,
  COUNT(*) as total_users,
  SUM(CASE WHEN facilityId IS NULL THEN 1 ELSE 0 END) as without_facility
FROM User
WHERE role IN ('NURSE', 'CHW', 'PARENT')
GROUP BY role;

-- Step 2: Ensure at least one facility exists
INSERT INTO Facility (name, type, province, district, sector, description, isActive) 
VALUES (
  'Default Health Center', 
  'Health Center',
  'Kigali City',
  'Gasabo',
  'Remera',
  'Default facility for system setup',
  TRUE
)
ON DUPLICATE KEY UPDATE name = name;

-- Step 3: Get the facility ID
SET @default_facility_id = (SELECT id FROM Facility ORDER BY id LIMIT 1);

SELECT 
  CONCAT('Using Facility ID: ', @default_facility_id) as info;

-- Step 4: Show nurses without facility
SELECT 
  '=== Nurses without facility ===' as info;

SELECT id, name, email, role, facilityId
FROM User
WHERE role = 'NURSE' AND facilityId IS NULL;

-- Step 5: Show content posters without facility
SELECT 
  '=== Content posted by users without facility ===' as info;

SELECT DISTINCT
  u.id,
  u.name,
  u.email,
  u.role,
  u.facilityId,
  COUNT(c.id) as content_count
FROM User u
JOIN Content c ON u.id = c.postedById
WHERE u.facilityId IS NULL
GROUP BY u.id, u.name, u.email, u.role, u.facilityId;

-- Step 6: Assign default facility to ALL users without one
UPDATE User 
SET facilityId = @default_facility_id 
WHERE facilityId IS NULL
  AND role IN ('NURSE', 'CHW', 'PARENT', 'ADMIN');

-- Step 7: Verify the fix
SELECT 
  '=== AFTER FIX: Users by facility ===' as info;

SELECT 
  role,
  facilityId,
  COUNT(*) as user_count
FROM User
WHERE role IN ('NURSE', 'CHW', 'PARENT')
GROUP BY role, facilityId
ORDER BY role, facilityId;

-- Step 8: Show content availability by facility
SELECT 
  '=== Content by facility ===' as info;

SELECT 
  u.facilityId,
  f.name as facility_name,
  COUNT(DISTINCT c.id) as content_count,
  COUNT(DISTINCT c.ageGroup) as age_groups_covered
FROM Content c
JOIN User u ON c.postedById = u.id
LEFT JOIN Facility f ON u.facilityId = f.id
GROUP BY u.facilityId, f.name
ORDER BY u.facilityId;

-- Step 9: Show sample of who can see what content
SELECT 
  '=== Sample: What each nurse can see ===' as info;

SELECT 
  n.name as nurse_name,
  n.email as nurse_email,
  n.facilityId as nurse_facility,
  f.name as facility_name,
  COUNT(c.id) as visible_content_count
FROM User n
JOIN Facility f ON n.facilityId = f.id
JOIN User content_poster ON content_poster.facilityId = n.facilityId
JOIN Content c ON c.postedById = content_poster.id
WHERE n.role = 'NURSE'
GROUP BY n.id, n.name, n.email, n.facilityId, f.name
ORDER BY n.name;

SELECT 
  '=== FIX COMPLETE ===' as info;
SELECT 
  'All users have been assigned to facilities.' as message;
SELECT 
  'Users must LOG OUT and LOG IN again to get new JWT with facilityId.' as important_note;
