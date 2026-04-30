using AutomatedFinancialLedgerAPI.Data;
using AutomatedFinancialLedgerAPI.DTOs;
using AutomatedFinancialLedgerAPI.Models;
using AutomatedFinancialLedgerAPI.Repositories;

namespace AutomatedFinancialLedgerAPI.Services;

public interface IAccountService
{
    Task<AccountDto> CreateAccountAsync(CreateAccountDto dto, string userId);
    Task<AccountDto?> GetByIdAsync(int id);
    Task<IEnumerable<AccountDto>> GetAllAsync();
    Task<AccountDto> DeactivateAsync(int id, string userId);
}

/// <summary>
/// Service layer for account management operations.
/// </summary>
public class AccountService : IAccountService
{
    private readonly IAccountRepository _accountRepo;

    public AccountService(IAccountRepository accountRepo)
    {
        _accountRepo = accountRepo;
    }

    public async Task<AccountDto> CreateAccountAsync(CreateAccountDto dto, string userId)
    {
        // Check duplicate account number
        var existing = await _accountRepo.GetByAccountNumberAsync(dto.AccountNumber);
        if (existing != null)
            throw new InvalidOperationException($"Account number '{dto.AccountNumber}' already exists.");

        var account = new Account
        {
            AccountNumber = dto.AccountNumber,
            Name         = dto.Name,
            Description  = dto.Description,
            Type         = dto.Type,
            Category     = dto.Category,
            OpeningBalance = dto.OpeningBalance,
            Balance      = dto.OpeningBalance,
            CreatedBy    = userId
        };

        var created = await _accountRepo.CreateAsync(account);
        return MapToDto(created);
    }

    public async Task<AccountDto?> GetByIdAsync(int id)
    {
        var account = await _accountRepo.GetByIdAsync(id);
        return account == null ? null : MapToDto(account);
    }

    public async Task<IEnumerable<AccountDto>> GetAllAsync()
    {
        var accounts = await _accountRepo.GetAllAsync();
        return accounts.Select(MapToDto);
    }

    public async Task<AccountDto> DeactivateAsync(int id, string userId)
    {
        var account = await _accountRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Account {id} not found.");

        account.IsActive   = false;
        account.UpdatedAt  = DateTime.UtcNow;
        var updated = await _accountRepo.UpdateAsync(account);
        return MapToDto(updated);
    }

    private static AccountDto MapToDto(Account a) => new()
    {
        Id            = a.Id,
        AccountNumber = a.AccountNumber,
        Name          = a.Name,
        Description   = a.Description,
        Type          = a.Type.ToString(),
        Category      = a.Category.ToString(),
        Balance       = a.Balance,
        IsActive      = a.IsActive
    };
}
