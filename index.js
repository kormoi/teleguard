const phoneValidator = require('./phoneValidator');

// ==========================================
// 1. ISOLATED SYNONYM ARRAYS (ALL LOWERCASE)
// ==========================================
const phone_sanitize_actions = [
    "sanitize", "clean", "clear", "strip", "normalize", "cleanphone", "sanitizephone"
];

const pure_raw_validation_actions = [
    "validate", "check", "verify", "parse", "validatenumber", "checknumber", "verifynumber"
];

const country_explicit_validation_actions = [
    "validatewithcountry", "checkwithcountry", "verifywithcountry", "parsewithcountry", 
    "validatebycountry", "checkbycountry", "verifybycountry", "parsebycountry"
];

// ===============
// 2. Define class
// ===============

class TeleGuard {
    constructor(globalOptions = {}) {
        this.defaults = {
            throwOnError: globalOptions.throwOnError || false,
            defaultCountry: globalOptions.defaultCountry || null
        };

        // Cache parameters for fluent chaining dot notation calls
        this._lastRawPhone = null;
        this._lastCountryTarget = null;
        this._lastCountryPhone = null;

        // Return a Proxy instance to catch dynamic method executions and property reads
        return new Proxy(this, {
            get(target, prop) {
                // If the property actually exists explicitly on the class instance, return it directly
                if (prop in target) return target[prop];

                // Convert method/property to string lowercase for lookup matching
                const called = typeof prop === 'string' ? prop.toLowerCase() : prop;

                // ----------------------------------------------------
                // A. FLUENT STATE HYDRATION STORAGE TRAPS
                // ----------------------------------------------------
                if (called === 'phone') {
                    return (rawPhone) => {
                        target._lastRawPhone = rawPhone;
                        return target; // Returns proxy for chain rules
                    };
                }

                if (called === 'country') {
                    return (countryTarget, rawPhone) => {
                        target._lastCountryTarget = countryTarget;
                        target._lastCountryPhone = rawPhone;
                        return target; // Returns proxy for chain rules
                    };
                }

                // ----------------------------------------------------
                // B. SYNONYM EXECUTION TRAPS (For Method Calls)
                // ----------------------------------------------------
                if (phone_sanitize_actions.includes(called)) {
                    return (...args) => phoneValidator.sanitizePhoneNumber(...args);
                }

                if (pure_raw_validation_actions.includes(called)) {
                    return (rawPhone, opts) => target._executeRawValidation(rawPhone, opts);
                }

                if (country_explicit_validation_actions.includes(called)) {
                    return (countryId, rawPhone, opts) => target._executeCountryValidation(countryId, rawPhone, opts);
                }

                // ----------------------------------------------------
                // C. PROPERTY GETTER TRAPS (For Dot-Notation Returns)
                // ----------------------------------------------------
                if (called === 'isvalid') {
                    const res = target._resolveActiveStateResult();
                    return res ? res.isValid : false;
                }

                if (called === 'result') {
                    return target._resolveActiveStateResult() || { isValid: false, error: 'No cached operation context found.' };
                }

                if (called === 'formattednumber') {
                    const res = target._resolveActiveStateResult();
                    return res ? res.formattedNumber : null;
                }

                return undefined;
            }
        });
    }

    // ==========================================
    // CORE UNDERLYING UTILITY EXECUTION METHODS
    // ==========================================

    _handleError(errorMessage) {
        if (this.defaults.throwOnError) {
            throw new Error(`[TeleGuard Proxy Error] ${errorMessage}`);
        }
        return { isValid: false, error: errorMessage };
    }

    _executeRawValidation(rawPhone, inlineOptions = {}) {
        const input = rawPhone || this._lastRawPhone;
        const options = { ...this.defaults, ...inlineOptions };

        if (!input) return this._handleError('No phone input provided for raw matching evaluation.');

        const result = phoneValidator.validateForSMS(input);
        if (!result.isValid && options.throwOnError) throw new Error(result.error);
        return result;
    }

    _executeCountryValidation(target, rawPhone, inlineOptions = {}) {
        let countryId = '';
        let phoneInput = '';
        let options = { ...this.defaults, ...inlineOptions };

        const t = target || this._lastCountryTarget;
        const p = rawPhone || this._lastCountryPhone;

        if (typeof t === 'object' && t !== null) {
            countryId = t.country || t.countryCode || t.alpha2 || t.alpha3;
            phoneInput = t.phone || t.number || t.phoneNumber;
            if (t.throwOnError !== undefined) options.throwOnError = t.throwOnError;
        } else {
            countryId = t;
            phoneInput = p;
        }

        if (!countryId && this.defaults.defaultCountry) countryId = this.defaults.defaultCountry;
        if (!countryId) return this._handleError('Missing explicit country selection metric.');
        if (!phoneInput) return this._handleError('Missing telephone payload segment.');

        const result = phoneValidator.validateByCountryIdentifier(countryId, phoneInput);
        if (!result.isValid && options.throwOnError) throw new Error(result.error);
        return result;
    }

    _resolveActiveStateResult() {
        if (this._lastCountryTarget && this._lastCountryPhone) {
            return this._executeCountryValidation(this._lastCountryTarget, this._lastCountryPhone);
        }
        if (this._lastRawPhone) {
            return this._executeRawValidation(this._lastRawPhone);
        }
        return null;
    }

    getCountryData(identifier) {
        return phoneValidator.findCountryByIdentifier(identifier);
    }
}

// Export a proxy instantiation mirror exactly like your JwtPulseEngine format
module.exports = new Proxy(new TeleGuard(), {});