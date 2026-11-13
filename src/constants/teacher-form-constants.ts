export const teacherPageCopy = {
  breadcrumbAdmin: 'MSWDO Admin',
  breadcrumbManagement: 'Teacher Management',
  breadcrumbAdd: 'Add Teacher',
  title: 'Add New Teacher',
  description:
    'Create a teacher profile and assign a Child Development Center.',
  back: 'Back to Teacher Management',
  backendNotice:
    'Teacher account creation runs through the connected backend. CDC data is pulled from the live registry when available, while verification and file upload steps continue to be finalized.',
  personalTitle: 'Personal Information',
  personalDescription: 'Enter the teacher’s basic contact information.',
  employmentTitle: 'Employment Information',
  employmentDescription: 'Provide employment details and your preferred CDC.',
  credentialsTitle: 'Account Credentials',
  credentialsDescription: 'Configure the teacher’s account access.',
  verificationTitle: 'Employment Verification',
  verificationDescription:
    'Track the verification of the teacher’s employment records.',
  cancel: 'Cancel',
  saveDraft: 'Save as Draft',
  createAccount: 'Create Teacher Account',
  verificationToggle: 'Track employment verification for this record',
} as const;

export const publicTeacherPageCopy = {
  breadcrumbCreate: 'Create Teacher Account',
  back: 'Back to account type',
} as const;

export const fieldCopy = {
  firstName: 'First Name',
  middleName: 'Middle Name',
  lastName: 'Last Name',
  suffix: 'Suffix',
  contactNumber: 'Contact Number',
  emailAddress: 'Email Address',
  profilePhoto: 'Profile Photo',
  teacherId: 'Teacher ID',
  employeeNumber: 'Employee Number',
  position: 'Position / Designation',
  employmentStatus: 'Employment Status',
  dateHired: 'Date Hired',
  cdc: 'Preferred Child Development Center (CDC)',
  barangay: 'Barangay',
  username: 'Username',
  loginEmail: 'Login Email',
  accountRole: 'Account Role',
  accountStatus: 'Account Status',
  activation: 'Account Activation',
  verificationStatus: 'Verification Status',
  supportingDocument: 'Supporting Employment Document',
  verificationNotes: 'Verification Notes',
  verifiedBy: 'Verified By',
  verificationDate: 'Verification Date',
} as const;

export const fieldHints = {
  middleName: 'Optional',
  suffix: 'Optional',
  contactNumber: 'Use a Philippine mobile number, such as 09171234567.',
  profilePhoto: 'JPG, PNG, or WebP. Maximum file size: 5 MB.',
  teacherId: 'Assigned by the teacher service when connected.',
  employeeNumber: 'Optional, depending on LGU records.',
  cdc: 'MSWDO Admin confirms your official CDC assignment after approval.',
  barangay: 'Filled from the selected CDC record when available.',
  username: 'Availability must be confirmed by the teacher service.',
  activation:
    'A secure activation link will be sent when the service is connected.',
  supportingDocument: 'PDF, JPG, or PNG. Maximum file size: 10 MB.',
  verifiedBy: 'Recorded from the authenticated administrator on verification.',
  verificationDate: 'Recorded when verification is completed.',
} as const;

export const fixedFieldValues = {
  pendingTeacherId: 'Assigned by teacher service',
  teacherPosition: 'Teacher',
  teacherRole: 'Teacher',
  pendingVerifiedBy: 'Set by the authenticated service',
  pendingVerificationDate: 'Set when verification is completed',
} as const;

export const placeholders = {
  firstName: 'Enter first name',
  middleName: 'Enter middle name',
  lastName: 'Enter last name',
  suffix: 'Select suffix',
  contactNumber: 'e.g. 09171234567',
  emailAddress: 'name@example.com',
  employeeNumber: 'Enter employee number',
  cdc: 'Select a child development center',
  username: 'Create or generate a username',
  loginEmail: 'Enter login email',
  verificationNotes: 'Add notes about the employment verification',
} as const;

export const employmentStatusOptions = ['Active', 'Inactive', 'On Leave'];
export const accountStatusOptions = [
  'Pending Activation',
  'Active',
  'Suspended',
];
export const verificationStatusOptions = ['Pending', 'Verified', 'Rejected'];
export const suffixOptions = ['Jr.', 'Sr.', 'II', 'III', 'IV'];


export const formMessages = {
  draftUnavailable:
    'Draft saving is not available in this flow yet. Please complete the form and submit when ready.',
  creationUnavailable:
    'The teacher account could not be created from this page. Please verify the required fields before submitting again.',
  uploadImageInvalid: 'Choose a JPG, PNG, or WebP image no larger than 5 MB.',
  uploadDocumentInvalid:
    'Choose a PDF, JPG, or PNG document no larger than 10 MB.',
  usernameMissingNames:
    'Enter the teacher’s first and last name before generating a username.',
} as const;

export const uploadLimits = {
  profilePhotoBytes: 5 * 1024 * 1024,
  documentBytes: 10 * 1024 * 1024,
} as const;
