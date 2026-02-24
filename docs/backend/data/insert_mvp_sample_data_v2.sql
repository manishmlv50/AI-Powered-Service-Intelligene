-- =============================================
-- Script  : insert_mvp_sample_data_v2.sql
-- Purpose : Seed all sample data from JSON fixtures (20 records/table)
-- Database: Azure SQL (MSSQL)
-- Version : v2 — aligned to create_mvp_tables_v2.sql
-- Run AFTER create_mvp_tables_v2.sql
-- =============================================

-- =============================================
-- Employees (Advisors)
-- =============================================
INSERT INTO Employee (id, name, role, username, password) VALUES
('A001', 'Sarah Chen',    'advisor', 'advisor', 'demo'),
('A002', 'David Park',    'advisor', 'advisor2', 'demo'),
('A003', 'Raj Kumar',     'manager', 'manager',  'demo');
GO

-- =============================================
-- Customers  (20 records)
-- =============================================
INSERT INTO Customers (id, name, phone, email, city, state, preferred_contact) VALUES
('C001', 'Rohit Sharma',    '+919876543210', 'rohit@email.com',    'Mumbai',       'Maharashtra',    'chatbot'),
('C002', 'Priya Verma',     '+919812345678', 'priya@email.com',    'Delhi',        'Delhi',          'chatbot'),
('C003', 'Arjun Reddy',     '+919845612345', 'arjun@email.com',    'Hyderabad',    'Telangana',      'email'),
('C004', 'Sneha Iyer',      '+919998877665', 'sneha@email.com',    'Chennai',      'Tamil Nadu',     'chatbot'),
('C005', 'Vikram Singh',    '+919934567890', 'vikram@email.com',   'Jaipur',       'Rajasthan',      'chatbot'),
('C006', 'Ananya Gupta',    '+919887766554', 'ananya@email.com',   'Pune',         'Maharashtra',    'email'),
('C007', 'Karan Malhotra',  '+919812334455', 'karan@email.com',    'Gurugram',     'Haryana',        'chatbot'),
('C008', 'Meera Nair',      '+919876112233', 'meera@email.com',    'Kochi',        'Kerala',         'email'),
('C009', 'Aditya Rao',      '+919900112233', 'aditya@email.com',   'Bengaluru',    'Karnataka',      'chatbot'),
('C010', 'Neha Kapoor',     '+919811223344', 'neha@email.com',     'Chandigarh',   'Punjab',         'chatbot'),
('C011', 'Manish Patel',    '+919811998877', 'manish@email.com',   'Ahmedabad',    'Gujarat',        'chatbot'),
('C012', 'Divya Joshi',     '+919877665544', 'divya@email.com',    'Lucknow',      'Uttar Pradesh',  'email'),
('C013', 'Ramesh Kumar',    '+919844556677', 'ramesh@email.com',   'Patna',        'Bihar',          'chatbot'),
('C014', 'Sanjay Das',      '+919833221144', 'sanjay@email.com',   'Kolkata',      'West Bengal',    'email'),
('C015', 'Pooja Mehta',     '+919822334455', 'pooja@email.com',    'Surat',        'Gujarat',        'chatbot'),
('C016', 'Nikhil Jain',     '+919811556677', 'nikhil@email.com',   'Indore',       'Madhya Pradesh', 'chatbot'),
('C017', 'Harsh Vardhan',   '+919822667788', 'harsh@email.com',    'Noida',        'Uttar Pradesh',  'chatbot'),
('C018', 'Tanya Arora',     '+919855443322', 'tanya@email.com',    'Ludhiana',     'Punjab',         'email'),
('C019', 'Abhishek Ghosh',  '+919844112233', 'abhishek@email.com', 'Bhubaneswar',  'Odisha',         'chatbot'),
('C020', 'Ishita Banerjee', '+919833556677', 'ishita@email.com',   'Ranchi',       'Jharkhand',      'chatbot');
GO

