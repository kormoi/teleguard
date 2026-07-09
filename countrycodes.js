
const { isValidPhoneNumber, parsePhoneNumberFromString, getCountries } = require("libphonenumber-js");
const { getCountryCallingCode } = require("libphonenumber-js/mobile");

/**
 * Need to check Alpha 2 and Alpha 3 before launch
 * Flag checked
 * Dialling code need a final check also
 */



function getmatcheddialling(){
    let all = [];
    let matched = [];
    for (const item of countrydiallingCodes) {
        if (all.includes(item.dialling)) {
            if (!matched.includes(item.dialling)) {
                matched.push(item.dialling);
            }
            all.push(item.dialling);
        }
        all.push(item.dialling);
    }
    return matched;
}
function getonlynames() {
    let allnames = [];
    for (const value of countrydiallingCodes) {
        allnames.push(value.name);
    }
    return allnames;
}
function getallcountryname() {
    let allnames = [];
    for (const value of countrydiallingCodes) {
        if (value.extra) {
            allnames.push({ name: value.name, extra: value.extra });
        } else {
            allnames.push({ name: value.name });
        }
    }
    return allnames;
}
function flagavailablity() {
    let allnames = [];
    for (const value of countrydiallingCodes) {
        if (value.extra) {
            allnames.push({ name: value.name, extra: value.extra, alpha2: value.alpha2, flag: value.flag });
        } else {
            allnames.push({ name: value.name, alpha2: value.alpha2, flag: value.flag });
        }
    }
    return allnames;
}
function getalpha2() {
    let allnames = [];
    for (const value of countrydiallingCodes) {
        if (value.extra) {
            allnames.push({ name: value.name, extra: value.extra, flag: value.flag, alpha2: value.alpha2 });
        } else {
            allnames.push({ name: value.name, flag: value.flag, alpha2: value.alpha2 });
        }
    }
    return allnames;
}
function getalpha3() {
    let allnames = [];
    for (const value of countrydiallingCodes) {
        if (value.extra) {
            allnames.push({ name: value.name, extra: value.extra, flag: value.flag, alpha3: value.alpha3 });
        } else {
            allnames.push({ name: value.name, flag: value.flag, alpha3: value.alpha3 });
        }
    }
    return allnames;
}
function getall() {
    return countrydiallingCodes;
}
function getdiallingfromcode(code) {
    const matched = getmatcheddialling();
    if (typeof code !== "string" || matched.includes(code)) {
        return undefined;
    }
    for (const value of countrydiallingCodes) {
        if (Array.isArray(value.dialling)) {
            for (const dial of value.dialling) {
                if (dial === code) {
                    return value.dialling;
                }
            }
        } else if (code === value.dialling || code === value.alpha2 || code === value.alpha3 || code === value.name) {
            return value.dialling;
        }
    }
    return null;
}
function getalpha2fromcode(code) {
    try {
        const matched = getmatcheddialling();
        if (typeof code !== "string" || matched.includes(code)) {
            return undefined;
        }
        for (const value of countrydiallingCodes) {
            if (Array.isArray(value.dialling)) {
                for (const dial of value.dialling) {
                    if (dial === code) {
                        return value.alpha2;
                    }
                }
            } else if (code === value.dialling || code === value.alpha2 || code === value.alpha3 || code === value.name) {
                return value.alpha2;
            }
        }
        return null;
    } catch (err) {
        return null;
    }
}
function getalpha3fromcode(code) {
    const matched = getmatcheddialling();
    if (typeof code !== "string" || matched.includes(code)) {
        return undefined;
    }
    for (const value of countrydiallingCodes) {
        if (Array.isArray(value.dialling)) {
            for (const dial of value.dialling) {
                if (dial === code) {
                    return value.alpha3;
                }
            }
        } else if (code === value.dialling || code === value.alpha2 || code === value.alpha3 || code === value.name) {
            return value.alpha3;
        }
    }
    return null;
}
function getCountryNameFromCode(code) {
    const matched = getmatcheddialling();
    if (typeof code !== "string" || matched.includes(code)) {
        return undefined;
    }
    for (const value of countrydiallingCodes) {
        if (Array.isArray(value.dialling)) {
            for (const dial of value.dialling) {
                if (dial === code) {
                    return value.name;
                }
            }
        } else if (code === value.dialling || code === value.alpha2 || code === value.alpha3 || code === value.name) {
            return value.name;
        }
    }
    return null; // Return null if code not found
}
function validatePhoneNumber(country_code, phoneNumber) {
    const alpha2 = getalpha2fromcode(country_code);
    if (alpha2) {
        country_code = alpha2;
    } else {
        return null;
    }
    const country = getCountryNameFromCode(country_code);
    const valid = isValidPhoneNumber(phoneNumber, country_code);
    try{
        if (valid) {
            const parsedPhone = parsePhoneNumberFromString(phoneNumber, country);
            if (parsedPhone) {
                console.log(`Valid phone number: ${parsedPhone.formatInternational()}`);
            }
        } else {
            console.log("Invalid phone number");
        }
        return valid;
    }catch(err){
        return valid;
    }
}
/**
 * Need to check Alpha 2 and Alpha 3 before launch
 * Flag checked
 * Dialling code need a final check also
 */
module.exports = {
    getonlynames,
    getallcountryname,
    flagavailablity,
    getalpha2,
    getalpha3,
    getall,
    getdiallingfromcode,
    getalpha2fromcode,
    getalpha3fromcode,
    getCountryNameFromCode,
    validatePhoneNumber,
}