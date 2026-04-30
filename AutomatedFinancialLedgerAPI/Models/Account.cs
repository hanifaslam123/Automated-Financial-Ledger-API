using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AutomatedFinancialLedgerAPI.Models;

/// <summary>
/// A financial account in the chart of accounts.
/// Supports the full double-entry accounting equation: Assets = Liabilities + Equity.
/// </summary>
public class Account
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(20)]
    public string AccountNumber { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    public AccountType Type { get; set; }

    [Required]
    public AccountCategory Category { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Balance { get; set; } = 0m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal OpeningBalance { get; set; } = 0m;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    [Required, MaxLength(100)]
    public string CreatedBy { get; set; } = string.Empty;

    // Navigation
    public ICollection<Transaction> DebitTransactions  { get; set; } = new List<Transaction>();
    public ICollection<Transaction> CreditTransactions { get; set; } = new List<Transaction>();
    public ICollection<AuditLog>    AuditLogs          { get; set; } = new List<AuditLog>();

    /// <summary>
    /// Returns whether this account's normal balance is on the debit or credit side.
    /// Assets and Expenses have a debit normal balance;
    /// Liabilities, Equity, and Revenue have a credit normal balance.
    /// </summary>
    public NormalBalance GetNormalBalance() => Type switch
    {
        AccountType.Asset   or AccountType.Expense  => NormalBalance.Debit,
        AccountType.Liability or AccountType.Equity
                            or AccountType.Revenue  => NormalBalance.Credit,
        _                                           => NormalBalance.Debit
    };
}

public enum AccountType
{
    Asset,
    Liability,
    Equity,
    Revenue,
    Expense
}

public enum AccountCategory
{
    CurrentAsset,
    FixedAsset,
    CurrentLiability,
    LongTermLiability,
    OwnersEquity,
    OperatingRevenue,
    NonOperatingRevenue,
    OperatingExpense,
    NonOperatingExpense,
    Contra
}

public enum NormalBalance { Debit, Credit }
