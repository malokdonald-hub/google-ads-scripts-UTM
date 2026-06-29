# Google Ads Scripts

## UTM Link Checker

**File:** `utm-link-checker.js`

This script scans all active ad URLs and keyword final URLs in your Google Ads account to validate that UTM parameters are correctly set. It checks for:

- ✅ `utm_source` exists
- ✅ `utm_medium` exists
- ✅ `utm_campaign` exists
- ✅ `utm_campaign` matches the campaign name (optional)

If any issues are found, the script sends a detailed email report with a clear list of problems.

---

## Installation

1. Go to **Google Ads** → **Tools & Settings** → **Bulk actions** → **Scripts**
2. Click the **+** button to create a new script
3. Give it a name (e.g., "UTM Link Checker")
4. Copy and paste the code from `utm-link-checker.js`
5. Adjust the `CONFIG` variables (see below)
6. Click **Authorize** to grant the script necessary permissions
7. Run in **Preview** mode first to test, then schedule daily

---

## Configuration

Edit the `CONFIG` object at the top of the script:

```javascript
var CONFIG = {
  REPORT_EMAIL: 'your-email@example.com',      // Where reports are sent
  CHECK_CAMPAIGN_MATCH: true,                  // Compare utm_campaign vs campaign name
  SKIP_CAMPAIGNS: ['Brand', 'Display'],        // Campaigns to skip checking
  SEND_EMPTY_REPORT: true                      // Send report even when all valid
};
REPORT_EMAIL – email address for receiving reports

CHECK_CAMPAIGN_MATCH – set to true to validate utm_campaign against campaign name

SKIP_CAMPAIGNS – list of campaign name substrings to ignore (e.g., brand campaigns)

SEND_EMPTY_REPORT – set to true to receive reports even when no issues found

Example Report
When issues are found, you receive an email like this:

text
=== UTM LINK CHECKER REPORT ===

Total URLs checked: 247
Issues found: 3

=== ISSUES FOUND ===

[1] Ad | Campaign: Summer_Sale | AdGroup: Women_Clothing
    Name: 62738491
    URL: https://store.com/product?utm_source=google&utm_medium=cpc&utm_campaign=summer
    Issue: utm_campaign mismatch: "summer" vs campaign "Summer_Sale"

[2] Keyword | Campaign: Winter_Sale | AdGroup: Men_Jackets
    Name: buy winter jacket
    URL: https://store.com/product?utm_source=google&utm_medium=cpc
    Issue: Missing utm_campaign

[3] Keyword | Campaign: Spring_Sale | AdGroup: Accessories
    Name: spring sale
    URL: https://store.com/product
    Issue: Missing utm_medium
If no issues are found:

text
=== UTM LINK CHECKER REPORT ===

Total URLs checked: 247
Issues found: 0

✅ All URLs have valid UTM parameters!
How to Use
Run in Preview Mode first – this shows what the script would do without making any changes

Run live – after testing, click "Run" to execute

Schedule – set the script to run daily (e.g., at 8:00 AM) for continuous monitoring

Review reports – check your email for daily summaries

Requirements
Google Ads account with scripting enabled

A Google account for receiving email reports

(Optional) Slack webhook integration (see examples folder)

License
MIT — free to use and modify. Attribution appreciated.

Need a Custom Script?
If you need a specific automation for your Google Ads account, contact me via Upwork.
