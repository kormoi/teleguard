# TeleGuard 🛡️

TeleGuard is an intelligent, high-flexibility phone number validation and formatting utility engine designed specifically for international SMS verification systems. It parses, sanitizes, and matches incoming subscriber numbers against dynamic international routing criteria—preventing database fragmentation and reducing failed SMS API payload expenses.

---

## Key Features

* **Intelligent Overlap Resolution:** Safely differentiates between countries sharing identical or nested dialing prefixes (e.g., USA/Canada `+1` vs. American Samoa `+1684`).
* **Flexible Synonyms (Proxy-Driven):** Call functions using whichever syntax matches your style (`check()`, `verify()`, `parse()`, `clean()`).
* **Dual-Execution Paradigm:** Fetch responses via traditional method executions `validate()` OR fluid dot-notation chaining properties `tg.phone().isValid`.
* **Smart Truncation Handling:** Automatically detects and isolates redundant local domestic prefixes (like a leading `0` or `1`) even if pre-pended alongside standard country codes.

---

## Core Installation Setup

Install the package via npm:

```bash
npm install teleguard
```
Require and initialize it in your backend module:

```js
const TeleGuard = require('teleguard');
const tg = new TeleGuard({ throwOnError: false });
```

## Implementation Examples
### 1. Automatic Global Lookup Strategy
Pass a single raw phone number containing arbitrary formatting or whitespace. TeleGuard will automatically resolve the country, strip the formatting, and validate against operator length configurations.


```js
// Method Execution Style
const report = tg.validate("+880 1744-327539");
console.log(report);
/* Output:
{
  isValid: true,
  formattedNumber: "+8801744327539",
  countryName: "Bangladesh",
  alpha2: "BD",
  alpha3: "BGD"
}
*/

// Dynamic Synonym Aliasing Alternative
const reportAlt = tg.verify("+8801744327539");
```

### 2. Explicit Country Validation Layer
Validate an incoming local payload string against an explicit target region via its `Alpha2`, `Alpha3`, or dialing code identifier. Handles inputs both with or without a local domestic prefix `0` flawlessly.



```js
// 1. Passing with a leading local domestic trunk prefix
const check1 = tg.validateWithCountry("BD", "01744327539");

// 2. Passing without a domestic prefix
const check2 = tg.validateWithCountry("BGD", "1744327539");

// 3. Resilient parsing even if user supplies full international codes to local inputs
const check3 = tg.verifyByCountry("bd", "+8801744327539");

// 4. Smart lookup with partial/incomplete dialing identifiers
const check4 = tg.verifyByCountry("+88", "01744327539");
```


### 3. Fluent Chain Dot-Notation Reads
Perfect for clean frontend-backend validation middleware pipelines. Access structured parameters directly as native object properties without running method executions.


```js
// Simple boolean validation flag
const isGenuine = tg.phone("+8801744327539").isValid; // true

// Direct normalized gateway string extraction
const cleanE164 = tg.phone("01744327539").country("BD").formattedNumber; // "+8801744327539"

// Fetch the complete metadata context object
const profile = tg.country("BD", "01744327539").result;
```


## API Reference Method & Synonym Matrix

| Primary Operation Method | Approved Synonym Aliases | Operational Scope Description |
| :--- | :--- | :--- |
| sanitize(str) | clean, clear, strip, normalize | Strips spacing, symbols, and alphabetical noise leaving numeric characters. |
| validate(num) | check, verify, parse | Performs longest-match lookup tracking directly from a lone phone string payload.
| validateWithCountry(id, num) | checkWithCountry, verifyWithCountry, parseWithCountry, validateByCountry, verifyByCountry| Evaluates parameters under explicit regional criteria constraints. Supports structured config parameters. |


## Global Initialization Options
Configure validation behavior globally upon initializing your Class Instance:

```js
const strictGuard = new TeleGuard({
    throwOnError: true,     // Hard-throws JS Errors instead of returning error objects
    defaultCountry: 'BD'    // Assumes default country code context if single inputs lack prefixes
});
```

License: MIT
© Md Nasiruddin Ahmed
[KORMOI](https://facebook.com/kormoi)