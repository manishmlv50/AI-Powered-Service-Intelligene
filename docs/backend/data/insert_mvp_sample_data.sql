-- =============================================
-- Script: insert_mvp_sample_data.sql
-- Purpose: Insert sample data for AI-Powered Service Intelligence MVP
-- Database: Azure SQL
-- =============================================

-- =============================================
-- 1. Customers (sample 5)
-- =============================================
INSERT INTO Customers (id, name, phone, email, preferredContact) VALUES
('11111111-1111-1111-1111-111111111111', 'Ravi Kumar', '9876543210', 'ravi.kumar@email.com', 'chatbot'),
('22222222-2222-2222-2222-222222222222', 'Priya Sharma', '9123456780', 'priya.sharma@email.com', 'email'),
('33333333-3333-3333-3333-333333333333', 'Amit Singh', '9988776655', 'amit.singh@email.com', 'chatbot'),
('44444444-4444-4444-4444-444444444444', 'Neha Patel', '9876501234', 'neha.patel@email.com', 'chatbot'),
('55555555-5555-5555-5555-555555555555', 'Vikram Joshi', '9112233445', 'vikram.joshi@email.com', 'email');

-- =============================================
-- 2. Vehicles (sample 5)
-- =============================================
INSERT INTO Vehicles (id, customerId, make, model, year, vin) VALUES
('V001', '11111111-1111-1111-1111-111111111111', 'Maruti', 'Swift', 2019, 'MARUTI1234567890'),
('V002', '22222222-2222-2222-2222-222222222222', 'Hyundai', 'Creta', 2020, 'HYUNDAI0987654321'),
('V003', '33333333-3333-3333-3333-333333333333', 'Tata', 'Nexon', 2018, 'TATA5678901234'),
('V004', '44444444-4444-4444-4444-444444444444', 'Kia', 'Seltos', 2021, 'KIA9876543210'),
('V005', '55555555-5555-5555-5555-555555555555', 'Mahindra', 'XUV500', 2017, 'MAHINDRA1122334455');

-- =============================================
-- 3. Parts (sample 5)
-- =============================================
INSERT INTO Parts (id, code, description, unitPrice, category) VALUES
('part-001', 'BRK-PAD-F', 'Brake Pad Set - Front', 2500.00, 'brakes'),
('part-002', 'ENG-OIL-F', 'Engine Oil 5W30', 1200.00, 'engine'),
('part-003', 'AIR-FILTER', 'Air Filter', 600.00, 'filters'),
('part-004', 'SPARK-PLUG', 'Spark Plug', 300.00, 'engine'),
('part-005', 'BATTERY-12V', '12V Car Battery', 4500.00, 'electrical');

-- =============================================
-- 4. Labor Operations (sample 5)
-- =============================================
INSERT INTO Labor_Operations (id, code, description, standardHours, ratePerHour) VALUES
('labor-001', 'BRK-RPL', 'Brake pad replacement', 1.5, 800.00),
('labor-002', 'OIL-CHG', 'Engine oil change', 1.0, 500.00),
('labor-003', 'AIR-FILT', 'Air filter replacement', 0.5, 300.00),
('labor-004', 'SPARK-RPL', 'Spark plug replacement', 0.75, 400.00),
('labor-005', 'BATTERY-RPL', 'Battery replacement', 1.0, 600.00);

-- =============================================
-- 5. Fault Code Mappings
-- =============================================
INSERT INTO Fault_Code_Mappings (faultCode, laborOperationId, warrantyEligible) VALUES
('P0301', 'labor-004', 0),
('P0420', NULL, 1),
('P0171', NULL, 0),
('P0455', NULL, 0),
('C1234', 'labor-001', 0);

-- FaultCode -> Parts mapping
INSERT INTO FaultCode_Parts (faultCode, partId) VALUES
('P0301', 'SPARK-PLUG'),
('P0420', 'CAT-CONVERTER'),
('P0171', 'AIR-FILTER'),
('P0455', 'FUEL-CAP'),
('C1234', 'BRK-PAD-F');

