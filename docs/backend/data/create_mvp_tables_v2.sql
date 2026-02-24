-- =============================================
-- Script  : create_mvp_tables_v2.sql
-- Purpose : Create all tables aligned to JSON fixture schema
-- Database: Azure SQL (MSSQL)
-- Version : v2 — matches JSON data shapes exactly
-- =============================================

-- Drop existing tables (in dependency order)
IF OBJECT_ID('dbo.Estimate_Line_Items', 'U') IS NOT NULL DROP TABLE dbo.Estimate_Line_Items;
IF OBJECT_ID('dbo.Estimates',           'U') IS NOT NULL DROP TABLE dbo.Estimates;
IF OBJECT_ID('dbo.OBD_Error_Codes',     'U') IS NOT NULL DROP TABLE dbo.OBD_Error_Codes;
IF OBJECT_ID('dbo.OBD_Reports',         'U') IS NOT NULL DROP TABLE dbo.OBD_Reports;
IF OBJECT_ID('dbo.Job_Cards',           'U') IS NOT NULL DROP TABLE dbo.Job_Cards;
IF OBJECT_ID('dbo.FaultCode_Parts',     'U') IS NOT NULL DROP TABLE dbo.FaultCode_Parts;
IF OBJECT_ID('dbo.Fault_Code_Mappings', 'U') IS NOT NULL DROP TABLE dbo.Fault_Code_Mappings;
IF OBJECT_ID('dbo.Labor_Operations',    'U') IS NOT NULL DROP TABLE dbo.Labor_Operations;
IF OBJECT_ID('dbo.Parts',               'U') IS NOT NULL DROP TABLE dbo.Parts;
IF OBJECT_ID('dbo.Vehicles',            'U') IS NOT NULL DROP TABLE dbo.Vehicles;
IF OBJECT_ID('dbo.Employee',            'U') IS NOT NULL DROP TABLE dbo.Employee;
IF OBJECT_ID('dbo.Customers',           'U') IS NOT NULL DROP TABLE dbo.Customers;
GO

-- =============================================
-- 1. Customers
-- JSON keys: id, name, phone, email, city, state, preferred_contact
-- =============================================
CREATE TABLE Customers (
    id                NVARCHAR(20)  NOT NULL PRIMARY KEY,   -- e.g. C001
    name              NVARCHAR(100) NOT NULL,
    phone             NVARCHAR(20)  NULL,
    email             NVARCHAR(100) NULL,
    city              NVARCHAR(100) NULL,
    state             NVARCHAR(100) NULL,
    preferred_contact NVARCHAR(20)  NOT NULL DEFAULT 'chatbot'
);
GO

-- =============================================
-- 2. Employee  (advisors / workshop staff)
-- =============================================
CREATE TABLE Employee (
    id       NVARCHAR(20)  NOT NULL PRIMARY KEY,   -- e.g. A001
    name     NVARCHAR(100) NOT NULL,
    phone    NVARCHAR(20)  NULL,
    email    NVARCHAR(100) NULL,
    role     NVARCHAR(50)  NOT NULL DEFAULT 'advisor',
    username NVARCHAR(50)  NULL,
    password NVARCHAR(255) NULL
);
GO

-- =============================================
-- 3. Vehicles
-- JSON keys: id, customer_id, make, model, year,
--            fuel_type, transmission, registration_number
-- =============================================
CREATE TABLE Vehicles (
    id                  NVARCHAR(20)  NOT NULL PRIMARY KEY,  -- e.g. V001
    customer_id         NVARCHAR(20)  NOT NULL,
    make                NVARCHAR(50)  NOT NULL,
    model               NVARCHAR(50)  NOT NULL,
    year                INT           NOT NULL,
    fuel_type           NVARCHAR(20)  NULL,                  -- petrol | diesel | electric | cng
    transmission        NVARCHAR(20)  NULL,                  -- manual | automatic
    registration_number NVARCHAR(20)  NULL,                  -- e.g. MH01AB1234
    vin                 NVARCHAR(50)  NULL,
    CONSTRAINT FK_Vehicles_Customers FOREIGN KEY (customer_id) REFERENCES Customers(id)
);
GO

-- =============================================
-- 4. Parts
-- JSON keys: id, name, category, unit_price, stock_qty
-- =============================================
CREATE TABLE Parts (
    id         NVARCHAR(20)   NOT NULL PRIMARY KEY,   -- e.g. P001
    name       NVARCHAR(200)  NOT NULL,
    category   NVARCHAR(50)   NOT NULL,               -- engine | brakes | electrical | transmission | ac | fuel | suspension | cooling | body
    unit_price DECIMAL(10, 2) NOT NULL,
    stock_qty  INT            NOT NULL DEFAULT 0
);
GO

-- =============================================
-- 5. Labor Operations
-- JSON keys: id, name, hourly_rate, estimated_hours
-- =============================================
CREATE TABLE Labor_Operations (
    id               NVARCHAR(20)   NOT NULL PRIMARY KEY,  -- e.g. L001
    name             NVARCHAR(200)  NOT NULL,
    hourly_rate      DECIMAL(10, 2) NOT NULL,
    estimated_hours  DECIMAL(5, 2)  NOT NULL
);
GO