-- =============================================
-- Vehicles  (20 records)
-- =============================================
INSERT INTO Vehicles (id, customer_id, make, model, year, fuel_type, transmission, registration_number, vin) VALUES
('V001', 'C001', 'Maruti Suzuki', 'Swift',         2021, 'petrol',  'manual',    'MH01AB1234', 'MA3EWB22S12345678'),
('V002', 'C002', 'Hyundai',       'Creta',         2022, 'diesel',  'automatic', 'DL05CD5678', 'MALC1234AB5678901'),
('V003', 'C003', 'Tata',          'Nexon',         2020, 'petrol',  'manual',    'TS09EF1122', 'TATANX20VIN000123'),
('V004', 'C004', 'Mahindra',      'XUV700',        2023, 'diesel',  'automatic', 'TN10GH3344', 'MAXUV23VIN000004'),
('V005', 'C005', 'Toyota',        'Innova Crysta', 2019, 'diesel',  'manual',    'RJ14JK7788', 'TOYIC19VIN000005'),
('V006', 'C006', 'Honda',         'City',          2018, 'petrol',  'automatic', 'MH12LM9988', 'HOCITY18VIN000112'),
('V007', 'C007', 'Kia',           'Seltos',        2021, 'diesel',  'manual',    'HR26PQ1122', 'KSEL21VIN000789'),
('V008', 'C008', 'Renault',       'Kwid',          2019, 'petrol',  'manual',    'KL07UV2233', 'RNKWID19VIN000008'),
('V009', 'C009', 'Hyundai',       'i20',           2020, 'petrol',  'manual',    'KA03XY7788', 'HYI2019VIN000456'),
('V010', 'C010', 'Maruti Suzuki', 'Baleno',        2022, 'petrol',  'automatic', 'PB10CD8899', 'MABAL21VIN000123'),
('V011', 'C011', 'Tata',          'Harrier',       2021, 'diesel',  'manual',    'GJ01GH5566', 'TAHARR21VIN000011'),
('V012', 'C012', 'Mahindra',      'Thar',          2023, 'diesel',  'manual',    'UP32JK4455', 'MATH20VIN000222'),
('V013', 'C013', 'Toyota',        'Glanza',        2021, 'petrol',  'manual',    'BR01MN7788', 'TOGLAN21VIN000013'),
('V014', 'C014', 'Skoda',         'Slavia',        2022, 'petrol',  'automatic', 'WB02KL3344', 'SKSLA22VIN000014'),
('V015', 'C015', 'Volkswagen',    'Polo',          2019, 'petrol',  'manual',    'GJ05LM7788', 'VWPOLO19VIN000015'),
('V016', 'C016', 'MG',            'Hector',        2022, 'diesel',  'automatic', 'MP09AB6677', 'MGHEC22VIN000016'),
('V017', 'C017', 'Hyundai',       'Venue',         2021, 'petrol',  'manual',    'UP16CD1122', 'HYVEN21VIN000017'),
('V018', 'C018', 'Maruti Suzuki', 'Brezza',        2020, 'diesel',  'manual',    'PB08EF5566', 'MABREZ20VIN000018'),
('V019', 'C019', 'Tata',          'Punch',         2023, 'petrol',  'manual',    'OD02GH3344', 'TAPUN23VIN000019'),
('V020', 'C020', 'Mahindra',      'Scorpio-N',     2023, 'diesel',  'automatic', 'JH01JK7788', 'MAHSCN23VIN000020');
GO

-- =============================================
-- Parts  (20 records)
-- =============================================
INSERT INTO Parts (id, name, category, unit_price, stock_qty) VALUES
('P001', 'Engine Oil 5W30',     'engine',       850.00,   100),
('P002', 'Oil Filter',          'engine',       250.00,   200),
('P003', 'Air Filter',          'engine',       450.00,   150),
('P004', 'Brake Pad Set Front', 'brakes',      3200.00,    80),
('P005', 'Brake Disc',          'brakes',      4200.00,    40),
('P006', 'Battery 12V',         'electrical',  5500.00,    35),
('P007', 'Alternator',          'electrical',  7200.00,    20),
('P008', 'Clutch Kit',          'transmission',6800.00,    25),
('P009', 'Spark Plug',          'engine',       300.00,   300),
('P010', 'Radiator',            'cooling',     6400.00,    15),
('P011', 'AC Compressor',       'ac',         12500.00,    10),
('P012', 'Fuel Pump',           'fuel',        4800.00,    30),
('P013', 'Timing Belt',         'engine',      3500.00,    40),
('P014', 'Headlight Assembly',  'electrical',  3900.00,    22),
('P015', 'Shock Absorber',      'suspension',  4100.00,    28),
('P016', 'Wiper Blade Set',     'body',         650.00,   120),
('P017', 'Throttle Body',       'engine',      8700.00,    12),
('P018', 'EGR Valve',           'engine',      5600.00,    18),
('P019', 'Wheel Bearing',       'suspension',  2100.00,    50),
('P020', 'Coolant 1L',          'cooling',      350.00,   200);
GO

