using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Net.Mail;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ALVOCOR.Pages;

public class ContactModel : PageModel
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<ContactModel> _logger;

    public ContactModel(IConfiguration configuration, ILogger<ContactModel> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    [BindProperty]
    public ContactInput Input { get; set; } = new();

    [TempData]
    public string? StatusMessage { get; set; }

    [TempData]
    public string? ErrorMessage { get; set; }

    public void OnGet()
    {
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (!string.IsNullOrWhiteSpace(Input.Website))
        {
            StatusMessage = "Thank you. Your inquiry has been received.";
            return RedirectToPage();
        }

        if (!ModelState.IsValid)
        {
            return Page();
        }

        try
        {
            await SendContactEmailAsync();
            StatusMessage = "Thank you. Your inquiry has been sent.";
            return RedirectToPage();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unable to send contact form email.");
            ErrorMessage = "The inquiry could not be sent right now. Please email contact@alvocor.com directly.";
            return Page();
        }
    }

    private async Task SendContactEmailAsync()
    {
        var section = _configuration.GetSection("ContactEmail");
        var host = GetRequiredSetting(section, "SmtpHost");
        var username = GetRequiredSetting(section, "Username");
        var password = GetRequiredSetting(section, "Password");
        var toAddress = section["ToAddress"] ?? "contact@alvocor.com";
        var fromAddress = section["FromAddress"] ?? username;
        var port = section.GetValue("SmtpPort", 587);
        var enableSsl = section.GetValue("EnableSsl", true);

        using var message = new MailMessage
        {
            From = new MailAddress(fromAddress, "ALVOCOR Website"),
            Subject = $"ALVOCOR inquiry: {Input.ServiceInterest}",
            Body = BuildEmailBody(),
            IsBodyHtml = true
        };

        message.To.Add(new MailAddress(toAddress));
        message.ReplyToList.Add(new MailAddress(Input.Email, Input.Name));

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = enableSsl,
            Credentials = new NetworkCredential(username, password)
        };

        await client.SendMailAsync(message);
    }

    private static string GetRequiredSetting(IConfiguration section, string key)
    {
        var value = section[key];

        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"ContactEmail:{key} is not configured.");
        }

        return value;
    }

    private string BuildEmailBody()
    {
        static string Encode(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);

        return $"""
            <h2>New ALVOCOR website inquiry</h2>
            <p><strong>Name:</strong> {Encode(Input.Name)}</p>
            <p><strong>Email:</strong> {Encode(Input.Email)}</p>
            <p><strong>Company:</strong> {Encode(Input.Company)}</p>
            <p><strong>Service Interest:</strong> {Encode(Input.ServiceInterest)}</p>
            <p><strong>Project Details:</strong></p>
            <p>{Encode(Input.Message).Replace("\n", "<br>")}</p>
            """;
    }
}

public class ContactInput
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [StringLength(150)]
    public string? Company { get; set; }

    [Display(Name = "Service interest")]
    [Required]
    [StringLength(100)]
    public string ServiceInterest { get; set; } = "Enterprise Software Development";

    [Display(Name = "Project details")]
    [Required]
    [StringLength(3000, MinimumLength = 20)]
    public string Message { get; set; } = string.Empty;

    public string? Website { get; set; }
}
