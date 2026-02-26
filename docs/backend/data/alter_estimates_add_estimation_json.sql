-- Add estimation_json column for full estimate payload persistence
-- Safe to run multiple times

IF COL_LENGTH('Estimates', 'estimation_json') IS NULL
BEGIN
    ALTER TABLE Estimates
    ADD estimation_json NVARCHAR(MAX) NULL;
END
GO
