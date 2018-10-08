/**
 * AJAX calls to API via backend. We don't call the API directly in JS currently
 * as someone could find out what our access token is.
 */

HL.Ajax = new function()
{
    /**
     * Central ajax call.
     *
     * @param url {string}
     * @param method {string}
     * @param headers {object}
     * @param callback {object}
     */
    this.ajaxCall = function(url, method, headers, callback)
    {
        $.ajax ({
            method: method,
            url: url,
            headers: headers,
            timeout: 150000,
            success: function (data) {
                return callback(1, data);
            },
            error: function() {
                return callback(0, false);
            }
        });
    };

    /**
     * Central Ajax call that returns the promise itself rather than a callback param
     *
     * @param url {string}
     * @param method {string}
     * @param headers {object}
     */
    this.ajaxCallWithPromise = function(url, method, headers)
    {
        // defaulted to text, as letting it guess caused issues on ipad as jquery
        // guesses different in different versions
        return $.ajax ({
            method: method,
            dataType: "text",
            url: url,
            headers: headers,
            timeout: 150000
        });
    };

    /**
     * AJAX call to retrieve MIFID countries list, returning a jQuery Defer (promise)
     *
     * @returns {jQuery.Defer}
     */
    this.mifidCountries = function()
    {
        var url = '/apply/account-application/ajax/mifid-countries';
        var headers = {'Accept': 'application/json'};

        return this.ajaxCallWithPromise(url, 'GET', headers);
    };

    /**
     * AJAX call to retrieve MIFID country identifiers and validation rules, returning a jQuery Defer (promise)
     *
     * @returns {jQuery.Defer}
     */
    this.mifidIdentifiers = function(first, second)
    {
        var url = '/apply/account-application/ajax/mifid-countries?countries=' + first;
        var headers = {'Accept': 'application/json'};
        if (second) {
            url = url + ',' + second;
        }
        return this.ajaxCallWithPromise(url, 'GET', headers);
    };

     /**
     * AJAX call to the stock search API.
     *
     * @param params {object}
     * @param callback {object}
     */
    this.stockSearch = function(params, callback)
    {
        var qs = $.param(params);

        var url = 'https://online.hl.co.uk/apply/account-application/ajax/stock-search?' + qs;
        var headers = {'Accept': 'application/json'};

        return this.ajaxCall(url, 'GET', headers, callback);
    };

    /**
     * AJAX call to get stock documents from API.
     *
     * @param sedol {string}
     * @param callback {object}
     */
    this.stockDocuments = function(sedol, callback)
    {
        var url = '/apply/account-application/ajax/stock-documents?sedol=' + sedol;
        var headers = {'Accept': 'application/json'};

        return this.ajaxCall(url, 'GET', headers, callback);
    };

    /**
     * AJAX call to get fund list by manager from API.
     *
     * @param managerId {string}
     * @param callback {object}
     */
    this.getFundsForManager = function(managerId, callback)
    {
        var url = '/apply/account-application/ajax/funds-by-manager?provider_id=' + managerId;
        var headers = {'Accept': 'application/json'};

        return this.ajaxCall(url, 'GET', headers, callback);
    };

    /**
     * AJAX call to get illustration from API.
     *
     * @param callback {object}
     */
    this.getIllustration = function(callback)
    {
        var url = '/apply/account-application/ajax/sipp-illustration';
        var headers = {'Accept': 'application/pdf'};

        return this.ajaxCall(url, 'GET', headers, callback);
    };
};
