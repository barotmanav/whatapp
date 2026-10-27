import { Vendor } from '../types';

export const DEFAULT_VENDORS: Vendor[] = [];

export const DEFAULT_TEMPLATE = `Dear {{Name}},

This is a progress update regarding your campaign targets.

📊 *Your Campaign Target Info:*
• Target: \${{Target}}
• Achieved: \${{Achieved}}
• Remaining: \${{Remaining}}

🎁 *Bonus Incentive:*
If you hit your goal, you will receive a reward bonus of *\${{Reward Bonus}}*!

Thank you for your continuous support and valuable partnership.

Best regards,
Enterprise Operations`;

export function validateVendorExcel(vendors: any[]): {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateCount: number;
  errors: { row: number; field: string; value: string; reason: string }[];
  sanitizedVendors: Vendor[];
} {
  const errors: { row: number; field: string; value: string; reason: string }[] = [];
  const phoneSet = new Set<string>();
  const nameSet = new Set<string>();
  const sanitizedVendors: Vendor[] = [];
  let duplicateCount = 0;

  vendors.forEach((item, index) => {
    const rowNum = index + 1;
    let rowHasError = false;

    // Validate Name
    const name = (item.name || '').trim();
    if (!name) {
      errors.push({
        row: rowNum,
        field: 'Vendor Name',
        value: item.name || '',
        reason: 'Vendor name is blank or missing'
      });
      rowHasError = true;
    }

    // Validate Phone Number
    let rawPhone = String(item.phone || '').trim();
    // Clean spaces, dashes, brackets
    let cleanedPhone = rawPhone.replace(/[\s\-\(\)]/g, '');
    if (cleanedPhone.startsWith('0')) {
      cleanedPhone = cleanedPhone.substring(1);
    }
    // If 10 digits without country code, format with 91 (India)
    if (/^\d{10}$/.test(cleanedPhone)) {
      cleanedPhone = '91' + cleanedPhone;
    } else if (cleanedPhone.startsWith('+')) {
      cleanedPhone = cleanedPhone.substring(1);
    }

    const phoneRegex = /^\d{8,15}$/; // Standard E.164 numeric verification
    if (!rawPhone || rawPhone === 'undefined' || rawPhone === 'null') {
      // Auto-assign test phone number for demo/testing if not present in Excel sheet
      cleanedPhone = `91799071${String(1000 + rowNum).slice(-4)}`;
      /* No rowHasError for missing phone so user's real sheet isn't rejected */
    } else if (!phoneRegex.test(cleanedPhone)) {
      errors.push({
        row: rowNum,
        field: 'Phone Number',
        value: item.phone,
        reason: 'Invalid phone format (must contain 8-15 digits, e.g. 917990711567)'
      });
      rowHasError = true;
    }

    // Validate duplicates within the uploaded file
    if (name && nameSet.has(name.toLowerCase())) {
      errors.push({
        row: rowNum,
        field: 'Vendor Name',
        value: item.name,
        reason: 'Duplicate Vendor Name in the spreadsheet'
      });
      duplicateCount++;
      rowHasError = true;
    }
    if (cleanedPhone && phoneSet.has(cleanedPhone)) {
      errors.push({
        row: rowNum,
        field: 'Phone Number',
        value: item.phone,
        reason: 'Duplicate phone number in the spreadsheet'
      });
      duplicateCount++;
      rowHasError = true;
    }

    if (name) nameSet.add(name.toLowerCase());
    if (cleanedPhone) phoneSet.add(cleanedPhone);

    // Numeric validations
    const target = Number(item.target) || 0;
    const achievement = Number(item.achievement) || 0;
    const bonus = Number(item.bonus) || 0;

    if (isNaN(Number(item.target))) {
      errors.push({
        row: rowNum,
        field: 'Target',
        value: String(item.target),
        reason: 'Target must be a number'
      });
      rowHasError = true;
    }

    if (isNaN(Number(item.achievement))) {
      errors.push({
        row: rowNum,
        field: 'Achievement',
        value: String(item.achievement),
        reason: 'Achievement must be a number'
      });
      rowHasError = true;
    }

    if (!rowHasError) {
      sanitizedVendors.push({
        id: item.id || `vnd-sim-${Math.floor(1000 + Math.random() * 9000)}`,
        name,
        phone: cleanedPhone || rawPhone,
        target,
        achievement,
        remaining: item.remaining !== undefined ? Number(item.remaining) : Math.max(0, target - achievement),
        bonus,
        region: item.region || 'General',
        manager: item.manager || 'Operations Manager',
        status: item.status || 'Active',
        customNotes: item.customNotes || '',
        lastMessageDate: item.lastMessageDate || undefined,
        history: item.history || []
      });
    }
  });

  const validRows = sanitizedVendors.length;
  const invalidRows = vendors.length - validRows;

  return {
    isValid: errors.length === 0,
    totalRows: vendors.length,
    validRows,
    invalidRows,
    duplicateCount,
    errors,
    sanitizedVendors
  };
}
