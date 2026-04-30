using System.ComponentModel.DataAnnotations;

namespace AutomatedFinancialLedgerAPI.Models;

/// <summary>
/// Application user stored in the Users table.
/// Passwords are stored as BCrypt hashes — never plain text.
/// Roles: Admin | Accountant | Viewer
/// </summary>
public class AppUser
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>One of: Admin | Accountant | Viewer</summary>
    [Required, MaxLength(20)]
    public string Role { get; set; } = "Viewer";

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
}
