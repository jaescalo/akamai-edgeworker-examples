import { logger } from 'log';
import { httpRequest } from 'http-request';
import { base64url } from 'encoding';
import { y as yc } from './vendor-25ff497a.js';
import 'crypto';

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

// Constants for LaunchDarkly configuration
var LD_ALL_FLAGS_URL = 'https://sdk.launchdarkly.demo.com/sdk/latest-all'; // URL to fetch all flags (must be Akamaized)
var LD_FLAG_KEY = 'test-flag'; // Key of the feature flag to evaluate
// Custom FeatureStore class implementing EdgeProvider interface
var FeatureStore = /** @class */ (function () {
    function FeatureStore(sdkKey) {
        this.sdkKey = sdkKey;
    }
    // Method to fetch all flags from LaunchDarkly
    FeatureStore.prototype.get = function (_rootKey) {
        return __awaiter(this, void 0, void 0, function () {
            var response, flagData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, httpRequest(LD_ALL_FLAGS_URL, {
                            method: 'GET',
                            headers: {
                                Authorization: this.sdkKey,
                            },
                        })];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.text()];
                    case 2:
                        flagData = _a.sent();
                        return [2 /*return*/, flagData];
                }
            });
        });
    };
    return FeatureStore;
}());
// Function to evaluate a flag using the custom FeatureStore
var evaluateFlagFromCustomFeatureStore = function (flagKey, context, defaultValue, sdkKey) { return __awaiter(void 0, void 0, void 0, function () {
    var ldClient;
    return __generator(this, function (_a) {
        ldClient = yc({
            sdkKey: sdkKey,
            featureStoreProvider: new FeatureStore(sdkKey),
        });
        // Evaluate the flag for the given context
        return [2 /*return*/, ldClient.variation(flagKey, context, defaultValue)];
    });
}); };
// Main function executed on client request
function onClientRequest(request) {
    return __awaiter(this, void 0, void 0, function () {
        var LD_CLIENT_KEY, authorizationHeader, payload, userClaim, groupsClaim, jwt, claims, claimsObject, context, result, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    LD_CLIENT_KEY = request.getVariable('PMUSER_LD_CLIENT_KEY');
                    authorizationHeader = request.getHeader('Authorization');
                    payload = '';
                    userClaim = void 0, groupsClaim = void 0;
                    // Extract and decode JWT claims if Authorization header is present
                    if (authorizationHeader) {
                        jwt = authorizationHeader[0];
                        payload = jwt.split('.')[1];
                        claims = base64url.decode(payload, "String");
                        claimsObject = JSON.parse(claims);
                        userClaim = claimsObject.sub;
                        logger.debug(userClaim);
                        groupsClaim = claimsObject.nexusGroups;
                        logger.debug(JSON.stringify(groupsClaim));
                    }
                    context = {
                        kind: 'user',
                        key: userClaim,
                        options: {
                            bootstrap: 'localStorage',
                            streaming: true
                        },
                        groups: groupsClaim
                    };
                    return [4 /*yield*/, evaluateFlagFromCustomFeatureStore(LD_FLAG_KEY, context, false, // Default value if there's a problem reading the flag
                        LD_CLIENT_KEY)];
                case 1:
                    result = _a.sent();
                    logger.debug(result);
                    // Route the request based on the flag evaluation result
                    if (result) {
                        request.route({ origin: LD_FLAG_KEY });
                        logger.debug('Routing to alternate origin');
                    }
                    else {
                        logger.debug('Routing to default origin');
                    }
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    // Handle errors by responding with a 500 status code
                    request.respondWith(500, {}, "Something went wrong: ".concat(err_1 === null || err_1 === void 0 ? void 0 : err_1.toString()));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}

export { evaluateFlagFromCustomFeatureStore, onClientRequest };
