# Common constants for tests

TEST_USERNAME = "testuser"
TEST_PROJECT_DESCRIPTION = "Test project description"
TEST_PROJECT_NAME = "test Project"
TEST_EMAIL = "testuser@example.com"
SECURE_PASSWORD = "SecurePass123!"

# Field names
DELETE_PICTURE_FIELD = "delete_picture"
PROFILE_PIC_FIELD = "profile_picture"
EMAIL_FIELD = "email"
NEW_PASSWORD_FIELD = "new_password"
PASSWORD_CONFIRMATION_FIELD = "password_confirmation"
PASSWORD_FIELD = "password"
OLD_PASSWORD_FIELD = "old_password"
FIRST_NAME_FIELD = "first_name"
LAST_NAME_FIELD = "last_name"
EMPTY_FIELD = ""
WHITESPACE_FIELD = " "
DELETE_PIC_FIELD = "delete_picture"
PROJECT_NAME_FIELD = "project_name"
PREVIEW_FIELD = "preview"
NAME_FIELD = "name"
DESCRIPTION_FIELD = "description"
OWNER_FIELD = "owner"
POSITION_X_FIELD = "position_x"
FILE_FIELD = "file"
JOB_IDS_FIELD = "jobIDs"
JOB_ID_FIELD = "jobID"

# Constant

# Constants for testing account management features in a Canvas project
# Passwords
TOO_SHORT_PASSWORD = "Save-1"
UPDATED_PASSWORD = "NewSecurePassword123!"
RESET_PASSWORD = "SecurePass1234!"
NO_SPECIAL_CHAR_PASSWORD = "SecurePass123"
COMPLETELY_WRONG_PASSWORD = "securepassword"
NO_UPPERCASE_PASSWORD = "securepassword123!"
NO_LOWERCASE_PASSWORD = "SECUREPASSWORD123!"
MISMATCHED_BUT_CORRECT_PASSWORD = "NewSecurePassword123!!"
NO_NUMERIC_PASSWORD = "SecurePassword!"
MISMATCHED_BUT_CORRECT_PASSWORD_2 = "NewSecurePassword123!!!"
WRONG_LOGIN_PASSWORD = "WrongPassword123!"

TEST_FIRST_NAME = "test_first_name"
TEST_LAST_NAME = "test_last_name"
NEW_TEST_FIRST_NAME = "new_first_name"  # for update account form tests
NEW_TEST_LAST_NAME = "new_last_name"  # for update account form tests
WRONG_EMAIL = "test2@mail.de"

IS_OPENID_USER = "is_openid_user"
OPENID_PROVIDER_FIELD = "google"
CHECKBOX_TRUE = "1"
CHECKBOX_FALSE = "0"

# Constants for project_management tests
TEST_HELIOSTAT_NAME = "Heliostat"
TEST_LIGHT_SOURCE_NAME = "Light source"
TEST_RECEIVER_NAME = "Receiver"
SETTINGS_NAME = "Settings"
UPDATED_DESCRIPTION = "Updated description"
UPDATED_PROJECT_NAME = "Updated_project_name"
TEST_PROJECT_DESCRIPTION_2 = "Another test project description"
TEST_PROJECT_NAME_2 = "another_test_project"
COPY_SUFFIX = "_copy"
SHARED_SUFFIX = "_shared"
PROJECT_NAME_PROJECT_PAGE_TEST = "Test_project"
PROJECT_DESCRIPTION_PROJECT_PAGE_TEST = "Test project description"
PROJECT_DESCRIPTION_PROJECT_PAGE_TEST_2 = "Test project description"
PROJECT_NAME_PROJECT_PAGE_TEST_2 = "Test_project_2"
PROJECT_NAME_WITH_WHITESPACE = " Test project 2 "
PROJECT_DESCRIPTION_WITH_WHITESPACE = " Test project description "
PROJECT_NAME_DUPLICATE_NAME = "Test project 2"

# Constants for autosave_api tests

HELIOSTAT_NAME = "Heliostat 1"
LIGHT_SOURCE_NAME = "Light Source"
RECEIVER_NAME = "Receiver 1"
NEW_HELIOSTAT_NAME = "New Heliostat"
NEW_LIGHT_SOURCE_NAME = "New Light Source"
NEW_RECEIVER_NAME = "New Receiver"
HELIOSTAT_LIST_NAME = "heliostat_list"
LIGHT_SOURCE_LIST_NAME = "light_source_list"
RECEIVER_LIST_NAME = "receiver_list"
NEW_PROJECT_NAME = "New Project"
POSITION_COORDINATE = 42
RECEIVER_TYPE = "ideal"
TEST_TYPE = "test"
TEST_NUMBER = 42
TEST_FLOAT_NUMBER = 4.2

# Heliosat default values
HELIOSTAT_POSITION_X = 0
HELIOSTAT_POSITION_Y = 0
HELIOSTAT_POSITION_Z = 0

# Receiver default values
RECEIVER_POSITION_X = 0
RECEIVER_POSITION_Y = 50
RECEIVER_POSITION_Z = 0
RECEIVER_NORMAL_X = 0
RECEIVER_NORMAL_Y = 1
RECEIVER_NORMAL_Z = 0
RECEIVER_TYPE_PLANAR = "planar"
RECEIVER_CURVATURE_E = 0
RECEIVER_CURVATURE_U = 0
RECEIVER_PLANE_E = 8.629666667
RECEIVER_PLANE_U = 7.0
RECEIVER_RESOLUTION_E = 256
RECEIVER_RESOLUTION_U = 256

# Light Source default values
LIGHT_SOURCE_NUMBER_OF_RAYS = 100
LIGHT_SOURCE_TYPE = "sun"
LIGHT_SOURCE_DISTRIBUTION_TYPE = "normal"
LIGHT_SOURCE_MEAN = 0
LIGHT_SOURCE_COVARIANCE = 4.3681e-06


# job interface

STATUS = "status"
PROGRESS = "progress"
FINISHED = "Finished"
RESULT = "result"
