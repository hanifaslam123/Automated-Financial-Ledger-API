using AutomatedFinancialLedgerAPI.Data;
using AutomatedFinancialLedgerAPI.Models;
using System.Security.Claims;

namespace AutomatedFinancialLedgerAPI.Middleware;

/// <summary>
/// Middleware that writes an AuditLog entry for every mutating HTTP request
/// (POST, PUT, PATCH, DELETE) that returns a success status code.
/// Provides an immutable audit trail for compliance and security.
/// </summary>
public class AuditMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuditMiddleware> _logger;

    public AuditMiddleware(RequestDelegate next, ILogger<AuditMiddleware> logger)
    {
        _next   = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        await _next(context);

        // Only audit mutating, successful requests
        var method = context.Request.Method;
        var status = context.Response.StatusCode;

        bool isMutating = method is "POST" or "PUT" or "PATCH" or "DELETE";
        bool isSuccess   = status is >= 200 and < 300;

        if (!isMutating || !isSuccess)
            return;

        try
        {
            var userId    = context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "Anonymous";
            var ipAddress = context.Connection.RemoteIpAddress?.ToString();
            var userAgent = context.Request.Headers.UserAgent.ToString();
            var path      = context.Request.Path.Value ?? string.Empty;

            var log = new AuditLog
            {
                EntityType  = DeriveEntityType(path),
                EntityId    = DeriveEntityId(path),
                Action      = DeriveAction(method, status),
                PerformedBy = userId,
                IpAddress   = ipAddress,
                UserAgent   = userAgent?[..Math.Min(userAgent.Length, 200)],
                PerformedAt = DateTime.UtcNow
            };

            db.AuditLogs.Add(log);
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Audit failure must never break the response
            _logger.LogWarning(ex, "Failed to write audit log for {Method} {Path}",
                context.Request.Method, context.Request.Path);
        }
    }

    private static string DeriveEntityType(string path)
    {
        if (path.Contains("/transactions", StringComparison.OrdinalIgnoreCase)) return "Transaction";
        if (path.Contains("/accounts",     StringComparison.OrdinalIgnoreCase)) return "Account";
        return "Unknown";
    }

    private static int DeriveEntityId(string path)
    {
        // e.g. /api/transactions/42  →  42
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        foreach (var seg in segments.Reverse())
        {
            if (int.TryParse(seg, out var id)) return id;
        }
        return 0;
    }

    private static string DeriveAction(string method, int status) =>
        method switch
        {
            "POST"   => status == 201 ? "Created" : "Action",
            "PUT"    => "Updated",
            "PATCH"  => "Patched",
            "DELETE" => "Deleted",
            _        => method
        };
}
