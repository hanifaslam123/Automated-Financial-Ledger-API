using AutomatedFinancialLedgerAPI.Data;
using AutomatedFinancialLedgerAPI.DTOs;
using AutomatedFinancialLedgerAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutomatedFinancialLedgerAPI.Controllers;

/// <summary>
/// Handles user registration and JWT login.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IJwtService  _jwt;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AppDbContext db, IJwtService jwt, ILogger<AuthController> logger)
    {
        _db     = db;
        _jwt    = jwt;
        _logger = logger;
    }

    /// <summary>Login and receive a JWT token.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsActive);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password." });

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("User {Email} logged in at {Time}", user.Email, DateTime.UtcNow);

        return Ok(new LoginResponseDto
        {
            Token    = _jwt.GenerateToken(user),
            Email    = user.Email,
            FullName = user.FullName,
            Role     = user.Role,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        });
    }

    /// <summary>Register a new user. Admin only (except when no users exist).</summary>
    [HttpPost("register")]
    [AllowAnonymous]                // bootstrap first admin; lock down via seeding in production
    [ProducesResponseType(typeof(RegisterResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RegisterResponseDto>> Register([FromBody] RegisterRequestDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var exists = await _db.Users.AnyAsync(u => u.Email == dto.Email);
        if (exists)
            return BadRequest(new { message = "Email already registered." });

        var allowedRoles = new[] { "Admin", "Accountant", "Viewer" };
        if (!allowedRoles.Contains(dto.Role))
            return BadRequest(new { message = $"Role must be one of: {string.Join(", ", allowedRoles)}." });

        var user = new Models.AppUser
        {
            FullName     = dto.FullName,
            Email        = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role         = dto.Role
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        _logger.LogInformation("New user registered: {Email} ({Role})", user.Email, user.Role);

        return CreatedAtAction(nameof(Login), new RegisterResponseDto
        {
            Id       = user.Id,
            FullName = user.FullName,
            Email    = user.Email,
            Role     = user.Role
        });
    }

    /// <summary>Returns the current user's profile.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(RegisterResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<RegisterResponseDto>> Me()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var user   = await _db.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        return Ok(new RegisterResponseDto
        {
            Id       = user.Id,
            FullName = user.FullName,
            Email    = user.Email,
            Role     = user.Role
        });
    }
}
