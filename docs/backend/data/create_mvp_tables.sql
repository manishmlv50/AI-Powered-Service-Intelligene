-- =============================================
-- Script: create_mvp_tables.sql
-- Purpose: Create all tables for AI-Powered Service Intelligence MVP
-- Database: Azure SQL
-- =============================================

-- =============================================
-- 1. Customers
-- =============================================
CREATE TABLE Customers (
    id UNIQUEIDENTIFIER PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20) NULL,
    email NVARCHAR(100) NULL,
    preferredContact NVARCHAR(20) DEFAULT 'chatbot'
);
-- =============================================
-- 2. Vehicles
-- =============================================

CREATE TABLE Employee (
    id UNIQUEIDENTIFIER PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20) NULL,
    email NVARCHAR(100) NULL,
    preferredContact NVARCHAR(20) DEFAULT 'chatbot'
);


-- =============================================
-- 3. Vehicles
-- =============================================
CREATE TABLE Vehicles (
    id UNIQUEIDENTIFIER PRIMARY KEY,
    customerId UNIQUEIDENTIFIER NOT NULL,
    make NVARCHAR(50) NOT NULL,
    model NVARCHAR(50) NOT NULL,
    year INT NOT NULL,
    vin NVARCHAR(50) NULL,
    FOREIGN KEY (customerId) REFERENCES Customers(id)
);

-- =============================================
-- 4. Parts
-- =============================================
CREATE TABLE Parts (
    id NVARCHAR(50) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL,
    description NVARCHAR(200) NOT NULL,
    unitPrice DECIMAL(10,2) NOT NULL,
    category NVARCHAR(50) NOT NULL
);

-- =============================================
-- 5. Labor Operations
-- =============================================
CREATE TABLE Labor_Operations (
    id NVARCHAR(50) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL,
    description NVARCHAR(200) NOT NULL,
    standardHours DECIMAL(5,2) NOT NULL,
    ratePerHour DECIMAL(10,2) NOT NULL
);

-- =============================================
-- 6. Fault Code Mappings
-- =============================================
CREATE TABLE Fault_Code_Mappings (
    faultCode NVARCHAR(10) PRIMARY KEY,
    laborOperationId NVARCHAR(50) NULL,
    warrantyEligible BIT DEFAULT 0,
    FOREIGN KEY (laborOperationId) REFERENCES Labor_Operations(id)
);

-- Many-to-many relation for faultCode -> partIds
CREATE TABLE FaultCode_Parts (
    faultCode NVARCHAR(10) NOT NULL,
    partId NVARCHAR(50) NOT NULL,
    PRIMARY KEY(faultCode, partId),
    FOREIGN KEY(faultCode) REFERENCES Fault_Code_Mappings(faultCode),
    FOREIGN KEY(partId) REFERENCES Parts(id)
);

-- =============================================
-- 7. Job Cards
-- =============================================
CREATE TABLE Job_Cards (
    id UNIQUEIDENTIFIER PRIMARY KEY,
    customerId UNIQUEIDENTIFIER NOT NULL,
    vehicleId UNIQUEIDENTIFIER NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    status NVARCHAR(50) NOT NULL DEFAULT 'draft',
    complaint NVARCHAR(500) NULL,
    serviceType NVARCHAR(50) NULL,
    mileage INT NULL,
    riskIndicators NVARCHAR(500) NULL,
    advisorId UNIQUEIDENTIFIER NULL,
    FOREIGN KEY (customerId) REFERENCES Customers(id),
    FOREIGN KEY (vehicleId) REFERENCES Vehicles(id)
);

-- =============================================
-- 8. OBD Reports
-- =============================================
CREATE TABLE OBD_Reports (
    id NVARCHAR(50) PRIMARY KEY,
    job_card_id UNIQUEIDENTIFIER NOT NULL,
    summary NVARCHAR(500) NULL,
    severity NVARCHAR(20) NULL,
    obdDocumentId NVARCHAR(100) NULL,
    FOREIGN KEY(job_card_id) REFERENCES Job_Cards(id)
);

-- Many-to-many relation: OBD report <-> error codes
CREATE TABLE OBD_Error_Codes (
    obdReportId NVARCHAR(50) NOT NULL,
    errorCode NVARCHAR(10) NOT NULL,
    PRIMARY KEY(obdReportId, errorCode),
    FOREIGN KEY(obdReportId) REFERENCES OBD_Reports(id),
    FOREIGN KEY(errorCode) REFERENCES Fault_Code_Mappings(faultCode)
);

-- =============================================
-- 9. Estimates
-- =============================================
CREATE TABLE Estimates (
    id UNIQUEIDENTIFIER PRIMARY KEY,
    jobCardId UNIQUEIDENTIFIER NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    status NVARCHAR(50) NOT NULL DEFAULT 'pending_approval',
    subtotal DECIMAL(10,2) NULL,
    customerPayableAmount DECIMAL(10,2) NULL,
    insurancePayableAmount DECIMAL(10,2) NULL,
    totalAmount DECIMAL(10,2) NULL,
    FOREIGN KEY (jobCardId) REFERENCES Job_Cards(id)
);

-- =============================================
-- 10. Estimate Line Items
-- =============================================
CREATE TABLE Estimate_Line_Items (
    id UNIQUEIDENTIFIER PRIMARY KEY,
    estimateId UNIQUEIDENTIFIER NOT NULL,
    partId NVARCHAR(50) NULL,
    laborOperationId NVARCHAR(50) NULL,
    description NVARCHAR(500) NOT NULL,
    quantity DECIMAL(10,2) NULL,
    unitPrice DECIMAL(10,2) NULL,
    hours DECIMAL(5,2) NULL,
    ratePerHour DECIMAL(10,2) NULL,
    total DECIMAL(10,2) NULL,
    coveredByInsurance BIT DEFAULT 0,
    FOREIGN KEY (estimateId) REFERENCES Estimates(id),
    FOREIGN KEY (partId) REFERENCES Parts(id),
    FOREIGN KEY (laborOperationId) REFERENCES Labor_Operations(id)
);