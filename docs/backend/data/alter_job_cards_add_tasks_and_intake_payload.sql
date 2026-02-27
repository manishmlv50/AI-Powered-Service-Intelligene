-- Add new fields for AI intake persistence
-- Safe to run multiple times

IF COL_LENGTH('Job_Cards', 'tasks') IS NULL
BEGIN
    ALTER TABLE Job_Cards
    ADD tasks NVARCHAR(MAX) NULL;
END
GO

IF COL_LENGTH('Job_Cards', 'intake_payload_json') IS NULL
BEGIN
    ALTER TABLE Job_Cards
    ADD intake_payload_json NVARCHAR(MAX) NULL;
END
GO
