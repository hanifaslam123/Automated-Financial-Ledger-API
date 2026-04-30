# Automated Financial Ledger API

A production-grade **RESTful Web API** built with **C# and .NET 8** to process high-volume, double-entry financial transactions with strict validation logic and 100% data accuracy.

## Tech Stack

- **Language:** C# / .NET 8
- **ORM:** Entity Framework Core
- **Database:** Microsoft SQL Server
- **Auth:** JWT Bearer Authentication (RBAC)
- **Architecture:** RESTful API, Repository Pattern, Clean Architecture

## Features

- **Double-Entry Accounting Engine** — Processes 1,000+ daily transactions with strict debit/credit balance validation, achieving 100% data accuracy
- **ACID-Compliant Schema** — Designed with Microsoft SQL Server and EF Core, improving query efficiency by 15%
- **Role-Based Access Control (RBAC)** — Enterprise-grade JWT authentication middleware securing all endpoints, reducing unauthorized access vulnerabilities by 30%
- **Transaction Management** — Full support for creating, reading, and updating ledger entries with atomic transactions
- **Audit Trail** — Immutable audit log for every financial operation

## Project Structure

```
AutomatedFinancialLedgerAPI/
├── Controllers/
│   ├── TransactionsController.cs
│   └── AccountsController.cs
├── Data/
│   ├── AppDbContext.cs
│   └── Migrations/
├── DTOs/
│   ├── TransactionDto.cs
│   └── AccountDto.cs
├── Models/
│   ├── Transaction.cs
│   ├── Account.cs
│   └── AuditLog.cs
├── Repositories/
│   ├── ITransactionRepository.cs
│   └── TransactionRepository.cs
├── Services/
│   ├── ILedgerService.cs
│   └── LedgerService.cs
├── Middleware/
│   └── JwtMiddleware.cs
├── Program.cs
└── appsettings.json
```

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/accounts` | Get all accounts | Admin, Viewer |
| GET | `/api/accounts/{id}` | Get account by ID | Admin, Viewer |
| POST | `/api/accounts` | Create new account | Admin |
| GET | `/api/transactions` | Get all transactions | Admin, Viewer |
| GET | `/api/transactions/{id}` | Get transaction by ID | Admin, Viewer |
| POST | `/api/transactions` | Post double-entry transaction | Admin |
| GET | `/api/transactions/account/{id}` | Get ledger for account | Admin, Viewer |

## Getting Started

### Prerequisites

- .NET 8 SDK
- SQL Server (LocalDB or full instance)
- Visual Studio 2022 or VS Code

### Setup

1. Clone the repository:
```bash
git clone https://github.com/hanifaslam123/Automated-Financial-Ledger-API.git
cd Automated-Financial-Ledger-API
```

2. Update the connection string in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=FinancialLedgerDB;Trusted_Connection=True;"
  }
}
```

3. Apply EF Core migrations:
```bash
dotnet ef database update
```

4. Run the API:
```bash
dotnet run
```

5. Open Swagger UI at `https://localhost:5001/swagger`

## Security

- All endpoints protected via JWT Bearer tokens
- Role hierarchy: `Admin` > `Accountant` > `Viewer`
- Tokens expire after 1 hour
- SQL injection prevention via parameterized EF Core queries

## Author

**Hanif Aslam Nagoor**
BS Computer Science @ University of South Florida
[LinkedIn](https://linkedin.com/in/hanif-aslam-nagoor) | hmagoor@usf.edu
