using System.ComponentModel.DataAnnotations;

namespace AutomatedFinancialLedgerAPI.DTOs;

// ─── Login ────────────────────────────────────────────────────────────────────

public class LoginRequestDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string Password { get; set; } = string.Empty;
}

public class LoginResponseDto
{
    public string Token    { get; set; } = string.Empty;
    public string Email    { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role     { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

// ─── Register ─────────────────────────────────────────────────────────────────

public class RegisterRequestDto
{
    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8), MaxLength(100)]
    public string Password { get; set; } = string.Empty;

    /// <summary>Admin | Accountant | Viewer</summary>
    [Required]
    public string Role { get; set; } = "Viewer";
}

public class RegisterResponseDto
{
    public string Id       { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email    { get; set; } = string.Empty;
    public string Role     { get; set; } = string.Empty;
}
