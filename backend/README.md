# AURIXON Backend API

European ESG/Carbon Footprint Calculator SaaS Platform

**Current Version**: Phase 1 & 2 Complete ✅  
**Test Coverage**: 56/56 tests passing (100%)  
**Tech Stack**: Node.js 18+, Express, PostgreSQL, JWT, Jest

---

## 🎯 Implementation Status

### ✅ Phase 1: Authentication & Company Management (COMPLETE)

**Features:**
- User registration & login with JWT authentication
- Password hashing with bcrypt
- Multi-tenant company management
- Role-based access control (4 roles)
- User invitation & role assignment

**Roles:**
- `internal_admin` - Full system access
- `company_admin` - Company management & user invitation
- `editor` - Create/edit activities & data
- `viewer` - Read-only access

**Endpoints (9):**
```
POST   /api/auth/register              - Register new user
POST   /api/auth/login                 - Login & get JWT token
POST   /api/auth/company/signup        - Create company + admin user
GET    /api/auth/me                    - Get current user info

GET    /api/companies/:id              - Get company details
PUT    /api/companies/:id              - Update company info
GET    /api/companies/:id/users        - List company users
POST   /api/companies/:id/users        - Invite user to company
PUT    /api/companies/:id/users/:uid   - Update user role
```

---

### ✅ Phase 2: Activity Data Layer (COMPLETE)

**Features:**
- Reporting period management (fiscal year, calendar year)
- 11 activity types across Scope 1, 2, 3
- CRUD operations for all activity types
- Comprehensive validation layer
- Boundary questions (scope determination)
- Reference data API

**Activity Types:**
- **Scope 1:** Stationary combustion, mobile sources, refrigeration/AC, fire suppression, purchased gases
- **Scope 2:** Electricity, steam/heat
- **Scope 3:** Business travel (air, rail, road, hotel), commuting, transportation/distribution, waste
- **Offsets:** Carbon offset tracking

**Endpoints (11):**
```
# Reporting Periods
POST   /api/companies/:id/reporting-periods
GET    /api/companies/:id/reporting-periods
PUT    /api/companies/:id/reporting-periods/:pid
DELETE /api/companies/:id/reporting-periods/:pid

# Boundary Questions
POST   /api/companies/:id/reporting-periods/:pid/boundary-questions
GET    /api/companies/:id/reporting-periods/:pid/boundary-questions

# Reference Data (no auth required)
GET    /api/reference/activity-types
GET    /api/reference/dropdowns
GET    /api/reference/dropdowns/:name

# Activities (Dynamic CRUD for all 11 types)
POST   /api/companies/:id/activities/:type
GET    /api/companies/:id/activities/:type
GET    /api/companies/:id/activities/:type/:activityId
PUT    /api/companies/:id/activities/:type/:activityId
DELETE /api/companies/:id/activities/:type/:activityId
```

**Supported Activity Types (`:type` parameter):**
```
stationary_combustion, mobile_sources, refrigeration_ac, 
fire_suppression, purchased_gases, electricity, steam,
business_travel_air, business_travel_rail, 
business_travel_road, business_travel_hotel,
commuting, transportation_distribution, waste, offsets
```

---

## 🔄 Phase 3: CO2 Calculation Engine (NEXT)

**To Implement:**

1. **Emission Factor Database**
   - Store emission factors per activity type
   - Regional factors (location-based)
   - Supplier-specific factors (market-based)
   - Annual factor updates

2. **Calculation Service**
   - Convert activities to CO2e (CO2 equivalent)
   - Handle multiple GHG types (CO2, CH4, N2O, HFCs)
   - Scope aggregation (1, 2, 3)
   - Category breakdowns

3. **CO2 Results Storage**
   - Store calculated emissions per activity
   - Track calculation versions
   - Recalculation on factor updates
   - Audit trail

4. **Reporting API**
   - Generate emission reports by period
   - Breakdown by scope/category
   - Trend analysis (year-over-year)
   - Export formats (JSON, CSV, PDF)

**Estimated Effort**: 2-3 weeks

**New Endpoints:**
```
GET    /api/emission-factors
POST   /api/emission-factors                    # internal_admin only
POST   /api/companies/:id/periods/:pid/calculate
GET    /api/companies/:id/periods/:pid/results
GET    /api/companies/:id/periods/:pid/report
GET    /api/companies/:id/periods/:pid/export?format=csv
```

---

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js 18+ (ES Modules)
- **Framework**: Express 4.18+
- **Database**: PostgreSQL 12+ (raw SQL, no ORM)
- **Auth**: JWT + bcrypt
- **Testing**: Jest + Supertest
- **Validation**: Custom layer with dropdown checks

