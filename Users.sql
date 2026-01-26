CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    OrganizationId UNIQUEIDENTIFIER NOT NULL,
    
    -- Login Credentials
    Email NVARCHAR(255) NOT NULL,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    
    -- Profile Information
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Role NVARCHAR(50) NOT NULL, -- e.g., 'Student', 'Teacher', 'Admin'
    
    -- Extended Profile (Editable by user)
    PhoneNumber NVARCHAR(50) NULL,
    ProfilePictureUrl NVARCHAR(MAX) NULL,
    Address NVARCHAR(255) NULL,
    
    -- Digital ID Specifics
    CNP NVARCHAR(20) NULL, -- Personal Numeric Code or Student ID
    
    -- Security Settings
    IsTwoFactorEnabled BIT DEFAULT 0,
    IsBiometricEnabled BIT DEFAULT 0, -- Optional: mostly handled client-side, but good to track preference
    
    -- Metadata
    CreatedAt DATETIME DEFAULT GETUTCDATE(),
    LastLoginAt DATETIME NULL,

    -- Constraints
    CONSTRAINT FK_Users_Organizations FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id) ON DELETE CASCADE
);

-- Indexes for fast lookup
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_OrganizationId ON Users(OrganizationId);

ALTER TABLE Users ADD PasswordResetToken NVARCHAR(MAX) NULL;
ALTER TABLE Users ADD PasswordResetTokenExpires DATETIME NULL;

-- 1. Update Users Table with new columns
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'FirstName')
BEGIN
    -- Rename FullName to FirstName (or drop and add) - assuming migration strategy
    -- For simplicity, we add new columns. You might need to migrate data manually if preserving old users.
    ALTER TABLE Users ADD FirstName NVARCHAR(100) NOT NULL DEFAULT '';
    ALTER TABLE Users ADD LastName NVARCHAR(100) NOT NULL DEFAULT '';
    ALTER TABLE Users ADD PhoneNumber NVARCHAR(50) NULL;
    ALTER TABLE Users ADD ProfilePictureUrl NVARCHAR(MAX) NULL;
    ALTER TABLE Users ADD CNP NVARCHAR(20) NULL;
    ALTER TABLE Users ADD Address NVARCHAR(255) NULL;
    ALTER TABLE Users ADD IsTwoFactorEnabled BIT NOT NULL DEFAULT 0;
    ALTER TABLE Users ADD PasswordResetToken NVARCHAR(MAX) NULL;
    ALTER TABLE Users ADD PasswordResetTokenExpires DATETIME NULL;
    ALTER TABLE Users ADD CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE();
END

-- 2. Create RecoveryRequests Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RecoveryRequests]') AND type in (N'U'))
BEGIN
    CREATE TABLE RecoveryRequests (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        OrganizationId UNIQUEIDENTIFIER NOT NULL,
        UserId UNIQUEIDENTIFIER NOT NULL,
        UserFullName NVARCHAR(200) NOT NULL,
        CNP NVARCHAR(50) NOT NULL,
        CreatedAt DATETIME DEFAULT GETUTCDATE()
    );
END

-- 3. Ensure WidgetData Table exists (for generic widgets)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[WidgetData]') AND type in (N'U'))
BEGIN
    CREATE TABLE WidgetData (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        OrganizationId UNIQUEIDENTIFIER NOT NULL,
        WidgetKey NVARCHAR(100) NOT NULL,
        DataJson NVARCHAR(MAX) NOT NULL,
        CreatedAt DATETIME DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_WidgetData_Org_Key ON WidgetData(OrganizationId, WidgetKey);
END
