-- migrations/20260226_board_icons.sql

ALTER TABLE memory_boards
  ADD COLUMN IF NOT EXISTS icon text DEFAULT 'layout';