-- =============================================
-- Labor Operations  (20 records)
-- =============================================
INSERT INTO Labor_Operations (id, name, hourly_rate, estimated_hours) VALUES
('L001', 'General Service',            800.00,  2.00),
('L002', 'Brake Pad Replacement',      900.00,  2.00),
('L003', 'Brake Disc Replacement',     950.00,  3.00),
('L004', 'Battery Replacement',        700.00,  1.00),
('L005', 'Alternator Replacement',     950.00,  2.00),
('L006', 'Clutch Replacement',        1200.00,  5.00),
('L007', 'AC Repair',                 1100.00,  3.00),
('L008', 'Fuel Pump Replacement',     1000.00,  3.00),
('L009', 'Radiator Replacement',      1000.00,  3.00),
('L010', 'Timing Belt Replacement',   1100.00,  4.00),
('L011', 'Suspension Repair',         1000.00,  3.00),
('L012', 'Wheel Bearing Replacement',  900.00,  2.00),
('L013', 'Throttle Body Cleaning',     850.00,  2.00),
('L014', 'EGR Valve Replacement',     1000.00,  3.00),
('L015', 'Headlight Replacement',      600.00,  1.00),
('L016', 'OBD Diagnostics',            800.00,  1.00),
('L017', 'Cooling System Flush',       900.00,  2.00),
('L018', 'Transmission Service',      1100.00,  4.00),
('L019', 'Engine Overhaul',           1500.00, 10.00),
('L020', 'AC Gas Refill',              850.00,  1.00);
GO

-- =============================================
-- Fault Code Mappings  (10 records)
-- =============================================
INSERT INTO Fault_Code_Mappings (fault_code, labor_operation_id, warranty_eligible, description) VALUES
('P0301', 'L001', 0, 'Cylinder 1 Misfire Detected - check spark plug and ignition coil'),
('P0302', 'L002', 0, 'Cylinder 2 Misfire Detected'),
('P0420', 'L003', 1, 'Catalyst System Efficiency Below Threshold (Bank 1)'),
('P0171', 'L004', 0, 'System Too Lean (Bank 1) - check fuel system'),
('P0087', 'L005', 0, 'Fuel Rail/System Pressure Too Low'),
('P0128', 'L006', 0, 'Coolant Thermostat Regulating Temperature'),
('C1234', 'L007', 0, 'Front Brake Pad Wear Detected'),
('B2101', 'L008', 0, 'Battery Voltage Low'),
('P0700', 'L009', 1, 'Transmission Control System Malfunction'),
('P0740', 'L010', 1, 'Torque Converter Clutch Circuit Malfunction');
GO

-- FaultCode_Parts junction
INSERT INTO FaultCode_Parts (fault_code, part_id) VALUES
('P0301', 'P001'),
('P0302', 'P002'),
('P0420', 'P003'), ('P0420', 'P004'),
('P0171', 'P005'),
('P0087', 'P006'),
('P0128', 'P007'),
('C1234', 'P008'),
('B2101', 'P009'),
('P0700', 'P010'),
('P0740', 'P011');
GO

