using AutomatedFinancialLedgerAPI.Models;
using System.ComponentModel.DataAnnotations;

namespace AutomatedFinancialLedgerAPI.DTOs;

/// <summary>
/// DTO for creating a new double-entry financial transaction.
/// </summary>
public class CreateTransactionDto
{
    [MaxLength(100)]
    public string? ReferenceNumber { get; set; }

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be positive")]
    public decimal Amount { get; set; }

    [Required]
    public TransactionType Type { get; set; }

    [Required]
    public int DebitAccountId { get; set; }

    [Required]
    public int CreditAccountId { get; set; }

    public DateTime? TransactionDate { get; set; }
}

/// <summary>
/// Response DTO for transaction data returned to clients.
/// </summary>
public class TransactionResponseDto
{
    public int Id { get; set; }
    public string ReferenceNumber { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime TransactionDate { get; set; }
    public decimal Amount { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int DebitAccountId { get; set; }
    public string DebitAccountName { get; set; } = string.Empty;
    public int CreditAccountId { get; set; }
    public string CreditAccountName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}

/// <summary>
/// DTO for account data.
/// </summary>
public class AccountDto
{
    public int Id { get; set; }
    public string AccountNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Balance { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// DTO for creating a new account.
/// </summary>
public class CreateAccountDto
{
    [Required]
    [MaxLength(20)]
    public string AccountNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    public AccountType Type { get; set; }

    [Required]
    public AccountCategory Category { get; set; }

    [Range(0, double.MaxValue)]
    public decimal OpeningBalance { get; set; } = 0;
}
