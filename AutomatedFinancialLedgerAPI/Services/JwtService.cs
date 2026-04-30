using AutomatedFinancialLedgerAPI.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AutomatedFinancialLedgerAPI.Services;

public interface IJwtService
{
    string GenerateToken(AppUser user);
}

/// <summary>
/// Generates signed JWT tokens for authenticated users.
/// Tokens carry the user's ID, email, and role claims.
/// </summary>
public class JwtService : IJwtService
{
    private readonly IConfiguration _config;

    public JwtService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateToken(AppUser user)
    {
        var key       = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds     = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiryMin = int.TryParse(_config["Jwt:ExpiryInMinutes"], out var m) ? m : 60;

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier,     user.Id),
            new Claim(ClaimTypes.Email,              user.Email),
            new Claim(ClaimTypes.Name,               user.FullName),
            new Claim(ClaimTypes.Role,               user.Role)
        };

        var token = new JwtSecurityToken(
            issuer:             _config["Jwt:Issuer"],
            audience:           _config["Jwt:Audience"],
            claims:             claims,
            expires:            DateTime.UtcNow.AddMinutes(expiryMin),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