-- =============================================
-- Job Cards  (20 records)
-- =============================================
INSERT INTO Job_Cards (id, created_at, status, customer_name, vehicle_make, vehicle_model, vehicle_year, vin, mileage, complaint, service_type, risk_indicators, obd_fault_codes, obd_document_id, advisor_id) VALUES
('J001', '2026-02-01T09:15:00', 'draft',            'Rajesh Kumar',  'Maruti Suzuki', 'Swift',    2021, 'MA3EWB22S12345678', 32000, 'Engine misfire and check engine light',          'Diagnostic',            'high engine temperature', 'P0301,P0128', 'sample_obd_001.txt', 'A001'),
('J002', '2026-02-02T10:30:00', 'pending_approval', 'Anita Sharma',  'Hyundai',       'Creta',    2022, 'MALC1234AB5678901', 15000, 'Fuel pressure low and engine overheating',        'Repair',                'medium',                  'P0217,P0087', 'sample_obd_002.txt', 'A002'),
('J003', '2026-02-03T11:00:00', 'draft',            'Vikram Singh',  'Tata',          'Nexon',    2020, 'TATANX20VIN000123', 28000, 'Catalyst efficiency below threshold',             'Emission Check',        'medium',                  'P0420',       'sample_obd_003.txt', 'A001'),
('J004', '2026-02-04T09:45:00', 'draft',            'Priya Nair',    'Mahindra',      'XUV500',   2019, 'MAXUV19VIN000456',  54000, 'Brake pad wear warning',                          'Maintenance',           'medium brake risk',       'C1234',       'sample_obd_004.txt', 'A003'),
('J005', '2026-02-05T12:10:00', 'pending_approval', 'Sunil Mehta',   'Kia',           'Seltos',   2021, 'KSEL21VIN000789',   22000, 'Battery voltage low',                             'Electrical',            'high',                    'B2101',       'sample_obd_005.txt', 'A002'),
('J006', '2026-02-05T14:30:00', 'draft',            'Amit Patel',    'Toyota',        'Fortuner', 2018, 'TOF18VIN000321',    60000, 'Transmission control malfunction',                'Transmission Repair',   'high',                    'P0700',       'sample_obd_006.txt', 'A003'),
('J007', '2026-02-06T08:50:00', 'draft',            'Neha Rao',      'Honda',         'City',     2020, 'HOCITY20VIN000112', 25000, 'Torque converter clutch issue',                   'Transmission Diagnostic','medium',                  'P0740',       'sample_obd_007.txt', 'A001'),
('J008', '2026-02-06T11:20:00', 'pending_approval', 'Ramesh Iyer',   'Ford',          'EcoSport', 2019, 'FDECO19VIN000987',  33000, 'System too lean',                                 'Fuel System',           'medium',                  'P0171',       'sample_obd_008.txt', 'A002'),
('J009', '2026-02-07T09:05:00', 'draft',            'Shweta Gupta',  'Maruti Suzuki', 'Baleno',   2021, 'MABAL21VIN000123',  18000, 'Cylinder 2 misfire detected',                     'Diagnostic',            'medium',                  'P0302',       'sample_obd_009.txt', 'A003'),
('J010', '2026-02-07T12:15:00', 'draft',            'Deepak Verma',  'Hyundai',       'i20',      2020, 'HYI2019VIN000456',  20000, 'Catalyst efficiency low',                         'Emission Check',        'medium',                  'P0420',       'sample_obd_010.txt', 'A001'),
('J011', '2026-02-08T10:10:00', 'pending_approval', 'Manish Jain',   'Tata',          'Altroz',   2021, 'TALT21VIN000111',   12000, 'Oxygen sensor faulty',                            'Emission Check',        'medium',                  'P0130',       'sample_obd_011.txt', 'A002'),
('J012', '2026-02-08T11:45:00', 'draft',            'Priya Menon',   'Mahindra',      'Thar',     2020, 'MATH20VIN000222',   18000, 'ABS warning light active',                        'Brakes',                'medium brake risk',       'C1245',       'sample_obd_012.txt', 'A003'),
('J013', '2026-02-09T09:30:00', 'draft',            'Rohit Sharma',  'Kia',           'Carnival', 2021, 'KCARN21VIN000333',  25000, 'Brake fluid low',                                 'Maintenance',           'low',                     'C1250',       'sample_obd_013.txt', 'A002'),
('J014', '2026-02-09T12:00:00', 'pending_approval', 'Sonal Gupta',   'Toyota',        'Yaris',    2020, 'TOYAR20VIN000444',  15000, 'Check engine light ON',                           'Diagnostic',            'medium',                  'P0455',       'sample_obd_014.txt', 'A001'),
('J015', '2026-02-10T09:15:00', 'draft',            'Vikas Singh',   'Honda',         'Amaze',    2019, 'HOAMA19VIN000555',  30000, 'Cylinder 1 misfire',                              'Diagnostic',            'medium',                  'P0301',       'sample_obd_015.txt', 'A002'),
('J016', '2026-02-10T12:25:00', 'draft',            'Neeraj Kumar',  'Maruti Suzuki', 'Dzire',    2021, 'MADZ21VIN000666',   20000, 'Catalyst system below threshold',                 'Emission Check',        'medium',                  'P0420',       'sample_obd_016.txt', 'A003'),
('J017', '2026-02-11T10:05:00', 'draft',            'Rashmi Verma',  'Hyundai',       'Creta',    2020, 'HYCR20VIN000777',   22000, 'Oxygen sensor failure',                           'Emission Check',        'medium',                  'P0135',       'sample_obd_017.txt', 'A001'),
('J018', '2026-02-11T12:50:00', 'pending_approval', 'Sandeep Reddy', 'Ford',          'Figo',     2019, 'FOFIG19VIN000888',  28000, 'Throttle position sensor issue',                  'Engine',                'medium',                  'P0122',       'sample_obd_018.txt', 'A002'),
('J019', '2026-02-12T09:40:00', 'draft',            'Pooja Sharma',  'Kia',           'Seltos',   2021, 'KSEL21VIN000999',   24000, 'Battery not charging properly',                   'Electrical',            'high',                    'B2102',       'sample_obd_019.txt', 'A003'),
('J020', '2026-02-12T12:15:00', 'draft',            'Arjun Desai',   'Honda',         'WR-V',     2020, 'HOWR20VIN001000',   27000, 'Cylinder misfire and catalytic efficiency low',   'Diagnostic',            'medium',                  'P0303,P0420', 'sample_obd_020.txt', 'A001');
GO

