const countries = require('./countryData');

/**
 * 1. Clean user inputs by removing non-numeric characters except a leading '+'
 * @param {string} phone 
 * @returns {string} Fully sanitized digits
 */
function sanitizePhoneNumber(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+')) {
        return '+' + cleaned.replace(/\+/g, '');
    }
    return cleaned.replace(/\+/g, '');
}

/**
 * Helper to find a country structure by its unique identifiers (dialling code, alpha2, or alpha3)
 * Optimized to cleanly resolve partial/incomplete country codes (e.g., "+88" matching "+880").
 * @param {string} identifier - e.g., "BD", "BGD", "+880", "+88"
 * @returns {Object|null} The country config object
 */
function findCountryByIdentifier(identifier) {
    if (!identifier) return null;
    const cleanId = identifier.trim().toUpperCase();

    // 1. First Pass: Try to find an EXACT match (Alpha-2, Alpha-3, or full dialling code)
    let exactMatch = countries.find(country => {
        if (country.alpha2 && country.alpha2.toUpperCase() === cleanId) return true;
        if (country.alpha3 && country.alpha3.toUpperCase() === cleanId) return true;

        const codes = Array.isArray(country.dialling) ? country.dialling : [country.dialling];
        const normalizedCodes = codes.map(c => c ? c.trim().toUpperCase() : '');
        if (normalizedCodes.includes(cleanId) || normalizedCodes.includes('+' + cleanId)) return true;

        return false;
    });

    if (exactMatch) return exactMatch;

    // 2. Second Pass: If it's a numeric code string and no exact match found, try a partial prefix match
    // Clean to just numbers for safe comparison (e.g., "+88" -> "88")
    const numericCleanId = cleanId.replace(/[^0-9]/g, '');
    if (numericCleanId.length > 0) {
        let bestPartialMatch = null;
        let longestMatchLen = 0;

        for (const country of countries) {
            const codes = Array.isArray(country.dialling) ? country.dialling : [country.dialling];
            for (const code of codes) {
                if (!code) continue;
                const numericCode = code.replace(/[^0-9]/g, '');

                // See if the country dialling code starts with the provided input prefix
                // e.g., "880" startsWith "88"
                if (numericCode.startsWith(numericCleanId) && numericCode.length > longestMatchLen) {
                    longestMatchLen = numericCode.length;
                    bestPartialMatch = country;
                }
            }
        }
        if (bestPartialMatch) return bestPartialMatch;
    }

    return null;
}

/**
 * 3. Resolves overlapping dialling codes dynamically using a longest-match strategy
 * E.g. Input "+1684..." correctly returns American Samoa instead of Canada/USA (+1)
 * @param {string} cleanedPhone - Sanitized digits containing a leading "+"
 * @returns {Object|null} Highly specific country object matches
 */
function resolveCountryCollision(cleanedPhone) {
    let bestMatch = null;
    let longestPrefixLen = 0;

    for (const country of countries) {
        const codes = Array.isArray(country.dialling) ? country.dialling : [country.dialling];

        for (const code of codes) {
            if (code && cleanedPhone.startsWith(code)) {
                if (code.length > longestPrefixLen) {
                    longestPrefixLen = code.length;
                    bestMatch = country;
                }
            }
        }
    }
    return bestMatch;
}

/**
 * 4. VALIDATE WITH RAW PHONE NUMBER ONLY (Overlapping-safe)
 * Validates whether the number matches lengths, trunk codes, and network rules for SMS.
 * @param {string} rawPhone - The telephone number string input
 * @returns {Object} Operational object with status logs and structural outputs
 */
