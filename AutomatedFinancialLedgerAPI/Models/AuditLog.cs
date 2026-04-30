using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AutomatedFinancialLedgerAPI.Models;

/// <summary>
/// Immutable audit trail entry.  Written for every mutating API call.
/// Never deleted — provides compliance and security traceability.
/// </summary>
public class AuditLog
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string EntityType { get; set; } = string.Empty;   // "Transaction" | "Account"

    [Required]
    public int EntityId { get; set; }

    [Required, MaxLength(50)]
    public string Action { get; set; } = string.Empty;        // "Created" | "Updated" | "Posted" | "Reversed" | "Deleted"

    [MaxLength(4000)]
    public string? OldValues { get; set; }   // JSON snapshot

    [MaxLength(4000)]
    public string? NewValues { get; set; }   // JSON snapshot

    [Required, MaxLength(100)]
    public string PerformedBy { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? IpAddress { get; set; }

    [MaxLength(200)]
    public string? UserAgent { get; set; }

    public DateTime PerformedAt { get; set; } = DateTime.UtcNow;

    // Optional FK back to the entity
    public int? TransactionId { get; set; }

    [ForeignKey(nameof(TransactionId))]
    public Transaction? Transaction { get; set; }

    public int? AccountId { get; set; }

    [ForeignKey(nameof(AccountId))]
    public Account? Account { get; set; }
}