-- =============================================
-- 6. Job Cards (sample 5)
-- =============================================
INSERT INTO Job_Cards (id, customerId, vehicleId, createdAt, status, complaint, serviceType, mileage, riskIndicators, advisorId) VALUES
('J001', '11111111-1111-1111-1111-111111111111', 'V001', '2026-02-21T10:00:00', 'draft', 'Engine misfire, overheating', 'repair', 45000, 'high', 'A001'),
('J002', '22222222-2222-2222-2222-222222222222', 'V002', '2026-02-21T11:00:00', 'draft', 'Fuel rail pressure low', 'repair', 30000, 'high', 'A002'),
('J003', '33333333-3333-3333-3333-333333333333', 'V003', '2026-02-21T12:00:00', 'draft', 'Catalyst efficiency low', 'inspection', 40000, 'medium', 'A003'),
('J004', '44444444-4444-4444-4444-444444444444', 'V004', '2026-02-21T13:00:00', 'draft', 'Front brake pads worn', 'maintenance', 25000, 'medium', 'A004'),
('J005', '55555555-5555-5555-5555-555555555555', 'V005', '2026-02-21T14:00:00', 'draft', 'Battery voltage low', 'repair', 50000, 'high', 'A005');

-- =============================================
-- 7. OBD Reports (sample 5)
-- =============================================
INSERT INTO OBD_Reports (id, job_card_id, summary, severity, obdDocumentId) VALUES
('O001', 'J001', 'Cylinder 1 misfire; thermostat high', 'high', 'sample_obd_001.txt'),
('O002', 'J002', 'Engine overheating; fuel pressure low', 'high', 'sample_obd_002.txt'),
('O003', 'J003', 'Catalyst efficiency below threshold', 'medium', 'sample_obd_003.txt'),
('O004', 'J004', 'Front brake pads worn; ABS sensor inconsistent', 'medium', 'sample_obd_004.txt'),
('O005', 'J005', 'Battery voltage low; charging system fault', 'high', 'sample_obd_005.txt');

-- OBD_Error_Codes
INSERT INTO OBD_Error_Codes (obdReportId, errorCode) VALUES
('O001', 'P0301'),
('O002', 'P0217'),
('O003', 'P0420'),
('O004', 'C1234'),
('O005', 'B2101');

-- =============================================
-- 8. Estimates (sample 3)
-- =============================================
INSERT INTO Estimates (id, jobCardId, createdAt, status, subtotal, customerPayableAmount, insurancePayableAmount, totalAmount) VALUES
('E001', 'J001', '2026-02-21T15:00:00', 'pending_approval', 3500.00, 3500.00, 0.00, 3500.00),
('E002', 'J002', '2026-02-21T15:30:00', 'pending_approval', 1700.00, 1700.00, 0.00, 1700.00),
('E003', 'J003', '2026-02-21T16:00:00', 'pending_approval', 5000.00, 1000.00, 4000.00, 5000.00);

-- =============================================
-- 9. Estimate Line Items (sample 5)
-- =============================================
INSERT INTO Estimate_Line_Items (id, estimateId, partId, laborOperationId, description, quantity, unitPrice, hours, ratePerHour, total, coveredByInsurance) VALUES
('EL001', 'E001', 'SPARK-PLUG', 'labor-004', 'Cylinder 1 misfire - Spark plug replacement', 4, 300.00, 0.75, 400.00, 1900.00, 0),
('EL002', 'E001', NULL, 'labor-002', 'Engine oil change', NULL, NULL, 1.0, 500.00, 500.00, 0),
('EL003', 'E002', 'AIR-FILTER', 'labor-003', 'Air filter replacement', 1, 600.00, 0.5, 300.00, 750.00, 0),
('EL004', 'E003', 'CAT-CONVERTER', NULL, 'Catalytic converter replacement', 1, 4000.00, NULL, NULL, 4000.00, 1),
('EL005', 'E003', NULL, 'labor-001', 'Brake pad replacement', NULL, NULL, 1.5, 800.00, 1200.00, 0);