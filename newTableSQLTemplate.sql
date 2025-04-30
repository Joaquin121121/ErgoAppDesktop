-- 2. Table template
CREATE TABLE your_table_name (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_changed timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
  -- your other fields here, for example:
  -- name TEXT NOT NULL,
  -- age INT,
  -- etc
);

-- 3. Trigger to auto-update last_changed
CREATE TRIGGER set_last_changed_your_table_name
BEFORE INSERT OR UPDATE ON your_table_name
FOR EACH ROW
EXECUTE FUNCTION set_last_changed();