-- 1. Organizations
CREATE TABLE Organizations (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    ShortName NVARCHAR(20),
    EmailDomain NVARCHAR(100) NOT NULL,
    LogoUrl NVARCHAR(500),
    PrimaryColor NVARCHAR(7) DEFAULT '#3b82f6',
    SecondaryColor NVARCHAR(7) DEFAULT '#64748b',
    TertiaryColor NVARCHAR(7) DEFAULT '#eab308',
    OnboardingStep INT DEFAULT 0,
    IsActive BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- 2. Users
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
	PasswordResetToken NVARCHAR(100) NULL,
	PasswordResetTokenExpires DATETIME2 NULL,
    PhoneNumber NVARCHAR(20),
    ProfilePictureUrl NVARCHAR(500),
    CNP NVARCHAR(20),
    Address NVARCHAR(200),
    IsTwoFactorEnabled BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- 3. Roles (Linked to Org)
CREATE TABLE Roles (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    OrganizationId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(50) NOT NULL,
    FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id) ON DELETE CASCADE
);

-- 4. OrganizationMembers (Linked to Role via RoleId GUID)
CREATE TABLE OrganizationMembers (
    OrganizationId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    RoleId UNIQUEIDENTIFIER NOT NULL, 
    JoinedAt DATETIME2 DEFAULT GETUTCDATE(),
    PRIMARY KEY (OrganizationId, UserId),
    FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    FOREIGN KEY (RoleId) REFERENCES Roles(Id)
);

-- 5. RolePermissions
CREATE TABLE RolePermissions (
    RoleId UNIQUEIDENTIFIER NOT NULL,
    WidgetKey NVARCHAR(50) NOT NULL,
    AccessLevel NVARCHAR(50) NOT NULL,
    PRIMARY KEY (RoleId, WidgetKey),
    FOREIGN KEY (RoleId) REFERENCES Roles(Id) ON DELETE CASCADE
);

-- 6. OrganizationWidgets
CREATE TABLE OrganizationWidgets (
    OrganizationId UNIQUEIDENTIFIER NOT NULL,
    WidgetKey NVARCHAR(50) NOT NULL,
    PRIMARY KEY (OrganizationId, WidgetKey),
    FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id) ON DELETE CASCADE
);

-- 7. Groups (Hierarchy Support)
CREATE TABLE Groups (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    OrganizationId UNIQUEIDENTIFIER NOT NULL,
    ParentGroupId UNIQUEIDENTIFIER NULL,
    Name NVARCHAR(100) NOT NULL,
    Type NVARCHAR(50) NOT NULL,
    ManagerId UNIQUEIDENTIFIER NULL,
    ScheduleConfig NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id) ON DELETE CASCADE,
    FOREIGN KEY (ManagerId) REFERENCES Users(Id),
    FOREIGN KEY (ParentGroupId) REFERENCES Groups(Id)
);

-- 8. GroupMembers
CREATE TABLE GroupMembers (
    GroupId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    RoleInGroup NVARCHAR(50),
    JoinedAt DATETIME2 DEFAULT GETUTCDATE(),
    PRIMARY KEY (GroupId, UserId),
    FOREIGN KEY (GroupId) REFERENCES Groups(Id) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- 9. Events (Schedule)
CREATE TABLE Events (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    OrganizationId UNIQUEIDENTIFIER NOT NULL,
    Title NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    StartTime DATETIME2 NOT NULL,
    EndTime DATETIME2 NOT NULL,
    EventType INT NOT NULL,
    ColorHex NVARCHAR(7),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id) ON DELETE CASCADE
);

-- 10. EventAssociations
CREATE TABLE EventAssociations (
    EventId UNIQUEIDENTIFIER NOT NULL,
    EntityId UNIQUEIDENTIFIER NOT NULL,
    EntityType INT NOT NULL, -- 0=User, 1=Group, 2=Room
    Role INT NOT NULL,       -- 0=Attendee, 1=Organizer
    PRIMARY KEY (EventId, EntityId, EntityType),
    FOREIGN KEY (EventId) REFERENCES Events(Id) ON DELETE CASCADE
);

-- 11. WidgetData (NoSQL flex storage)
CREATE TABLE WidgetData (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    OrganizationId UNIQUEIDENTIFIER NOT NULL,
    WidgetKey NVARCHAR(50) NOT NULL,
    DataJson NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id) ON DELETE CASCADE,
    CONSTRAINT CK_WidgetData_JSON CHECK (ISJSON(DataJson) > 0)
);

-- 12. Tasks (For TaskRepository)
CREATE TABLE Tasks (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    IsCompleted BIT DEFAULT 0,
    DueDate DATETIME2 NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- 13. Messages (For MessageRepository - Chat)
CREATE TABLE Messages (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    OrganizationId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    UserName NVARCHAR(100) NOT NULL, -- Cached display name
    Content NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(Id) -- No cascade here usually, to keep history
);

-- Performance Indices
CREATE INDEX IX_OrgMembers_RoleId ON OrganizationMembers(RoleId);
CREATE INDEX IX_EventAssociations_Entity ON EventAssociations(EntityId, EntityType);
CREATE INDEX IX_Roles_Org ON Roles(OrganizationId);
CREATE INDEX IX_Tasks_User ON Tasks(UserId);
CREATE INDEX IX_Messages_Org_Time ON Messages(OrganizationId, CreatedAt DESC);