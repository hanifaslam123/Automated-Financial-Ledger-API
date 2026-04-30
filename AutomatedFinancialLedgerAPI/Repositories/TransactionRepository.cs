using AutomatedFinancialLedgerAPI.Data;
using AutomatedFinancialLedgerAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace AutomatedFinancialLedgerAPI.Repositories;

public interface ITransactionRepository
{
    Task<Transaction?> GetByIdAsync(int id);
    Task<Transaction?> GetByIdWithAccountsAsync(int id);
    Task<IEnumerable<Transaction>> GetAllWithAccountsAsync();
    Task<IEnumerable<Transaction>> GetByAccountIdAsync(int accountId);
    Task<Transaction> CreateAsync(Transaction transaction);
    Task<Transaction> UpdateAsync(Transaction transaction);
    Task<bool> ExistsAsync(int id);
}

/// <summary>
/// EF Core repository for financial transactions.
/// Uses AsNoTracking for read-only queries to improve performance.
/// </summary>
public class TransactionRepository : ITransactionRepository
{
    private readonly AppDbContext _context;

    public TransactionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Transaction?> GetByIdAsync(int id)
        => await _context.Transactions.FindAsync(id);

    public async Task<Transaction?> GetByIdWithAccountsAsync(int id)
        => await _context.Transactions
            .Include(t => t.DebitAccount)
            .Include(t => t.CreditAccount)
            .FirstOrDefaultAsync(t => t.Id == id);

    public async Task<IEnumerable<Transaction>> GetAllWithAccountsAsync()
        => await _context.Transactions
            .Include(t => t.DebitAccount)
            .Include(t => t.CreditAccount)
            .OrderByDescending(t => t.TransactionDate)
            .AsNoTracking()
            .ToListAsync();

    public async Task<IEnumerable<Transaction>> GetByAccountIdAsync(int accountId)
        => await _context.Transactions
            .Include(t => t.DebitAccount)
            .Include(t => t.CreditAccount)
            .Where(t => t.DebitAccountId == accountId || t.CreditAccountId == accountId)
            .OrderByDescending(t => t.TransactionDate)
            .AsNoTracking()
            .ToListAsync();

    public async Task<Transaction> CreateAsync(Transaction transaction)
    {
        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();
        return transaction;
    }

    public async Task<Transaction> UpdateAsync(Transaction transaction)
    {
        transaction.UpdatedAt = DateTime.UtcNow;
        _context.Transactions.Update(transaction);
        await _context.SaveChangesAsync();
        return transaction;
    }

    public async Task<bool> ExistsAsync(int id)
        => await _context.Transactions.AnyAsync(t => t.Id == id);
}