-- =============================================
-- Estimates  (20 records)
-- =============================================
INSERT INTO Estimates (id, job_card_id, status, parts_total, labor_total, tax, grand_total) VALUES
('E001', 'J001', 'pending',  1550.00, 1600.00,  567.00,  3717.00),
('E002', 'J002', 'approved', 3200.00, 1800.00,  900.00,  5900.00),
('E003', 'J003', 'approved', 5500.00,  700.00, 1116.00,  7316.00),
('E004', 'J004', 'pending',  6800.00, 6000.00, 2304.00, 15104.00),
('E005', 'J005', 'pending', 12500.00, 3300.00, 2856.00, 18656.00),
('E006', 'J006', 'approved', 6400.00, 3000.00, 1692.00, 11092.00),
('E007', 'J007', 'approved', 4800.00, 3000.00, 1404.00,  9204.00),
('E008', 'J008', 'pending',  1550.00, 1600.00,  567.00,  3717.00),
('E009', 'J009', 'approved', 4100.00, 3000.00, 1278.00,  8378.00),
('E010', 'J010', 'pending',  3900.00,  600.00,  810.00,  5310.00),
('E011', 'J011', 'approved', 1200.00, 1700.00,  522.00,  3422.00),
('E012', 'J012', 'pending',  2100.00, 1800.00,  702.00,  4602.00),
('E013', 'J013', 'pending',  3500.00, 4400.00, 1416.00,  9316.00),
('E014', 'J014', 'approved',12500.00, 3300.00, 2856.00, 18656.00),
('E015', 'J015', 'approved', 6400.00, 3000.00, 1692.00, 11092.00),
('E016', 'J016', 'pending',  7200.00, 1900.00, 1638.00, 10738.00),
('E017', 'J017', 'approved', 8700.00, 1700.00, 1872.00, 12272.00),
('E018', 'J018', 'pending',  4200.00, 2850.00, 1269.00,  8319.00),
('E019', 'J019', 'approved',  350.00, 1800.00,  387.00,  2537.00),
('E020', 'J020', 'pending',     0.00, 4400.00,  792.00,  5192.00);
GO

-- =============================================
-- Estimate Line Items  (12 records — E001 to E005)
-- =============================================
INSERT INTO Estimate_Line_Items (id, estimate_id, type, reference_id, quantity, unit_price, total) VALUES
('EL001', 'E001', 'part',  'P001', 1,   850.00,   850.00),
('EL002', 'E001', 'part',  'P002', 1,   250.00,   250.00),
('EL003', 'E001', 'part',  'P003', 1,   450.00,   450.00),
('EL004', 'E001', 'labor', 'L001', 1,  1600.00,  1600.00),
('EL005', 'E002', 'part',  'P004', 1,  3200.00,  3200.00),
('EL006', 'E002', 'labor', 'L002', 1,  1800.00,  1800.00),
('EL007', 'E003', 'part',  'P006', 1,  5500.00,  5500.00),
('EL008', 'E003', 'labor', 'L004', 1,   700.00,   700.00),
('EL009', 'E004', 'part',  'P008', 1,  6800.00,  6800.00),
('EL010', 'E004', 'labor', 'L006', 1,  6000.00,  6000.00),
('EL011', 'E005', 'part',  'P011', 1, 12500.00, 12500.00),
('EL012', 'E005', 'labor', 'L007', 1,  3300.00,  3300.00);
GO
