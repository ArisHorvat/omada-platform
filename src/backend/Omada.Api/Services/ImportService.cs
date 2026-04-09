using System.Data;
using ExcelDataReader;
using Omada.Api.DTOs.Import;
using Omada.Api.Services.Interfaces;
using Omada.Api.Abstractions;

namespace Omada.Api.Services;

public class ImportService : IImportService
{
    public ImportService()
    {
        System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
    }

    public async Task<ServiceResponse<List<UserImportDto>>> ParseUsersAsync(Stream stream, string fileName)
    {
        var users = new List<UserImportDto>();
        using var reader = CreateReader(stream, fileName);

        if (reader == null) 
            return new ServiceResponse<List<UserImportDto>>(false, null, new AppError(ErrorCodes.InvalidInput, "Unsupported file format. Please upload .xlsx or .csv"));

        var result = reader.AsDataSet(new ExcelDataSetConfiguration()
        {
            ConfigureDataTable = (_) => new ExcelDataTableConfiguration() { UseHeaderRow = true }
        });

        if (result.Tables.Count == 0) 
            return new ServiceResponse<List<UserImportDto>>(false, null, new AppError(ErrorCodes.InvalidInput, "The file appears to be empty."));

        var table = result.Tables[0];
        var headers = table.Columns.Cast<DataColumn>().Select(c => c.ColumnName.Trim().ToLower()).ToList();

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
        }

        if (!map.ContainsKey("email"))
                return new ServiceResponse<List<UserImportDto>>(false, null, new AppError(ErrorCodes.InvalidInput, "Could not find an 'Email' column in the uploaded file."));

        foreach (DataRow row in table.Rows)
        {
            var user = new UserImportDto
            {
                FirstName = row[map["first"]]?.ToString()?.Trim() ?? "",
                LastName = row[map["last"]]?.ToString()?.Trim() ?? "",
                Email = row[map["email"]]?.ToString()?.Trim() ?? "",
                Role = row[map["role"]]?.ToString()?.Trim() ?? "Employee",
                PhoneNumber = row[map["phone"]]?.ToString()?.Trim() ?? "",
                CNP = row[map["cnp"]]?.ToString()?.Trim() ?? "",
                Address = row[map["address"]]?.ToString()?.Trim() ?? ""
            };

            if (!string.IsNullOrWhiteSpace(user.Email)) users.Add(user);
        }

        return new ServiceResponse<List<UserImportDto>>(true, users);
    }

    private IExcelDataReader? CreateReader(Stream stream, string fileName)
    {
        var ext = Path.GetExtension(fileName).ToLower();
        if (ext == ".csv") return ExcelReaderFactory.CreateCsvReader(stream);
        if (ext == ".xlsx" || ext == ".xls") return ExcelReaderFactory.CreateReader(stream);
        return null;
    }
}