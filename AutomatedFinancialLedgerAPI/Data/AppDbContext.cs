using AutomatedFinancialLedgerAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace AutomatedFinancialLedgerAPI.Data;

/// <summary>
/// EF Core DbContext — ACID-compliant SQL Server schema.
/// Includes Users, Accounts, Transactions, and immutable AuditLogs.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Account>     Accounts     => Set<Account>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<AuditLog>    AuditLogs    => Set<AuditLog>();
    public DbSet<AppUser>     Users        => Set<AppUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Account ────────────────────────────────────────────────────────────
        modelBuilder.Entity<Account>(entity =>
        {
            entity.HasIndex(a => a.AccountNumber).IsUnique();
            entity.HasIndex(a => a.Name);
            entity.Property(a => a.Balance).HasPrecision(18, 2);
            entity.Property(a => a.OpeningBalance).HasPrecision(18, 2);
        });

        // ── Transaction (double-entry DB constraints) ──────────────────────────
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasIndex(t => t.ReferenceNumber).IsUnique();
            entity.HasIndex(t => t.TransactionDate);
            entity.HasIndex(t => t.Status);
            entity.Property(t => t.Amount).HasPrecision(18, 2);

            entity.HasOne(t => t.DebitAccount)
                .WithMany(a => a.DebitTransactions)
                .HasForeignKey(t => t.DebitAccountId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.CreditAccount)
                .WithMany(a => a.CreditTransactions)
                .HasForeignKey(t => t.CreditAccountId)
                .OnDelete(DeleteBehavior.Restrict);

            // DB-level: debit != credit, amount > 0
            entity.ToTable(t => t.HasCheckConstraint(
                "CK_Transaction_DifferentAccounts", "[DebitAccountId] <> [CreditAccountId]"));
            entity.ToTable(t => t.HasCheckConstraint(
                "CK_Transaction_PositiveAmount", "[Amount] > 0"));
        });

        // ── AuditLog ───────────────────────────────────────────────────────────
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasIndex(al => al.PerformedAt);
            entity.HasIndex(al => new { al.EntityType, al.EntityId });
            entity.HasIndex(al => al.PerformedBy);

            entity.HasOne(al => al.Transaction)
                .WithMany(t => t.AuditLogs)
                .HasForeignKey(al => al.TransactionId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(al => al.Account)
                .WithMany(a => a.AuditLogs)
                .HasForeignKey(al => al.AccountId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ── AppUser ────────────────────────────────────────────────────────────
        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
        });

        SeedChartOfAccounts(modelBuilder);
    }

    private static void SeedChartOfAccounts(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Account>().HasData(
            new Account { Id = 1, AccountNumber = "1000", Name = "Cash",
                Type = AccountType.Asset,     Category = AccountCategory.CurrentAsset,      CreatedBy = "System" },
            new Account { Id = 2, AccountNumber = "1100", Name = "Accounts Receivable",
                Type = AccountType.Asset,     Category = AccountCategory.CurrentAsset,      CreatedBy = "System" },
            new Account { Id = 3, AccountNumber = "1500", Name = "Equipment",
                Type = AccountType.Asset,     Category = AccountCategory.FixedAsset,        CreatedBy = "System" },
            new Account { Id = 4, AccountNumber = "2000", Name = "Accounts Payable",
                Type = AccountType.Liability, Category = AccountCategory.CurrentLiability,  CreatedBy = "System" },
            new Account { Id = 5, AccountNumber = "2500", Name = "Long-Term Debt",
                Type = AccountType.Liability, Category = AccountCategory.LongTermLiability, CreatedBy = "System" },
            new Account { Id = 6, AccountNumber = "3000", Name = "Owner Equity",
                Type = AccountType.Equity,    Category = AccountCategory.OwnersEquity,      CreatedBy = "System" },
            new Account { Id = 7, AccountNumber = "4000", Name = "Revenue",
                Type = AccountType.Revenue,   Category = AccountCategory.OperatingRevenue,  CreatedBy = "System" },
            new Account { Id = 8, AccountNumber = "5000", Name = "Operating Expenses",
                Type = AccountType.Expense,   Category = AccountCategory.OperatingExpense,  CreatedBy = "System" },
            new Account { Id = 9, AccountNumber = "5100", Name = "Salaries Expense",
                Type = AccountType.Expense,   Category = AccountCategory.OperatingExpense,  CreatedBy = "System" }
        );
    }
}
