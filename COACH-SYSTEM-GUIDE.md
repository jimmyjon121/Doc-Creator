# CareConnect Pro - Coach Profile & Caseload System Guide

## Overview

CareConnect Pro now includes an enhanced Coach Profile System that links user accounts to coach profiles with caseload management capabilities. This allows each coach to have their own login and see only their assigned clients.

## 🔐 Login System

### Existing Credentials

1. **Master Admin Access**
   - Username: `MasterAdmin`
   - Password: `FFA@dm1n2025!`
   - Full system access, can view all clients

2. **Legacy Access**
   - Username: `Doc121` 
   - Password: `FFA121`
   - Standard user access

3. **Personal Accounts**
   - Each coach creates their own username/password
   - First-time users are prompted to create an account
   - Accounts are stored locally (HIPAA compliant)

## 👥 Coach Profile System

### First-Time Setup

When a coach logs in for the first time (or has an incomplete profile), they'll automatically see the Profile Setup dialog:

1. **Full Name**: Enter your complete name
2. **Initials**: 2-3 letter initials (CRITICAL - this links you to clients!)
3. **Role**: Select from:
   - Clinical Coach
   - Case Manager
   - Family Ambassador
   - Therapist
   - Administrator
4. **Department/House**: e.g., "The Nest", "Discovery"
5. **Phone Extension**: Your office extension
6. **Maximum Caseload**: Default is 12 clients

### Updating Your Profile

Click the 👤 profile button in the header to update your profile anytime.

## 🔗 Linking Coaches to Clients

### How It Works

Clients are linked to coaches through the **initials** field. When creating or editing a client, you can assign:

- **Clinical Coach Initials**
- **Case Manager Initials**
- **Primary Therapist Initials**
- **Family Ambassador Primary Initials**
- **Family Ambassador Secondary Initials**

### Example

If Coach Sarah Johnson has initials "SJ":
- Any client with `clinicalCoachInitials: "SJ"` will appear in her caseload
- She'll see these clients in her dashboard when viewing "My Clients"

## 📊 Dashboard Views

### For Coaches
- **My Clients**: Shows only clients assigned to you
- Filters by your initials in any care team role
- Shows your current caseload count

### For Administrators  
- **All Clients**: Full view of all clients in the system
- Can see and manage any client regardless of assignment

## 🛠️ Implementation for Developers

### Key Components

1. **Coach Profile Storage**
   ```javascript
   // Profiles stored in localStorage
   {
     "username": {
       "fullName": "Sarah Johnson",
       "initials": "SJ",
       "role": "coach",
       "department": "The Nest",
       "phoneExtension": "123",
       "maxCaseload": 12,
       "isAdmin": false
     }
   }
   ```

2. **Client Assignment**
   ```javascript
   // In client records
   {
     "initials": "JD",
     "clinicalCoachInitials": "SJ",
     "caseManagerInitials": "TM",
     // ... other fields
   }
   ```

3. **Dashboard Filtering**
   ```javascript
   // Automatically filters clients by logged-in coach
   const myClients = allClients.filter(client => 
     client.clinicalCoachInitials === coach.initials ||
     client.caseManagerInitials === coach.initials ||
     client.familyAmbassadorPrimaryInitials === coach.initials
   );
   ```

### API Functions

- `CoachProfiles.updateProfile(username, profileData)` - Update coach profile
- `CoachProfiles.getProfile(username)` - Get specific coach profile
- `CoachProfiles.getCurrentCoach()` - Get logged-in coach profile
- `CoachProfiles.showSetup(isFirstTime)` - Show profile setup dialog

## 🚀 Getting Started

1. **Remove Development Auto-Login**
   - Delete or rename `enhancements/features.js` if it contains auto-login code
   - This ensures proper login flow

2. **Build the Application**
   ```bash
   npm run build
   ```

3. **Deploy to Coaches**
   - Each coach opens `dist/CareConnect-Pro.html`
   - First time: Create personal account
   - Complete profile setup with initials
   - Start managing their caseload!

## 📝 Best Practices

1. **Initials Must Be Unique**
   - Each coach should have unique 2-3 letter initials
   - This is how the system links clients to coaches

2. **Regular Profile Updates**
   - Keep department/extension current
   - Update max caseload as needed

3. **Client Assignment**
   - Always use exact initials when assigning coaches to clients
   - Double-check spelling (case-sensitive)

4. **Security**
   - Each coach should use a strong password
   - Don't share login credentials
   - Use Master Admin access sparingly

## 🔧 Troubleshooting

### Coach Can't See Their Clients
1. Check profile initials match client assignments exactly
2. Ensure role is set correctly in profile
3. Verify client status is "active"

### Login Issues
1. Check CAPS LOCK
2. Try legacy credentials as backup
3. Use Master Admin to reset if needed

### Profile Not Saving
1. Check browser allows localStorage
2. Try different browser
3. Ensure not in private/incognito mode

## 💾 Data Storage

All data is stored locally in the browser:
- User accounts: `localStorage['careconnect_user_accounts']`
- Coach profiles: `localStorage['careconnect_coach_profiles']`
- Client data: IndexedDB `HIPAACompliantDB`

This ensures HIPAA compliance as no data leaves the device.

## 📞 Support

For issues or questions:
1. Check this guide first
2. Try Master Admin login for troubleshooting
3. Contact your IT administrator

---

**Version**: 4.0.0  
**Last Updated**: November 2025
