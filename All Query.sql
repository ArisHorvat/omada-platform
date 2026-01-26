-- 1. Organizations: The root tenants
CREATE TABLE Organizations (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    ShortName NVARCHAR(20),
    EmailDomain NVARCHAR(100) NOT NULL,
    LogoUrl NVARCHAR(500),
    PrimaryColor NVARCHAR(7) DEFAULT '#3b82f6',
    SecondaryColor NVARCHAR(7) DEFAULT '#64748b',
    TertiaryColor NVARCHAR(7) DEFAULT '#eab308',
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- 2. Users: Global user accounts
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    PhoneNumber NVARCHAR(20),
    ProfilePictureUrl NVARCHAR(500),
    CNP NVARCHAR(20),
    Address NVARCHAR(200),
    IsTwoFactorEnabled BIT DEFAULT 0,
    PasswordResetToken NVARCHAR(100),
    PasswordResetTokenExpires DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- 3. Roles: Custom roles defined by each organization
CREATE TABLE Roles (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    OrganizationId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(50) NOT NULL,
    FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id) ON DELETE CASCADE
);

-- 4. OrganizationMembers: Links Users to Organizations
CREATE TABLE OrganizationMembers (
    OrganizationId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    Role NVARCHAR(50) NOT NULL, -- Stores the Role Name for quick display
    JoinedAt DATETIME2 DEFAULT GETUTCDATE(),
    PRIMARY KEY (OrganizationId, UserId),
    FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- 5. OrganizationWidgets: Which widgets are active for an Org
CREATE TABLE OrganizationWidgets (
    OrganizationId UNIQUEIDENTIFIER NOT NULL,
    WidgetKey NVARCHAR(50) NOT NULL, -- e.g. 'news', 'attendance'
    PRIMARY KEY (OrganizationId, WidgetKey),
    FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id) ON DELETE CASCADE
);

-- 6. RolePermissions: Granular access control
CREATE TABLE RolePermissions (
    RoleId UNIQUEIDENTIFIER NOT NULL,
    WidgetKey NVARCHAR(50) NOT NULL,
    AccessLevel NVARCHAR(50) NOT NULL, -- e.g. 'admin', 'view_own'
    PRIMARY KEY (RoleId, WidgetKey),
    FOREIGN KEY (RoleId) REFERENCES Roles(Id) ON DELETE CASCADE
);

-- 7. WidgetData: NoSQL storage for widget content
CREATE TABLE WidgetData (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    OrganizationId UNIQUEIDENTIFIER NOT NULL,
    WidgetKey NVARCHAR(50) NOT NULL,
    DataJson NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id) ON DELETE CASCADE
);
-- 1. Groups: Universal structure for Classes, Departments, Projects, etc.
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Groups' AND xtype='U')
CREATE TABLE Groups (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    OrganizationId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Type NVARCHAR(50) NOT NULL, -- 'class', 'department', 'project', 'club'
    ManagerId UNIQUEIDENTIFIER NULL, -- The User ID of the Teacher/Manager
    ScheduleConfig NVARCHAR(MAX), -- JSON: Class times or Working hours
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id) ON DELETE CASCADE,
    FOREIGN KEY (ManagerId) REFERENCES Users(Id) -- Set NULL on delete usually
);

-- 2. GroupMembers: Links Users to Groups
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GroupMembers' AND xtype='U')
CREATE TABLE GroupMembers (
    GroupId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    RoleInGroup NVARCHAR(50), -- Optional: 'Class Rep', 'Team Lead'
    JoinedAt DATETIME2 DEFAULT GETUTCDATE(),
    PRIMARY KEY (GroupId, UserId),
    FOREIGN KEY (GroupId) REFERENCES Groups(Id) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- This assumes the 'Groups' table already exists.
-- If it doesn't, run the full schema from the previous step first.
ALTER TABLE Groups
ADD ParentGroupId UNIQUEIDENTIFIER NULL;

-- Optional: Add a foreign key constraint back to itself for hierarchy
ALTER TABLE Groups
ADD CONSTRAINT FK_Groups_ParentGroup FOREIGN KEY (ParentGroupId) REFERENCES Groups(Id);

ALTER TABLE Organizations
ADD OnboardingStep INT DEFAULT 0;

ALTER TABLE Organizations
ADD IsActive BIT DEFAULT 0;
