# 📧 Email Templates Setup Guide

## How to Configure Email Templates in Supabase

### Step 1: Access Email Templates

1. Go to your Supabase Dashboard: https://ztmvoshrbqrgdhvyypvk.supabase.co
2. Navigate to **Authentication** → **Email Templates** in the left sidebar

### Step 2: Configure Each Template

#### 1. **Confirm Signup Template**

- Select "Confirm signup" from the template dropdown
- Replace the default HTML with the contents of: `email-templates/confirm_signup.html`
- Click **Save**

#### 2. **Magic Link Template**

- Select "Magic Link" from the template dropdown
- Replace the default HTML with the contents of: `email-templates/magic_link.html`
- Click **Save**

#### 3. **Reset Password Template**

- Select "Reset Password" from the template dropdown
- Replace the default HTML with the contents of: `email-templates/reset_password.html`
- Click **Save**

### Step 3: Configure Email Settings

1. Go to **Authentication** → **Settings** → **Email Auth**
2. Enable **Email Confirmations Required**
   - This ensures users must verify their email before signing in
3. Set **Confirmation Link Expiry**: 24 hours (default)

### Available Template Variables

Supabase provides these variables you can use in email templates:

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | The confirmation/verification link |
| `{{ .Token }}` | The verification token |
| `{{ .TokenHash }}` | Hashed version of the token |
| `{{ .SiteURL }}` | Your site URL (configured in Auth settings) |
| `{{ .Email }}` | The user's email address |

### Email Templates Included

#### ✅ `confirm_signup.html`
- **Purpose**: Sent when a new user signs up
- **Features**:
  - Welcome message with branding
  - Clear CTA button
  - Features preview
  - Fallback text link
  - Professional design matching your app's theme

#### 🔒 `reset_password.html`
- **Purpose**: Sent when user requests password reset
- **Features**:
  - Clear password reset button
  - Security warning
  - Expiry notice
  - Professional layout

#### 🔗 `magic_link.html`
- **Purpose**: Sent for passwordless authentication
- **Features**:
  - Simple verification button
  - Minimal design
  - Quick access

## User Flow with Email Verification

### Sign Up Process:

```
1. User enters email and password → Clicks "Sign Up"
   ↓
2. Account created in Supabase
   ↓
3. ✅ Success message shown: "Check your email to verify"
   ↓
4. User receives confirmation email
   ↓
5. User clicks "Confirm Email Address" button
   ↓
6. Email verified ✓
   ↓
7. User can now sign in
```

### Sign In with Unverified Email:

```
1. User tries to sign in
   ↓
2. ❌ Error: "Please verify your email address"
   ↓
3. User checks inbox and verifies email
   ↓
4. User signs in successfully
```

## Testing Email Verification

### Development/Testing:

1. **Use Supabase Email Testing**:
   - Supabase provides a testing inbox for development
   - Check **Authentication** → **Users** → Click on user → View email logs

2. **Test with Real Email**:
   ```bash
   # Sign up with your real email
   # Check your inbox for the verification email
   # Click the confirmation link
   # Try to sign in
   ```

### Production:

1. Configure custom SMTP (optional):
   - Go to **Project Settings** → **Auth**
   - Configure custom SMTP settings for your domain
   - Use services like SendGrid, AWS SES, etc.

## Customization Tips

### 1. Update Brand Colors

Replace the gradient colors in all templates:
```html
<!-- Current -->
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

<!-- Your colors -->
background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
```

### 2. Update Copy

Modify the text in templates to match your brand voice.

### 3. Add Logo

Replace the emoji with your logo:
```html
<!-- Current -->
⚡ AI Energy Oracle

<!-- With logo -->
<img src="YOUR_LOGO_URL" alt="AI Energy Oracle" style="max-width: 200px;" />
```

### 4. Update Footer Links

Replace the placeholder links in the footer:
```html
<a href="{{ .SiteURL }}/privacy">Privacy Policy</a>
```

## Troubleshooting

### Email Not Received?

1. **Check Spam Folder**: Verification emails might be filtered
2. **Check Supabase Logs**: Go to **Authentication** → **Users** → Check email logs
3. **Verify Email Provider**: Some email providers block automated emails
4. **Test Email Settings**: Use Supabase's test email feature

### Confirmation Link Not Working?

1. **Check Redirect URLs**: 
   - Go to **Authentication** → **URL Configuration**
   - Add your site URL to allowed redirect URLs
2. **Link Expired**: Links expire after 24 hours
3. **Already Verified**: Check if email is already confirmed

### Sign In Still Failing?

1. **Verify Email Confirmation Required** is enabled
2. Check user status in Supabase dashboard
3. Look for specific error messages in browser console

## Important Notes

⚠️ **Email Confirmation Required**: Make sure this setting is enabled in Supabase Auth settings for the verification flow to work properly.

💡 **Development Mode**: During development, Supabase provides a testing inbox. In production, configure proper SMTP for reliable delivery.

🔐 **Security**: Verification links expire after 24 hours for security. Users must click the link within this timeframe.

## Support

If you encounter issues:
1. Check Supabase documentation: https://supabase.com/docs/guides/auth
2. Review auth logs in Supabase dashboard
3. Test with different email providers
4. Verify all settings are correctly configured
