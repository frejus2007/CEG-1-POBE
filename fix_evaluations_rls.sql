
-- Enable RLS
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Allow ALL authenticated users (Teachers, Censeurs) to VIEW evaluations
-- This ensures that if Teacher A creates an eval, Censeur B can still see it.
CREATE POLICY "Enable read access for all authenticated users" ON evaluations
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Allow Users to create evaluations (if they don't have one yet)
CREATE POLICY "Enable insert for authenticated users" ON evaluations
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Allow Users to update their OWN evaluations OR if they are Censeur
CREATE POLICY "Enable update for owners or Censeurs" ON evaluations
    FOR UPDATE
    USING (
        auth.uid() = created_by 
        OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'CENSEUR'
        )
    );
