using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AutomatedFinancialLedgerAPI.Models;

/// <summary>
/// Represents a double-entry financial transaction.
/// Each transaction has exactly two ledger entries that must balance (debits = credits).
/// </summary>
public class Transaction
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string ReferenceNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTime TransactionDate { get; set; }

    [Required]
    [Column(TypeName = "decimal(18, 2)")]
    public decimal Amount { get; set; }

    [Required]
    public TransactionType Type { get; set; }

    [Required]
    public TransactionStatus Status { get; set; } = TransactionStatus.Pending;

    // Foreign Keys
    [Required]
    public int DebitAccountId { get; set; }

    [Required]
    public int CreditAccountId { get; set; }

    // Navigation properties
    [ForeignKey(nameof(DebitAccountId))]
    public Account? DebitAccount { get; set; }

    [ForeignKey(nameof(CreditAccountId))]
    public Account? CreditAccount { get; set; }

    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    [Required]
    [MaxLength(100)]
    public string CreatedBy { get; set; } = string.Empty;

    /// <summary>
    /// Validates that the transaction follows double-entry bookkeeping rules.
    /// </summary>
    public bool IsValid()
    {
        return Amount > 0
            && DebitAccountId != CreditAccountId
            && !string.IsNullOrWhiteSpace(ReferenceNumber)
            && !string.IsNullOrWhiteSpace(Description);
    }
}

public enum TransactionType
{
    Revenue,
    Expense,
    Transfer,
    Adjustment,
    JournalEntry
}

public enum TransactionStatus
{
    Pending,
    Posted,
    Reversed,
    Voided
}
