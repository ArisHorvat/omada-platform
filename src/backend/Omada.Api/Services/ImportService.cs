using System.Data;
using ExcelDataReader;
using Omada.Api.DTOs.Import;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class ImportService : IImportService
{
    public ImportService()
    {
        // Required for ExcelDataReader to handle legacy encodings
        System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
    }

    public async Task<List<UserImportDto>> ParseUsersAsync(Stream stream, string fileName)
    {
        var users = new List<UserImportDto>();
        using var reader = CreateReader(stream, fileName);

        if (reader == null) return users;

        // Read the file into a DataSet
        var result = reader.AsDataSet(new ExcelDataSetConfiguration()
        {
            ConfigureDataTable = (_) => new ExcelDataTableConfiguration() { UseHeaderRow = true }
        });

        if (result.Tables.Count == 0) return users;

        var table = result.Tables[0];
        
        // Map column names to indices
        var headers = table.Columns.Cast<DataColumn>()
            .Select(c => c.ColumnName.Trim().ToLower())
            .ToList();

        var map = new Dictionary<string, int>();
        for (int i = 0; i < headers.Count; i++)
        {
            var h = headers[i];
            if (h.Contains("first")) map["first"] = i;
            else if (h.Contains("last")) map["last"] = i;
            else if (h.Contains("email")) map["email"] = i;
            else if (h.Contains("role")) map["role"] = i;
            else if (h.Contains("phone")) map["phone"] = i;
            else if (h.Contains("cnp")) map["cnp"] = i;
            else if (h.Contains("address")) map["address"] = i;
            else if (h.Contains("group") || h.Contains("department") || h.Contains("class")) map["group"] = i;
            else if (h.Contains("manager") || h.Contains("lead")) map["manager"] = i;
        }

        foreach (DataRow row in table.Rows)
        {
            var user = new UserImportDto { Role = "Employee" }; // Default role

            if (map.ContainsKey("first")) user.FirstName = row[map["first"]]?.ToString()?.Trim() ?? "";
            if (map.ContainsKey("last")) user.LastName = row[map["last"]]?.ToString()?.Trim() ?? "";
            if (map.ContainsKey("email")) user.Email = row[map["email"]]?.ToString()?.Trim() ?? "";
            if (map.ContainsKey("role")) user.Role = row[map["role"]]?.ToString()?.Trim() ?? "Employee";
            if (map.ContainsKey("phone")) user.PhoneNumber = row[map["phone"]]?.ToString()?.Trim() ?? "";
            if (map.ContainsKey("cnp")) user.CNP = row[map["cnp"]]?.ToString()?.Trim() ?? "";
            if (map.ContainsKey("address")) user.Address = row[map["address"]]?.ToString()?.Trim() ?? "";
            if (map.ContainsKey("group")) user.Group = row[map["group"]]?.ToString()?.Trim() ?? "";
            
            if (map.ContainsKey("manager"))
            {
                var val = row[map["manager"]]?.ToString()?.ToLower();
                user.IsGroupManager = val == "true" || val == "yes" || val == "1";
            }

            if (!string.IsNullOrWhiteSpace(user.Email))
            {
                users.Add(user);
            }
        }

        return await Task.FromResult(users);
    }

    private IExcelDataReader? CreateReader(Stream stream, string fileName)
    {
        var ext = Path.GetExtension(fileName).ToLower();
        if (ext == ".csv") return ExcelReaderFactory.CreateCsvReader(stream);
        return ExcelReaderFactory.CreateReader(stream); // Handles .xls and .xlsx
    }
}