### Code Structure
```
backend/
├── db/
│   └── schema.sql              # 33 tables
├── src/
│   ├── controllers/            # Business logic
│   │   ├── authController.js
│   │   ├── companyController.js
│   │   ├── activityController.js    # Dynamic CRUD
│   │   ├── periodController.js
│   │   ├── boundaryController.js
│   │   └── referenceController.js
│   ├── middleware/
│   │   ├── auth.js             # JWT verification
│   │   └── rbac.js             # Role checking
│   ├── routes/                 # Route definitions
│   ├── utils/
│   │   ├── db.js               # PostgreSQL pool
│   │   └── validation.js       # Activity validation
│   ├── __tests__/              # 56 tests
│   └── server.js               # Express app
└── package.json
```

**Key Implementation Patterns:**
- Raw SQL with parameterized queries (SQL injection prevention)
- JWT in Authorization header: `Bearer <token>`
- Role middleware: `requireRole(['editor', 'company_admin'])`
- Dynamic activity CRUD (one controller for 11 types)
- Multi-tenant isolation (company_id filtering)

### Database Schema

**Core Tables (5):**
- `users` - User accounts
- `companies` - Multi-tenant companies
- `user_company_roles` - RBAC mapping
- `reporting_periods` - Time periods
- `boundary_questions` - Scope flags

**Activity Tables (11):**
Each activity type has its own table with specific fields

**Reference Tables (15):**
Dropdown options for validation (fuel_types, vehicle_types, etc.)

---

## 🧪 Testing

**Status**: 56/56 tests passing (100%)

**Test Coverage:**
- ✅ Authentication & JWT
- ✅ Company CRUD
- ✅ User invitations
- ✅ Reporting periods
- ✅ Activity CRUD (4 types tested)
- ✅ Field validation
- ✅ Dropdown validation
- ✅ Boundary questions
- ✅ Reference data
- ✅ RBAC enforcement

**Run Tests:**
```bash
npm test              # All tests
npm test -- --watch   # Watch mode
```

See [TEST_RESULTS.md](./TEST_RESULTS.md) for detailed documentation.

---

## 📋 Validation Examples

### Stationary Combustion
```json
{
  "reporting_period_id": "uuid",
  "fuel_combusted": "Natural Gas",     // Dropdown validated
  "quantity_combusted": 1000,          // Must be numeric
  "units": "kWh"
}
```

### Mobile Sources
```json
{
  "reporting_period_id": "uuid",
  "vehicle_type": "Car",               // Dropdown: Car, Van, Truck, Bus
  "calculation_method": "DISTANCE_BASED",
  "on_road_or_non_road": "ON_ROAD",
  "miles_traveled": 3107               // Required for DISTANCE_BASED
}
```

### Electricity
```json
{
  "reporting_period_id": "uuid",
  "kwh_purchased": 5000,
  "calculation_method": "LOCATION_BASED"  // or MARKET_BASED
}
```

### Business Travel Air
```json
{
  "reporting_period_id": "uuid",
  "departure_city": "New York",
  "arrival_city": "Los Angeles",
  "flight_type": "Domestic",           // Dropdown validated
  "cabin_class": "Economy",
  "distance_km": 2000
}
```

---

## 🚀 Quick Start

```bash
# 1. Install
npm install

# 2. Setup database
psql -U postgres -c "CREATE DATABASE aurixon_db"
psql -U postgres -d aurixon_db -f db/schema.sql

# 3. Configure
cp .env.example .env
# Edit .env with PostgreSQL credentials

# 4. Start
npm run dev

# 5. Test
npm test
```

See [SETUP.md](./SETUP.md) for detailed instructions.

---

## 🔐 Security

- ✅ bcrypt password hashing
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ SQL injection prevention (parameterized queries)
- ✅ Multi-tenant data isolation
- ✅ Input validation

---

## 📊 Response Formats

**Success:**
```json
{
  "message": "Activity created",
  "activity": {
    "id": "uuid",
    "fuel_combusted": "Natural Gas",
    "quantity_combusted": "1000.0000",
    ...
  }
}
```

**Validation Error:**
```json
{
  "error": "Validation failed",
  "details": [
    "Required field missing: fuel_combusted",
    "Invalid vehicle_type. Expected: Car, Van, Truck, Bus"
  ]
}
```

**Auth Error:**
```json
{
  "error": "Unauthorized",
  "message": "Token missing or invalid"
}
```
---

---

## 🎯 Summary

**What's Done:**
- ✅ Full authentication system
- ✅ Multi-tenant company management
- ✅ 11 activity types with CRUD
- ✅ Comprehensive validation
- ✅ 56 passing tests (100%)
- ✅ Production-ready backend

**What's Next:**
- ⏳ Emission factor database
- ⏳ CO2 calculation engine
- ⏳ Reporting & analytics
- ⏳ Dashboard endpoints

**Status**: Ready for Phase 3 implementation 🚀
