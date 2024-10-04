export type Company = {
  _id: string; // Planhat identifier.
  name: string; // Name of the company.
  owner: string; // Planhat user id of the Account Manager / Success Manager.
  coOwner?: string; // Potential co-pilot.
  externalId?: string; // Company id in your own system.
  sourceId?: string; // Company id from an integration.
  phase?: string; // Lifecycle phase of the company.
  status?: 'prospect' | 'coming' | 'customer' | 'canceled' | 'lost'; // Status of the company.
  domains?: string[]; // Array of company domains.
  h?: number; // Health number.
  hProfile?: string; // ObjectId of the current health profile.
  csmScore?: number; // CSM Score from 1 to 5.
  mr?: number; // Current MRR plus the sum of NRR over the past 30 days.
  nrr30?: number; // NRR (Sale) value for the last 30 days.
  mrrTotal?: number; // Accumulated MRR.
  nrrTotal?: number; // Accumulated non-recurring revenue.
  mrTotal?: number; // Accumulated Revenue (mrrTotal + nrrTotal).
  description?: string; // Company description.
  address?: string; // Company physical address.
  country?: string; // Company country.
  city?: string; // Company city.
  zip?: string; // Company postal code.
  phonePrimary?: string; // Company primary phone number.
  web?: string; // Company website URL.
  customerFrom?: string; // Start date of the active license.
  customerTo?: string; // Renewal date of the active license.
  alerts?: any[]; // Array of alerts notifications.
  tags?: string[]; // Array of tags.
  products?: string[]; // Array of products.
  licenses?: any[]; // Array of licenses.
  sales?: any[]; // Array of sales.
  createDate?: string; // Creation date.
  lastUpdated?: string; // Last update date.
  lastRenewal?: string; // Last renewal date.
  renewalDaysFromNow?: number; // Days before the renewal.
  lastActive?: string; // Last active date.
  followers?: string[]; // Array of follower ids.
  usage?: Record<string, any>; // Object containing usage data.
  lastTouch?: string; // Last touch date.
  lastTouchType?: string; // Last touch type.
  lastTouchByType?: Record<string, any>; // Info about the last contact.
  nextTouch?: string; // Date for the next scheduled touch.
  phaseSince?: string; // Date since the last phase change.
  csmScoreLog?: any[]; // Array of objects containing the CSM change log.
  features?: any[]; // Array of objects containing success units.
  sunits?: Record<string, any>; // Map object containing success units.
  shareable?: Record<string, any>; // Object containing shareable information.
  lastActivities?: any[]; // Array of objects containing the last activities.
  documents?: any[]; // Array of uploaded documents.
  orgRootId?: string; // Planhat ID of the top company in the organization tree.
  orgPath?: string; // Hierarchical order of companies within the organization.
  mrr?: number; // Monthly company value.
  arr?: number; // Annual company value.
  orgMrr?: number; // MRR of the group.
  orgArr?: number; // ARR of the group.
  renewalMrr?: number; // Renewal monthly value.
  renewalArr?: number; // Renewal annual value.
  orgMrrTotal?: number; // Total group MRR.
  orgArrTotal?: number; // Total group ARR.
  orgHealthTotal?: number; // Total group health.
  orgLevel?: number; // Level of the current company in the organization.
  orgUnits?: number; // Number of child companies.
  custom?: Record<string, any>; // Custom data.
};

export type PlanhatUser = {
  _id: string; // Planhat user ID
  firstName: string; // User first name
  lastName: string; // User last name
  email: string; // User email address
  createdAt?: string; // Date when the user was created
  updatedAt?: string; // Date when the user was last updated
  role?: string; // Role of the user (e.g., admin, user)
  status?: 'active' | 'inactive'; // Status of the user (active or inactive)
  phone?: string; // User phone number
  locale?: string; // User language/locale preference
  timezone?: string; // User timezone
  company?: string; // ID of the company the user belongs to
  avatarUrl?: string; // URL of the user's avatar or profile image
  groups?: string[]; // List of group IDs the user belongs to
  permissions?: {
    // User permissions within Planhat
    isAdmin: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canViewSensitiveData: boolean;
  };
  lastLogin?: string; // Last login date for the user
  createdBy?: {
    id: string; // ID of the user who created this account
    name: string; // Name of the creator
  };
  invitedBy?: {
    id: string; // ID of the user who invited this user
    name: string; // Name of the inviter
  };
  customFields?: Record<string, any>; // Object to store custom data fields for the user
};
