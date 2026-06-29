/**
 * UTM Tagging Compliance Monitor
 * Checks final URLs of all active ads and keywords for mandatory UTM parameters,
 * validates utm_campaign against campaign name, and emails an HTML report.
 */
function main() {
  var RECIPIENT = 'malokdonald@gmail.com';
  var monitor = new UtmComplianceMonitor();
  monitor.run();

  var html = monitor.generateHtmlReport();
  MailApp.sendEmail({
    to: RECIPIENT,
    subject: '🔍 UTM Compliance Report: ' + AdsApp.currentAccount().getName(),
    htmlBody: html
  });
  Logger.log('Report sent to ' + RECIPIENT);
}

var UtmComplianceMonitor = (function() {
  // ---------- CONFIG ----------
  var REQUIRED_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign'];
  var CHECK_CAMPAIGN_MATCH = true; // if true, utm_campaign must match campaign name

  function UtmComplianceMonitor() {
    this.issues = []; // { url, source, campaign, missingParams, campaignMismatch, expectedCampaign, actualUtmCampaign }
    this.totalChecked = 0;
  }

  UtmComplianceMonitor.prototype.run = function() {
    var self = this;

    // ---- Collect from ads ----
    var adIterator = AdsApp.ads()
      .withCondition('Status = ENABLED')
      .get();

    while (adIterator.hasNext()) {
      var ad = adIterator.next();
      var url = null;
      try {
        url = ad.urls().getFinalUrl();
      } catch (e) { /* some ad types lack final URL */ }
      if (url && url.trim() !== '') {
        var campaign = ad.getCampaign();
        var campaignName = campaign ? campaign.getName() : 'Unknown';
        var source = 'Ad: ' + (ad.getHeadline ? ad.getHeadline() : ad.getId());
        self.checkUrl(url, source, campaignName);
        self.totalChecked++;
      }
    }

    // ---- Collect from keywords ----
    var kwIterator = AdsApp.keywords()
      .withCondition('Status = ENABLED')
      .get();

    while (kwIterator.hasNext()) {
      var kw = kwIterator.next();
      var url = null;
      try {
        url = kw.urls().getFinalUrl();
      } catch (e) {}
      if (url && url.trim() !== '') {
        var campaign = kw.getCampaign();
        var campaignName = campaign ? campaign.getName() : 'Unknown';
        var source = 'Keyword: ' + kw.getText();
        self.checkUrl(url, source, campaignName);
        self.totalChecked++;
      }
    }
  };

  UtmComplianceMonitor.prototype.checkUrl = function(url, source, campaignName) {
    var parsed = this.parseUtmParams(url);
    var missingParams = [];
    for (var i = 0; i < REQUIRED_PARAMS.length; i++) {
      var param = REQUIRED_PARAMS[i];
      if (!parsed.hasOwnProperty(param)) {
        missingParams.push(param);
      }
    }

    var campaignMismatch = false;
    var expectedCampaign = campaignName;
    var actualUtmCampaign = parsed['utm_campaign'] || '(missing)';

    if (CHECK_CAMPAIGN_MATCH && parsed.hasOwnProperty('utm_campaign')) {
      var cleanExpected = campaignName.toLowerCase().replace(/\s+/g, '');
      var cleanActual = actualUtmCampaign.toLowerCase().replace(/\s+/g, '');
      if (cleanExpected !== cleanActual) {
        campaignMismatch = true;
      }
    }

    if (missingParams.length > 0 || campaignMismatch) {
      this.issues.push({
        url: url,
        source: source,
        campaign: campaignName,
        missingParams: missingParams,
        campaignMismatch: campaignMismatch,
        expectedCampaign: expectedCampaign,
        actualUtmCampaign: actualUtmCampaign
      });
    }
  };

  // Simple query string parser (works with encoded params)
  UtmComplianceMonitor.prototype.parseUtmParams = function(url) {
    var params = {};
    var queryStart = url.indexOf('?');
    if (queryStart === -1) return params;
    var query = url.substring(queryStart + 1);
    // Remove possible fragment
    var fragmentIndex = query.indexOf('#');
    if (fragmentIndex !== -1) query = query.substring(0, fragmentIndex);

    var pairs = query.split('&');
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i];
      if (pair === '') continue;
      var parts = pair.split('=');
      var key = decodeURIComponent(parts[0]);
      var value = parts.length > 1 ? decodeURIComponent(parts.slice(1).join('=')) : '';
      params[key] = value;
    }
    return params;
  };

  UtmComplianceMonitor.prototype.generateHtmlReport = function() {
    var account = AdsApp.currentAccount();
    var date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    var html = '<html><head><meta charset="utf-8"></head><body style="font-family: Arial, sans-serif;">';
    html += '<h1 style="color: #4285F4;">🔍 UTM Tagging Compliance Monitor</h1>';
    html += '<p>Account: <b>' + account.getName() + '</b><br>Date: ' + date + '</p>';
    html += '<p>Total URLs checked: <b>' + this.totalChecked + '</b></p>';

    if (this.issues.length === 0) {
      html += '<h2 style="color:#0d904f;">✅ All URLs are UTM‑compliant.</h2>';
      if (this.totalChecked === 0) {
        html += '<p>No active ads or keywords found in the account.</p>';
      }
    } else {
      html += '<h2 style="color:#d93025;">❌ UTM Issues Found (' + this.issues.length + ')</h2>';
      html += '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse; width:100%;">';
      html += '<tr style="background:#ddd;"><th>Source</th><th>Campaign</th><th>URL</th><th>Missing Params</th><th>Campaign Mismatch</th><th>Details</th></tr>';

      for (var i = 0; i < this.issues.length; i++) {
        var iss = this.issues[i];
        var missing = iss.missingParams.length > 0 ? iss.missingParams.join(', ') : '—';
        var mismatch = iss.campaignMismatch ? 'Yes' : 'No';
        var details = '';
        if (iss.campaignMismatch) {
          details = 'Expected utm_campaign = <b>' + iss.expectedCampaign + '</b>, but found <b>' + iss.actualUtmCampaign + '</b>';
        }
        html += '<tr>';
        html += '<td>' + iss.source + '</td>';
        html += '<td>' + iss.campaign + '</td>';
        html += '<td style="word-break:break-all;">' + iss.url + '</td>';
        html += '<td>' + missing + '</td>';
        html += '<td>' + mismatch + '</td>';
        html += '<td>' + details + '</td>';
        html += '</tr>';
      }
      html += '</table>';
    }

    html += '<hr><p style="color:#666; font-size:12px;">Generated by UTM Tagging Compliance Monitor.</p>';
    html += '</body></html>';
    return html;
  };

  return UtmComplianceMonitor;
})();
