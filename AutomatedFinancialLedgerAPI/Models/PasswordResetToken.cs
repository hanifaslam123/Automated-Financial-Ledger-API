using System.ComponentModel.DataAnnotations;

namespace AutomatedFinancialLedgerAPI.Models;

/// <summary>
/// One-time password reset token. Stores only a SHA-256 hash of the
/// raw token — the raw value is delivered to the user via email and
/// never persisted.
/// </summary>
public class PasswordResetToken
{
      [Key]
      public int Id { get; set; }

      [Required]
      public string UserId { get; set; } = string.Empty;

      public AppUser? User { get; set; }

      /// <summary>SHA-256 hex hash of the raw token (64 chars).</summary>
      [Required, MaxLength(128)]
      public string TokenHash { get; set; } = string.Empty;

      public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

      public DateTime ExpiresAt { get; set; }

      /// <summary>Set when the token has been consumed; null while still valid.</summary>
      public DateTime? UsedAt { get; set; }
}