function validateForSMS(rawPhone) {
    const cleaned = sanitizePhoneNumber(rawPhone);

    if (!cleaned) {
        return { isValid: false, error: 'Empty number structure input provided.' };
    }

    // Ensure the string has a leading + for global lookup parity
    const phoneToTest = cleaned.startsWith('+') ? cleaned : '+' + cleaned;
    const country = resolveCountryCollision(phoneToTest);

    if (!country) {
        return { isValid: false, error: 'No matching international dialling code root found.' };
    }

    // Isolate pure dialling code from the matched entity to extract local payload
    const codes = Array.isArray(country.dialling) ? country.dialling : [country.dialling];
    const matchedDialling = codes.find(code => phoneToTest.startsWith(code)) || '';

    // Extract local number segment after country code
    let localPayload = phoneToTest.substring(matchedDialling.length);

    // Strip domestic prefix if mistakenly included internationally (e.g. +44 07624...)
    if (country.mobile && country.mobile.domesticprefix && localPayload.startsWith(country.mobile.domesticprefix)) {
        localPayload = localPayload.substring(country.mobile.domesticprefix.length);
    }

    // Handle empty mobile network configurations safely
    if (!country.mobile || !country.mobile.operator || country.mobile.operator.length === 0) {
        return {
            isValid: false,
            error: `Territory ${country.name} does not possess standard cellular SMS delivery routes.`
        };
    }

    // Validate Length
    if (localPayload.length !== country.mobile.length) {
        return {
            isValid: false,
            error: `Payload length mismatch. Expected ${country.mobile.length} digits, got ${localPayload.length}.`
        };
    }

    // Validate Mobile Operator
    const hasValidOperator = country.mobile.operator.some(op => localPayload.startsWith(op));
    if (!hasValidOperator) {
        return {
            isValid: false,
            error: `The prefix of subscriber number "${localPayload.substring(0, 4)}..." does not map to known mobile operators.`
        };
    }

    return {
        isValid: true,
        formattedNumber: `${matchedDialling}${localPayload}`,
        countryName: country.name,
        alpha2: country.alpha2,
        alpha3: country.alpha3
    };
}

/**
 * 5. VALIDATE BY EXPLICIT COUNTRY CODE / IDENTIFIER + PHONE NUMBER
 * Smart parsing that extracts the number perfectly even if a full international dialling code is passed.
 * @param {string} countryIdentifier - Can be dialling code ('+880', '880'), alpha2 ('BD'), or alpha3 ('BGD')
 * @param {string} rawPhone - The local phone number or full international number (e.g. '01712345678' or '+8801712345678')
 * @returns {Object} Operational validation results object
 */
function validateByCountryIdentifier(countryIdentifier, rawPhone) {
    const country = findCountryByIdentifier(countryIdentifier);
    if (!country) {
        return { isValid: false, error: `Invalid country selection criteria identifier: "${countryIdentifier}"` };
    }

    // Strip out all spaces, dashes, brackets, keeping a leading + if present
    let normalizedPhone = rawPhone.replace(/[^0-9+]/g, '');

    if (!normalizedPhone) {
        return { isValid: false, error: 'Empty telephone string payload.' };
    }

    // Isolate the primary dialling prefix for extraction (e.g., "+880")
    const primaryDialling = Array.isArray(country.dialling) ? country.dialling[0] : country.dialling;
    const numericDialling = primaryDialling.replace(/[^0-9]/g, ''); // "880"

    // SMART CHECK: If the user passed a full international number matching this country, strip the country code!
    if (normalizedPhone.startsWith('+')) {
        if (normalizedPhone.startsWith(primaryDialling)) {
            normalizedPhone = normalizedPhone.substring(primaryDialling.length);
        }
    } else if (normalizedPhone.startsWith(numericDialling)) {
        normalizedPhone = normalizedPhone.substring(numericDialling.length);
    }

    // Clean remaining string down to pure numbers for local payload parsing
    let localPayload = normalizedPhone.replace(/[^0-9]/g, '');

    // If the remaining input number contains the domestic prefix (e.g. starting with '0'), strip it cleanly
    if (country.mobile && country.mobile.domesticprefix && localPayload.startsWith(country.mobile.domesticprefix)) {
        localPayload = localPayload.substring(country.mobile.domesticprefix.length);
    }

    // Handle empty structures safely
    if (!country.mobile || !country.mobile.operator || country.mobile.operator.length === 0) {
        return {
            isValid: false,
            error: `Territory ${country.name} does not possess standard cellular SMS delivery routes.`
        };
    }

    // Validate length requirements
    if (localPayload.length !== country.mobile.length) {
        return {
            isValid: false,
            error: `Payload length mismatch for ${country.name}. Expected ${country.mobile.length} digits, got ${localPayload.length}.`
        };
    }

    // Validate mobile operators routing prefixes
    const hasValidOperator = country.mobile.operator.some(op => localPayload.startsWith(op));
    if (!hasValidOperator) {
        return {
            isValid: false,
            error: `The prefix of subscriber number does not match registered mobile networks for ${country.name}.`
        };
    }

    return {
        isValid: true,
        formattedNumber: `${primaryDialling}${localPayload}`,
        countryName: country.name,
        alpha2: country.alpha2,
        alpha3: country.alpha3
    };
}

module.exports = {
    sanitizePhoneNumber,
    findCountryByIdentifier,
    resolveCountryCollision,
    validateForSMS,
    validateByCountryIdentifier
};