-- =============================================
-- 6. Fault Code Mappings
-- JSON keys: faultCode, partIds[], laborOperationId, warrantyEligible, description
-- =============================================
CREATE TABLE Fault_Code_Mappings (
    fault_code          NVARCHAR(10)  NOT NULL PRIMARY KEY,  -- e.g. P0301
    labor_operation_id  NVARCHAR(20)  NULL,
    warranty_eligible   BIT           NOT NULL DEFAULT 0,
    description         NVARCHAR(500) NULL,
    CONSTRAINT FK_FCM_Labor FOREIGN KEY (labor_operation_id) REFERENCES Labor_Operations(id)
);
GO

-- Junction: fault_code ↔ part (many-to-many)
CREATE TABLE FaultCode_Parts (
    fault_code NVARCHAR(10) NOT NULL,
    part_id    NVARCHAR(20) NOT NULL,
    PRIMARY KEY (fault_code, part_id),
    CONSTRAINT FK_FCP_FC   FOREIGN KEY (fault_code) REFERENCES Fault_Code_Mappings(fault_code),
    CONSTRAINT FK_FCP_Part FOREIGN KEY (part_id)    REFERENCES Parts(id)
);
GO

-- =============================================
-- 7. Job Cards
-- JSON keys: id, createdAt, status, customerName, vehicleMake,
--            vehicleModel, vehicleYear, vin, mileage, complaint,
--            serviceType, riskIndicators[], obdFaultCodes[],
--            obdDocumentId, advisorId
-- Denormalized: stores customer_name + vehicle details inline
-- (customer_id / vehicle_id are optional FK links when known)
-- =============================================
CREATE TABLE Job_Cards (
    id               NVARCHAR(20)   NOT NULL PRIMARY KEY,  -- e.g. J001
    created_at       DATETIME2      NOT NULL DEFAULT GETDATE(),
    status           NVARCHAR(50)   NOT NULL DEFAULT 'draft',  -- draft | pending_approval | in_progress | completed | closed

    -- Denormalized customer / vehicle snapshot (matches JSON shape)
    customer_name    NVARCHAR(100)  NULL,
    vehicle_make     NVARCHAR(50)   NULL,
    vehicle_model    NVARCHAR(50)   NULL,
    vehicle_year     INT            NULL,
    vin              NVARCHAR(50)   NULL,
    mileage          INT            NULL,

    -- Complaint & work type
    complaint        NVARCHAR(1000) NULL,
    service_type     NVARCHAR(100)  NULL,

    -- Risk & OBD (stored as comma-separated for simplicity)
    risk_indicators  NVARCHAR(500)  NULL,  -- e.g. "high engine temperature,medium"
    obd_fault_codes  NVARCHAR(500)  NULL,  -- e.g. "P0301,P0128"
    obd_document_id  NVARCHAR(200)  NULL,

    -- Soft FK links (nullable — populated when VIN search resolves)
    customer_id      NVARCHAR(20)   NULL,
    vehicle_id       NVARCHAR(20)   NULL,
    advisor_id       NVARCHAR(20)   NULL,

    CONSTRAINT FK_JC_Customers FOREIGN KEY (customer_id) REFERENCES Customers(id),
    CONSTRAINT FK_JC_Vehicles  FOREIGN KEY (vehicle_id)  REFERENCES Vehicles(id),
    CONSTRAINT FK_JC_Employee  FOREIGN KEY (advisor_id)  REFERENCES Employee(id)
);
GO

-- =============================================
-- 8. Estimates
-- JSON keys: id, job_card_id, parts_total, labor_total,
--            tax, grand_total, status
-- =============================================
CREATE TABLE Estimates (
    id           NVARCHAR(20)   NOT NULL PRIMARY KEY,   -- e.g. E001
    job_card_id  NVARCHAR(20)   NOT NULL,
    created_at   DATETIME2      NOT NULL DEFAULT GETDATE(),
    status       NVARCHAR(50)   NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
    parts_total  DECIMAL(10, 2) NOT NULL DEFAULT 0,
    labor_total  DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax          DECIMAL(10, 2) NOT NULL DEFAULT 0,
    grand_total  DECIMAL(10, 2) NOT NULL DEFAULT 0,
    CONSTRAINT FK_Est_JC FOREIGN KEY (job_card_id) REFERENCES Job_Cards(id)
);
GO

-- =============================================
-- 9. Estimate Line Items
-- JSON keys: id, estimate_id, type (part|labor),
--            reference_id, quantity, unit_price, total
-- =============================================
CREATE TABLE Estimate_Line_Items (
    id           NVARCHAR(20)   NOT NULL PRIMARY KEY,  -- e.g. EL001
    estimate_id  NVARCHAR(20)   NOT NULL,
    type         NVARCHAR(10)   NOT NULL,              -- 'part' | 'labor'
    reference_id NVARCHAR(20)   NULL,                  -- FK to Parts.id or Labor_Operations.id
    quantity     DECIMAL(10, 2) NULL,
    unit_price   DECIMAL(10, 2) NULL,
    total        DECIMAL(10, 2) NULL,
    CONSTRAINT FK_ELI_Est FOREIGN KEY (estimate_id) REFERENCES Estimates(id)
);
GO
