-- Fix game_date for existing scores that had the wrong date
-- (They were assigned CURRENT_DATE during ALTER TABLE, but should match their created_at date)
UPDATE leaderboard
SET game_date = DATE(created_at AT TIME ZONE 'UTC')
WHERE game_date > DATE(created_at AT TIME ZONE 'UTC');
