using AutomatedFinancialLedgerAPI.DTOs;
using AutomatedFinancialLedgerAPI.Models;
using AutomatedFinancialLedgerAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AutomatedFinancialLedgerAPI.Controllers;

/// <summary>
/// API controller for chart of accounts management.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class AccountsController : ControllerBase
{
    private readonly IAccountRepository _accountRepo;
    private readonly ILogger<AccountsController> _logger;

    public AccountsController(IAccountRepository accountRepo, ILogger<AccountsController> logger)
    {
        _accountRepo = accountRepo;
        _logger = logger;
    }

    /// <summary>
    /// Get all accounts in the chart of accounts.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "ViewerOrHigher")]
    [ProducesResponseType(typeof(IEnumerable<AccountDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AccountDto>>> GetAll()
    {
        var accounts = await _accountRepo.GetAllAsync();
        return Ok(accounts.Select(MapToDto));
    }

    /// <summary>
    /// Get a specific account by ID.
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Policy = "ViewerOrHigher")]
    [ProducesResponseType(typeof(AccountDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AccountDto>> GetById(int id)
    {
        var account = await _accountRepo.GetByIdAsync(id);
        if (account == null)
            return NotFound(new { message = $"Account {id} not found" });

        return Ok(MapToDto(account));
    }

    /// <summary>
    /// Create a new account in the chart of accounts.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(typeof(AccountDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AccountDto>> Create([FromBody] CreateAccountDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "Unknown";

        var account = new Account
        {
            AccountNumber = dto.AccountNumber,
            Name = dto.Name,
            Description = dto.Description,
            Type = dto.Type,
            Category = dto.Category,
            OpeningBalance = dto.OpeningBalance,
            Balance = dto.OpeningBalance,
            CreatedBy = userId
        };

        var created = await _accountRepo.CreateAsync(account);
        _logger.LogInformation("Account {AccountNumber} created by {UserId}", dto.AccountNumber, userId);

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, MapToDto(created));
    }

    /// <summary>
    /// Deactivate an account (soft delete - preserves audit trail).
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(int id)
    {
        var account = await _accountRepo.GetByIdAsync(id);
        if (account == null)
            return NotFound(new { message = $"Account {id} not found" });

        account.IsActive = false;
        account.UpdatedAt = DateTime.UtcNow;
        await _accountRepo.UpdateAsync(account);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "Unknown";
        _logger.LogWarning("Account {AccountNumber} deactivated by {UserId}", account.AccountNumber, userId);

        return NoContent();
    }

    private static AccountDto MapToDto(Account a) => new()
    {
        Id = a.Id,
        AccountNumber = a.AccountNumber,
        Name = a.Name,
        Description = a.Description,
        Type = a.Type.ToString(),
        Category = a.Category.ToString(),
        Balance = a.Balance,
        IsActive = a.IsActive
    };
}
