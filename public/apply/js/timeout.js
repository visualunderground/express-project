var loginTimer = {

    // Script version number - This should match the version number in the config file
    script_version: 2.4,
    log_version: 0,

    // Status flags
    logged_in: 0, // Is the window logged in?
    in_MAAD: 0, // Is the window in MAAD?
    in_cms: 0, // Is the window in the CMS?
    in_reg: 0, //Is the window in a registration?
    in_app: 0, // Is the window in an application?
    new_app: 0, // Are we at the start of a new application?
    made_payment: 0, // Has a card payment been made in an application?
    transferred_money: 0, // Has an internal transfer been made?
    setup_rs: 0, // Has a Direct Debit been set up in an application?
    is_topup: 0, // Is the application a topup?
    jisa_no_payment: 0, // Is the application a JISA with no payment?
    jisa_gift: 0, // Is the application a JISA gift?
    is_smc_compose: 0, // Is the window on the SMC compose page?
    smc_compose: 0, // Is a message currently being composed?
    popupStatus: 0, // Is the popup currently visible?
    logout_delay_started: 0, // Has the logout delay been started?
    log_xhr: 0, // Do we want to log XHRs?
    redirecting: 0, // Are we in the process of redirecting?
    pause_xhr: 0, // Are XHR calls currently being paused from triggering the keepalive?

    // Timeout and Interval variables
    timer: false,
    timer_interval: false,
    logout_listen: false,
    compose_listen: false,
    cms_listen: false,
    logout_delay: false,
    resume_xhr: false,

    // Timing variables
    timeout_ms: 0,        // Timeout timestamp
    orig_count: 60,       // Store the original count (seconds)
    count: 60,       // The current count (seconds)
    delay: 840000,   // Delay before popup appears (milliseconds: 840000 = 14 mins)
    logout_delay_ms: 3000,     // Delay after count gets to zero before actually logging out (milliseconds)
    onlineTimer: 0,        // number of extended timeout periods selected by the client
    onlineTimerCount: 0,        // number of extended timeout periods remaining
    oneMinute: 60000,    // one minute to ad to 14 minutes for extended timeouts
    extendTimeout: true,     // indicator to add an extra minute

    // Redirection variables
    redirect: false,
    url_cv_logout: '',
    url_log_in: '/my-accounts/login',
    url_home_page: '/',
    url_app_timeout: '/apply/account-application/timeout',
    url_log_out: '/my-accounts/logout',

    // Save the document title
    doc_title: document.title,

    // SMC variables
    current_composition: '',
    new_composition: '',

    // Cookie name
    c_name: 'hltimer',

    // Initialise the object and get this party started
    init: function (config) {

        // Cycle through the config variables and assign them to the object over-writing the defaults above if necessary
        for (var i in config) {
            if (typeof config[i] != 'function' && typeof config[i] != 'undefined') {
                this[i] = config[i];
            }
        }

        // Destroy subdomain cookie
        document.cookie = loginTimer.c_name + '=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;';

        // Make sure the window is named correctly
        loginTimer.nameWindow();

        // Over-ride the XMLHttpRequest prototype (if it exists) to intercept any AJAX open calls and reset the timer
        if (window.XMLHttpRequest.prototype) {
            loginTimer.open = window.XMLHttpRequest.prototype.open;
            window.XMLHttpRequest.prototype.open = loginTimer.openReplacement;
            if (loginTimer.log_xhr == 1) {
                loginTimer.send = window.XMLHttpRequest.prototype.send;
                window.XMLHttpRequest.prototype.send = loginTimer.sendReplacement;
            }
        }

        if (loginTimer.log_version == 1) {
            var version_params = 'method=logLogoutScriptVersion&version=' + encodeURI(loginTimer.script_version);
            $.ajax({
                data: version_params,
                type: 'POST',
                url: '/ajaxx/website_debug_logging.php'
            });
        }

        // Ensure count is set to orig_count
        loginTimer.count = loginTimer.orig_count;

        // Start things off...
        loginTimer.getCookie();
        loginTimer.cleanupCookie();
        loginTimer.startTimer(false);
    },

    nameWindow: function () {

        // Give the window a unique name for identification in the cookie.
        if (window.name == '' || isNaN(window.name.substring(4)) === true) {
            window.name = 'HLWN' + (Math.floor((Math.random() * 999999) + 100000));
        }

    },

    // Remove any window objects that haven't been updated for over 20 minutes. This will
    // prevent the cookie from getting too large and exceeding the browser max cookie size
    cleanupCookie: function () {

        if (typeof loginTimer._timeout.tom != 'undefined') {
            for (var c in loginTimer._timeout) {
                if (
                    c == '' ||
                    (
                        typeof loginTimer._timeout[c] == 'object' &&
                        $.isEmptyObject(loginTimer._timeout[c])
                    ) ||
                    (
                        c.substring(0, 4) == 'HLWN' &&
                        c != window.name &&
                        (
                            loginTimer._timeout[c].lu < ((new Date().getTime()) - 1200000) ||
                            typeof loginTimer._timeout[c].lu == 'undefined' ||
                            loginTimer._timeout[c].lu == 0
                        )
                    )
                ) {
                    delete loginTimer._timeout[c];
                }
            }
        }

    },

    // Clear all Timeouts and Intervals
    clearTimers: function () {
        clearTimeout(loginTimer.timer);
        clearTimeout(loginTimer.logout_listen);
        clearTimeout(loginTimer.cms_listen);
        clearTimeout(loginTimer.logout_delay);
        clearInterval(loginTimer.timer_interval);
    },

    // The AJAX open replacement function, refreshes the session then passes the data through as normal
    openReplacement: function (method, url, async, user, password) {

        // Check whether the AJAX call is to the hl.co..uk domain and whether it's to be ignored
        if (
            (url.indexOf('/') == 0 || url.indexOf('hl.co.uk') > 0)
            && url.indexOf('keepalive') < 0
            && url.indexOf('getPricesPreferences') < 0
            && url.indexOf('lightstreamer') < 0
            && url.indexOf('mmprocess') < 0
            && url.indexOf('website_debug_logging') < 0
            && loginTimer.pause_xhr == 0
        ) {
            loginTimer.onlineTimerCount = loginTimer.onlineTimer;
            loginTimer.extendTimeout = false;
            loginTimer.keepAlive(true);
        }

        // If debugging is switched on for this user log the XHR
        if (url.indexOf('website_debug_logging') < 0 && url.indexOf('create_session') < 0 && loginTimer.log_xhr == 1) {
            var xhr_params = 'method=logXHR&xhr_action=open&xhr_method=' + encodeURI(method) + '&xhr_url=' + encodeURI(url);
            $.ajax({
                data: xhr_params,
                type: 'POST',
                url: '/ajaxx/website_debug_logging.php'
            });
        }

        if (typeof loginTimer.open == 'object' || typeof loginTimer.open == 'function') {
            // Add a pause to prevent too many AJAX requests triggering keepalive requests at once
            // Causes race conditions and which can result in the wrong timeout being set
            if (loginTimer.pause_xhr == 0) {
                loginTimer.pause_xhr = 1;
                loginTimer.resume_xhr = window.setTimeout(function () {
                    loginTimer.pause_xhr = 0
                }, 3000);
            }
            // Run the XMLHttpRequest prototype open call
            return loginTimer.open.apply(this, arguments);
        }

    },

    sendReplacement: function (data) {

        var xhrParams,
            match,
            pl = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) {
                return decodeURIComponent(s.replace(pl, " "));
            };

        xhrParams = {};
        while (match = search.exec(data)) {
            xhrParams[decode(match[1])] = decode(match[2]);
        }

        var urlParams = {};
        urlParams['method'] = 'logXHR';
        urlParams['xhr_action'] = 'send';
        urlParams['xhr_data'] = JSON.stringify(xhrParams);

        if (data != undefined && data != null && data.indexOf('logXHR') < 0 && data.indexOf('logJSError') < 0 && data.indexOf('LS_phase') < 0) {
            $.ajax({
                data: urlParams,
                type: 'POST',
                url: '/ajaxx/website_debug_logging.php'
            });
        }

        return loginTimer.send.apply(this, arguments);

    },

    // Update the click event for the 'close' link in the prompt box
    modifyButtons: function () {

        $('.jqi-maadclose').unbind();
        $('.jqi-maadclose').bind('click', function () {
            // Clear the timers
            loginTimer.processAction(true);
            return false;
        });

    },

    // Start the timer...
    startTimer: function (keptAlive) {

        if (typeof keptAlive == 'undefined') {
            keptAlive = false;
        }

        var logged_in = 0;

        for (var c in loginTimer._timeout) {
            if (c.substring(0, 4) == 'HLWN' && loginTimer._timeout[c].li == 1) {
                logged_in++;
            }
        }

        // Check to see if the current time is past the time the session should have been destroyed
        // This could happen if the client browsed away to a different site then returned more than 15 minutes later
        if (logged_in > 0 && loginTimer._timeout.tom != 0 && typeof loginTimer._timeout.tom != 'undefined' && (new Date().getTime()) > ((loginTimer._timeout.tom + loginTimer.delay) + loginTimer.logout_delay_ms)) {

            // Set the timeout state to true - referenced on the login page to tell the client they timed out
            loginTimer._timeout.tos = 1;

            // Destroy the session
            loginTimer.destroySession();

        } else {

            // Set the default values to store in the cookie
            delete loginTimer._timeout.logged_out;
            delete loginTimer._timeout.comp_to;
            var delayTime = loginTimer.delay;
            if (keptAlive) {
                if (loginTimer.extendTimeout) {
                    loginTimer._timeout.tom = (new Date().getTime()) + loginTimer.oneMinute;
                    loginTimer.extendTimeout = false;
                    delayTime = loginTimer.oneMinute;
                } else {
                    loginTimer._timeout.tom = (new Date().getTime()) + loginTimer.delay;
                    loginTimer.extendTimeout = true;
                }
            } else {
                loginTimer._timeout.tom = (new Date().getTime()) + loginTimer.delay;
                loginTimer.extendTimeout = true;
            }
            loginTimer.timeout_ms = loginTimer._timeout.tom;
            loginTimer._timeout.tos = 0;
            loginTimer._timeout.smc = 0;
            if (typeof loginTimer._timeout[window.name] != 'object') {
                loginTimer._timeout[window.name] = new Object();
            }
            loginTimer._timeout[window.name].to = loginTimer._timeout.tom;
            loginTimer._timeout[window.name].li = loginTimer.logged_in;
            loginTimer._timeout[window.name].im = loginTimer.in_MAAD;
            loginTimer._timeout[window.name].ia = loginTimer.in_app;
            loginTimer._timeout[window.name].ir = loginTimer.in_reg;
            loginTimer._timeout[window.name].rp = loginTimer.retire;
            loginTimer._timeout[window.name].sm = loginTimer.smc_compose;
            loginTimer._timeout[window.name].lp = 0;
            if (loginTimer.made_payment == 1) {
                loginTimer._timeout[window.name].mp = 1;
            }
            if (loginTimer.transferred_money == 1) {
                loginTimer._timeout[window.name].tm = 1;
            }
            if (loginTimer.setup_rs == 1) {
                loginTimer._timeout[window.name].rs = 1;
            }
            if (loginTimer.is_topup == 1) {
                loginTimer._timeout[window.name].it = 1;
            }
            if (loginTimer.jisa_no_payment == 1) {
                loginTimer._timeout[window.name].jn = 1;
            }
            if (loginTimer.jisa_gift == 1) {
                loginTimer._timeout[window.name].jg = 1;
            }

            // Delete is_topup flag if no longer in_app
            if (loginTimer._timeout[window.name].it == 1 && loginTimer._timeout[window.name].ia == 0) {
                delete loginTimer._timeout[window.name].it;
            }

            // Remove the payment flags if no longer in_app or starting a new_app
            if (loginTimer.new_app == 1 || loginTimer._timeout[window.name].ia == 0) {
                delete loginTimer._timeout[window.name].mp;
                delete loginTimer._timeout[window.name].rs;
                delete loginTimer._timeout[window.name].jn;
            }

            // Check to see if any of the tabs/windows are on the SMC compose page
            for (var c in loginTimer._timeout) {
                if (c.substring(0, 4) == 'HLWN' && loginTimer._timeout[c].sm == 1) {
                    loginTimer._timeout.smc++;
                }
            }

            // Set the cookie
            loginTimer.setCookie();

            // Start the timer to display the prompt box
            loginTimer.timer = window.setTimeout(function () {
                loginTimer.checkExtendedTimeout()
            }, delayTime);

            // Start listening for other tabs/windows updating the cookie timestamp
            // Use the appropriate listener depending on if we're in the CMS or not.
            if (loginTimer.in_cms == 0) {
                loginTimer.logout_listen = window.setTimeout(function () {
                    loginTimer.logout_listener();
                }, 250);
            } else {
                loginTimer.cms_listen = window.setTimeout(function () {
                    loginTimer.cmsListener();
                }, 250);
            }

        }

    },

    // Listen for another tab/window logging out or updating the timestamp
    logout_listener: function () {

        // Get the cookie
        loginTimer.getCookie();

        var log_in_pages = 0;
        for (var c in loginTimer._timeout) {
            if (c.substring(0, 4) == 'HLWN' && loginTimer._timeout[c].lp == 1) {
                log_in_pages++;
            }
        }

        if ((loginTimer._timeout.tom == 0 || typeof loginTimer._timeout.tom == 'undefined' || loginTimer._timeout.logged_out == 1) && log_in_pages == 0) {

            // If another tab/window has logged out, log this tab/window out
            loginTimer.destroySession();

        } else if (loginTimer._timeout.tom > loginTimer.timeout_ms) {
            // Check to see if another tab/window has updated the timestamp more recently than this window/tab

            // Close the prompt box if it's open
            loginTimer.closePrompt();

            // Reset the delay based on the new timestamp
            loginTimer.resetDelay();

        }

        if (loginTimer._timeout.tos != 1) {
            // Start the listener again in 1/4 of a second
            loginTimer.logout_listen = window.setTimeout(function () {
                loginTimer.logout_listener();
            }, 250);
        }

    },

    // Retrieve the latest cookie data
    getCookie: function () {

        // Read the content of the cookie
        var cookies = document.cookie.split(';');

        for (var i = 0; i < cookies.length; i++) {

            var keyval = cookies[i].split('=');

            // Has the 'timeout' cookie been set?
            if ($.trim(keyval[0]) == loginTimer.c_name) {

                // Parse the JSON string into an object
                try {
                    var _obj = JSON.parse(decodeURI($.trim(keyval[1])));

                    // Is it an object?
                    if (typeof _obj == 'object' && !$.isEmptyObject(_obj)) {

                        // Assign the object to the '_timeout' variable
                        loginTimer._timeout = _obj;
                        return;
                    }
                } catch (e) {
                    if (loginTimer.log_xhr == 1) {
                        var data = {'location': document.URL,
                            'errorMsg': 'Invalid timeout cookie ' + cookies[i],
                            'method': 'logJSError'
                        }
                        $.ajax({
                            data: data,
                            type: 'POST',
                            url: '/ajaxx/website_debug_logging.php'
                        });
                    }
                }

            }

        }

        // Return an object with default values if not found
        loginTimer._timeout = new Object();
        if (loginTimer.extendTimeout) {
            loginTimer._timeout.tom = (new Date().getTime()) + loginTimer.oneMinute;
            loginTimer.extendTimeout = false;
        } else {
            loginTimer._timeout.tom = (new Date().getTime()) + loginTimer.delay;
            loginTimer.extendTimeout = true;
        }
        loginTimer._timeout[window.name] = new Object();
        loginTimer._timeout[window.name].to = loginTimer._timeout.tom;
        loginTimer._timeout[window.name].li = loginTimer.logged_in;
        loginTimer._timeout[window.name].im = loginTimer.in_MAAD;
        loginTimer._timeout[window.name].ia = loginTimer.in_app;
        loginTimer._timeout[window.name].ir = loginTimer.in_reg;
        loginTimer._timeout[window.name].rp = loginTimer.retire;
        loginTimer._timeout[window.name].sm = loginTimer.smc_compose;
        if (loginTimer.made_payment == 1) {
            loginTimer._timeout[window.name].mp = 1;
        }
        if (loginTimer.transferred_money == 1) {
            loginTimer._timeout[window.name].tm = 1;
        }
        if (loginTimer.setup_rs == 1) {
            loginTimer._timeout[window.name].rs = 1;
        }
        if (loginTimer.is_topup == 1) {
            loginTimer._timeout[window.name].it = 1;
        }
        if (loginTimer.jisa_no_payment == 1) {
            loginTimer._timeout[window.name].jn = 1;
        }
        if (loginTimer.jisa_gift == 1) {
            loginTimer._timeout[window.name].jg = 1;
        }
        loginTimer.setCookie();

    },

    // Set the cookie as a JSON string and allow it to expire at the end of the browsing session
    setCookie: function () {

        // Make sure the window is named correctly
        loginTimer.nameWindow();

        if (typeof loginTimer._timeout[window.name] == 'undefined') {
            loginTimer._timeout[window.name] = new Object();
            loginTimer._timeout[window.name].to = loginTimer._timeout.tom;
            loginTimer._timeout[window.name].li = loginTimer.logged_in;
            loginTimer._timeout[window.name].im = loginTimer.in_MAAD;
            loginTimer._timeout[window.name].ia = loginTimer.in_app;
            loginTimer._timeout[window.name].ir = loginTimer.in_reg;
            loginTimer._timeout[window.name].rp = loginTimer.retire;
            loginTimer._timeout[window.name].sm = loginTimer.smc_compose;
            if (loginTimer.made_payment == 1) {
                loginTimer._timeout[window.name].mp = 1;
            }
            if (loginTimer.transferred_money == 1) {
                loginTimer._timeout[window.name].tm = 1;
            }
            if (loginTimer.setup_rs == 1) {
                loginTimer._timeout[window.name].rs = 1;
            }
            if (loginTimer.is_topup == 1) {
                loginTimer._timeout[window.name].it = 1;
            }
            if (loginTimer.jisa_no_payment == 1) {
                loginTimer._timeout[window.name].jn = 1;
            }
            if (loginTimer.jisa_gift == 1) {
                loginTimer._timeout[window.name].jg = 1;
            }
        }
        loginTimer._timeout[window.name].lu = new Date().getTime();

        document.cookie = loginTimer.c_name + '=' + encodeURI(JSON.stringify(loginTimer._timeout)) + ';domain=.hl.co.uk;path=/;';

    },

    // Reset the timer - triggered by client or AJAX
    resetTimer: function (keptalive) {

        // Clear the timers
        loginTimer.clearTimers();

        // Reset the countdown
        loginTimer.count = loginTimer.orig_count;

        // Start over...
        loginTimer.startTimer(keptalive);

    },

    // Reset the delay until prompt box appears based on new timestamp
    resetDelay: function () {

        // Clear the timers
        loginTimer.clearTimers();

        // Close the prompt box if it is there
        loginTimer.closePrompt();

        // Reset the countdown
        loginTimer.count = loginTimer.orig_count;

        // Set doc title back to original
        document.title = loginTimer.doc_title;

        // Work out the new delay based on the latest timestamp from the cookie
        loginTimer.timeout_ms = loginTimer._timeout.tom;
        loginTimer.newDelay = loginTimer._timeout.tom - (new Date().getTime());

        loginTimer._timeout[window.name].to = loginTimer._timeout.tom;

        loginTimer.setCookie();

        // Start the timer again with the new delay
        loginTimer.timer = window.setTimeout(function () {
            loginTimer.checkExtendedTimeout()
        }, loginTimer.newDelay);

    },

    checkExtendedTimeout: function () {
        if (loginTimer.onlineTimerCount > 0) {
            if (typeof prices != 'undefined') {
                prices.get_preferences();
            } else {
                loginTimer.keepAlive();
            }

            if (loginTimer.extendTimeout) {
                return false;
            }
            loginTimer.onlineTimerCount--;
            return false;
        } else {
            loginTimer.activateMessage();
        }
    },

    // Display the prompt box and start the countdown
    activateMessage: function () {

        // Try to get focus
        window.focus();

        // Set some prompt variables
        var countdownTxt = '';
        var yesText = 'Yes';
        var noText = 'No';
        var timeoutPeriod = (15 * loginTimer.onlineTimer) + 14;
        var aPopupContent = new Array(
            '<span id="popupMsgContainer"><h3>Automatic log out</h3>Your session has been inactive for ' + timeoutPeriod + ' minutes. As a security precaution you will be logged out in <span id="countContainer">' + loginTimer.count + '</span> <strong>seconds</strong>.<br><br><strong>Would you like to continue with your session?</strong></span>',
            '<span id="popupMsgContainer"><h3>Automatic time out</h3>Your session has been inactive for ' + timeoutPeriod + ' minutes. As a security precaution, after <span id="countContainer">' + loginTimer.count + '</span> <strong>seconds</strong> you will be unable to continue with your application.<br><br><strong>Would you like to continue with your application?</strong></span>',
            '<h3>Automatic log out</h3>Your session was inactive for ' + (timeoutPeriod + 1) + ' minutes so for security purposes you have been logged out. Please log back in to continue.<div class="jqi-maadbuttons"><button name="close" id="jqi-maad_state0_buttonYes" rel="Yes" value="true" class="jqi-maaddefaultbutton">Close</button></div>',
            '<h3>Automatic log out</h3>Logging out... please wait.',
            '<span id="popupMsgContainer"><h3>Automatic time out</h3>Your session has been inactive for ' + timeoutPeriod + ' minutes. As a security precaution, after <span id="countContainer">' + loginTimer.count + '</span> <strong>seconds</strong> you will be unable to continue with your registration.<br><br><strong>Would you like to continue with your registration?</strong></span>'
        );

        // Decide which text to use depending on whether we're logged in or not (MAAD vs app)
        if (loginTimer.in_MAAD || loginTimer.in_cms) {
            countdownTxt = aPopupContent[0];
            yesText = 'Stay logged in';
            noText = 'Log out'
        } else if (loginTimer.in_reg) {
            countdownTxt = aPopupContent[4];
        } else {
            countdownTxt = aPopupContent[1];
        }

        // Call impromptu js popup
        $.prompt(countdownTxt, {
            buttons: {Yes: true, No: false},
            callback: loginTimer.processAction,
            loaded: loginTimer.modifyButtons,
            prefix: 'jqi-maad',
            buttonText: {Yes: yesText, No: noText},
            zIndex: 3000
        });

        // Set the popup status
        loginTimer.popupStatus = 1;

        // Start counting down
        loginTimer.timer_interval = setInterval(function () {

            loginTimer.count -= 1;

            // Have we reached zero?
            if (loginTimer.count == 0) {

                clearInterval(loginTimer.timer_interval);

                $('#popupMsgContainer').html(aPopupContent[3]);
                $('.jqi-maadbuttons').remove();

                loginTimer.logout_delay_started = 1;

                // If countdown has reached zero destroy the session
                // But after a short delay period to allow all windows to update
                loginTimer.logout_delay = window.setTimeout(function () {

                    loginTimer.logout_delay_started = 0;

                    // If in the CMS we just update the popup content
                    if (loginTimer.in_cms == 1) {
                        $('.jqi-maadbuttons').remove();
                        $('#popupMsgContainer').html(aPopupContent[2]);
                        $('.jqi-maadbuttons #jqi-maad_state0_buttonYes').bind('click', function () {
                            loginTimer.closePrompt();
                            document.title = loginTimer.doc_title;
                            return false;
                        });
                        $('.jqi-maadclose').unbind();
                        $('.jqi-maadclose').bind('click', function () {
                            loginTimer.closePrompt();
                            document.title = loginTimer.doc_title;
                            return false;
                        });
                    }

                    if (loginTimer.is_smc_compose && loginTimer.current_composition != '') {

                        // Set the timeout milliseconds cookie variable to zero
                        loginTimer._timeout.comp_to = 1;

                        // Set the cookie
                        loginTimer.setCookie();

                        if ($('.compose_subject').val() == '' || $('.compose_subject').val().indexOf('Timeout') == 0) {
                            var d = new Date().toLocaleString();
                            var subject = 'Timeout Autosave - ' + d;
                            $('.compose_subject').val(subject);
                        }

                        $('#submit-type').value = 'save';
                        $('#compose-form').submit();

                        return false;

                    }

                    // Set the timeout state to true - referenced on the login page to tell the client they timed out
                    if (typeof loginTimer._timeout == 'undefined') {
                        loginTimer._timeout = new Object();
                    }
                    loginTimer._timeout.tos = 1;
                    loginTimer.destroySession();

                }, loginTimer.logout_delay_ms);

                return false;

            } else if (loginTimer.count > 0) { // Keep going

                // Continue the countdown...
                $('#countContainer').html(loginTimer.count);

                // Alert user to notification
                document.title = loginTimer.count + ' seconds until you will be logged off';

            } else {
                return false;
            }

        }, 1000);

    },

    // What to do if the client clicks an option in the prompt window
    processAction: function (e, v, m, f) {

        if (e != undefined) {

            // Clear the timers
            loginTimer.clearTimers();

            if (e === false) {
                // They clicked 'No/Log out'
                // Destroy the session
                if (loginTimer.logged_in === 1) {
                    loginTimer.init_logout(loginTimer.c_name);
                    if (loginTimer.in_cms != 1) {
                        location.href = loginTimer.url_log_out;
                        return false;
                    }
                }
                loginTimer.destroySession();
            } else {
                // They clicked 'Yes/Stay logged in'
                // Keep session active
                loginTimer.onlineTimerCount = loginTimer.onlineTimer;
                loginTimer.extendTimeout = false;
                if (typeof prices != 'undefined') {
                    prices.get_preferences();
                } else {
                    loginTimer.keepAlive();
                }

            }

        }

    },

    // Keep the session alive
    keepAlive: function (initialise) {

        if (typeof initialise == 'undefined') {
            initialise = false;
        }
        // Determin our url
        var url = (typeof formData.tradingUrl != 'undefined') ? 'https://' + formData.tradingUrl : '';

        return true;

        url = url + '/ajaxx/user.php?hl_vt=' + keepaliveToken + '&method=session_timeout_handler&keepalive=1&format=jsonp&jsoncallback=?';
        if (initialise) {
            url = url + '&initialise=true';
        }

        $.getJSON(url);

    },

    // Destroy the session
    destroySession: function () {

        // Clear the timers
        loginTimer.clearTimers();

        if (loginTimer._timeout.logged_out != 1) {

            if (loginTimer._timeout.smc > 0) {
                loginTimer.getCookie();
            }

            // Check to see if any of the tabs/windows are on the SMC compose page
            // and need to save a draft before logging out
            loginTimer._timeout.smc = 0;
            for (var c in loginTimer._timeout) {
                if (c.substring(0, 4) == 'HLWN' && loginTimer._timeout[c].sm == 1) {
                    loginTimer._timeout.smc++;
                }
            }

            if (loginTimer._timeout.smc > 0) {
                var delayDestroy = setTimeout(function () {
                    loginTimer.destroySession();
                }, 250);
                return false;
            }

        }

        // Set the timeout milliseconds cookie variable to zero
        loginTimer._timeout.tom = 0;

        // Set the cookie
        loginTimer.setCookie();

        if (loginTimer.in_cms) {
            // Set doc title back to original
            document.title = loginTimer.doc_title;
        }

        // Determin our url
        var url = (typeof formData.tradingUrl != 'undefined') ? 'https://' + formData.tradingUrl : '';
        return true;
        url = url + '/ajaxx/?hl_vt=' + keepaliveToken + '&method=session_timeout_handler&keepalive=0&format=jsonp&jsoncallback=?';

        // Use the AJAX function to destroy the session
        $.getJSON(url);

    },

    // USED ON LOGIN PAGE
    // Functions for the login page to listen for another tab/window logging in.

    // Display the appropriate logout message if needed and initialise the login listening functions
    init_login: function (cookie) {

        if (typeof cookie != 'undefined') {
            loginTimer.c_name = cookie;
        }

        // Make sure the window is named correctly
        loginTimer.nameWindow();

        // Get the cookie
        loginTimer.getCookie();
        loginTimer.cleanupCookie();

        if (typeof loginTimer._timeout[window.name] != 'object') {
            loginTimer._timeout[window.name] = new Object();
        }

        // If we can see the login page then the timeout milliseconds should be set to zero, but make sure it is anyway
        loginTimer._timeout.tom = 0;

        loginTimer._timeout[window.name].im = 0;
        loginTimer._timeout[window.name].li = 0;
        loginTimer._timeout[window.name].lp = 1;

        // Did the session countdown get to zero and do we need to show the 15 minute message for this window/tab?
        if (loginTimer._timeout[window.name].to > 0 && loginTimer._timeout.tos == 1) {
            $('.login-msg-expired').html('<strong>Automatic log out</strong><br />You have been logged out of your account for security reasons due to a period of inactivity. Please log back in to continue. If you wish to extend the period of inactivity before being automatically logged out, please see the Passwords and security page within the Account settings section.');
            $('.login-msg').show();
        }

        // Don't show the 15 minute message for this window/tab again
        loginTimer._timeout[window.name].to = 0;

        // Set the cookie
        loginTimer.setCookie();

        // Start listening for another window/tab logging in
        loginTimer.login_listen = window.setTimeout(function () {
            loginTimer.login_listener();
        }, 250);

    },

    // function to listen for other windows/tabs logging in
    login_listener: function () {

        // Get the current login cookie
        loginTimer.getCookie();

        // Has another window/tab logged in and updated the timestamp cookie
        if (loginTimer._timeout.tom > 0) {

            // Clear the interval and reload the page
            clearInterval(loginTimer.login_listen);
            location.reload(true);

        } else {

            // Start the listener again in 1/4 of a second
            loginTimer.login_listen = window.setTimeout(function () {
                loginTimer.login_listener();
            }, 250);

        }

    },

    // USED ON LOGOUT PAGE
    // Reset all cookie info after a manual logout

    init_logout: function (cookie) {

        if (typeof cookie != 'undefined') {
            loginTimer.c_name = cookie;
        }

        // Make sure the window is named correctly
        loginTimer.nameWindow();

        loginTimer.getCookie();
        loginTimer._timeout.logged_out = 1;
        loginTimer._timeout[window.name] = new Object();
        loginTimer.setCookie();

    },

    // USED ON APPLICATION TIMEOUT PAGE
    // Application timeout window message selection

    // Work out which timeout message to display
    app_logout_message: function (cookie) {

        if (typeof cookie != 'undefined') {
            loginTimer.c_name = cookie;
        }

        // Get the cookie
        loginTimer.getCookie();

        // Has the in_app property been unset?
        // Redirect to home if so
        if (loginTimer._timeout[window.name].ia == 0) {
            $('#display_redirect').show();
            location.href = loginTimer.url_home_page;
            return;
        }

        // If they're not a client display
        // the online registration message
        if (loginTimer._timeout[window.name].li != 1
            && loginTimer._timeout[window.name].jg != 1
            && (loginTimer._timeout[window.name].rs
            || loginTimer._timeout[window.name].mp
            || loginTimer._timeout[window.name].jn)) {
            $('#not_client').show();
        }

        // Did the client get as far as making a payment?
        // Which payment method did they select?
        // Display the appropriate message accordingly
        if (loginTimer._timeout[window.name].jg == 1 && (loginTimer._timeout[window.name].rs == 1 || loginTimer._timeout[window.name].mp == 1)) { // JISA gift with payment
            $('#gift_made_payment').show();
            $('.jisa_gift').show();
            delete loginTimer._timeout[window.name].jg;
        } else if (loginTimer._timeout[window.name].jg == 1) { // JISA gift no payment
            $('#gift_no_payment').show();
            $('.jisa_gift').show();
            delete loginTimer._timeout[window.name].jg;
        } else if (loginTimer._timeout[window.name].jn == 1) { // JISA with no payment
            $('#jisa_no_payment').show();
            delete loginTimer._timeout[window.name].jn;
        } else if (loginTimer._timeout[window.name].rs == 1) { // Regular saver
            $('#setup_rs').show();
            delete loginTimer._timeout[window.name].rs;
        } else if (loginTimer._timeout[window.name].mp == 1) { // Debit card
            $('#made_payment').show();
            delete loginTimer._timeout[window.name].mp;
        } else if (loginTimer._timeout[window.name].tm == 1) { // Internal transfer
            $('#transferred_money').show();
            delete loginTimer._timeout[window.name].tm;
        } else if (loginTimer._timeout[window.name].ir == 1) { // Registration process
            $('#client_registration').show();
        } else if (loginTimer._timeout[window.name].rp == 1) {
            $("#retirement_planner").show()
        } else { // Didn't make a payment
            $('#no_payment').show();
        }

        // The wording needs to be different if it's
        // a topup as opposed to a new application
        if (loginTimer._timeout[window.name].it == 1) {
            $('.is_topup').show();
            delete loginTimer._timeout[window.name].it;
        } else if (loginTimer._timeout[window.name].ir == 1) {
            $('.is_reg').show();
        } else {
            $('.is_new').show();
        }

        if (loginTimer._timeout[window.name].li == 1) {
            $('.logged_in').show();
        } else {
            $('.new_client').show();
        }
        // Display the messages
        if (loginTimer._timeout[window.name].ia == 1) {
            $('#display_messages').show();
        }

        // Reset the _timeout object properties to default
        loginTimer._timeout[window.name].ia = 0;
        loginTimer._timeout[window.name].im = 0;
        loginTimer._timeout[window.name].li = 0;
        loginTimer._timeout[window.name].ir = 0;
        loginTimer._timeout[window.name].rp = 0;

        // Set the cookie
        loginTimer.setCookie();

    },

    // USED ON ALL CMS PAGES (EXCEPT LOGOUT)

    // Initialise the object for use in the CMS
    init_cms: function (config) {

        // Cycle through the config variables and assign them to the object over-writing the defaults above if necessary
        for (var i in config) {
            if (typeof config[i] != 'function' && typeof config[i] != 'undefined') {
                this[i] = config[i];
            }
        }

        // Make sure everything is set up correctly
        loginTimer.nameWindow();
        loginTimer.getCookie();
        loginTimer.count = loginTimer.orig_count;
        loginTimer._timeout[window.name] = new Object();
        loginTimer._timeout[window.name].to = (new Date().getTime()) + loginTimer.delay;
        loginTimer.setCookie();

        // If logged into MAAD start the timer, else just listen for a login
        if (loginTimer.logged_in == 1) {
            loginTimer.startTimer(false);
        } else {
            loginTimer.cmsListener();
        }

    },

    // Listen for MAAD sessions starting or stopping
    cmsListener: function () {

        // Get the current login cookie
        loginTimer.getCookie();

        // The client is logged in
        if (loginTimer.logged_in == 1) {

            // If the cookie timestamp is greater than this object's timestamp
            // close the prompt if open, reset title and delay.
            if (loginTimer._timeout.tom > loginTimer.timeout_ms) {

                loginTimer.closePrompt();
                document.title = loginTimer.doc_title;
                if (loginTimer.onlineTimerCount == 0) {
                    loginTimer.resetDelay();
                }

            } else if ((loginTimer._timeout.tom == 0 || loginTimer._timeout.logged_out == 1) && loginTimer.logout_delay_started == 0) {
                // Has another window logged out or timed out? If so reset everything, close the prompt and update the nav.
                // Although don't run this if in the delay period after the countdown has reached zero.

                loginTimer.logged_in = 0;
                loginTimer.clearTimers();
                document.title = loginTimer.doc_title;

                if (loginTimer._timeout.tos != 1) {
                    loginTimer.closePrompt();
                }

                // Call the nav update function (controlled by CMS guys)
                // Send false for logged out and true for logged in
                updateAccountsNavigation(false);

            }

        } else if (loginTimer.logged_in == 0) {
            // The client is not logged in

            // Has another window logged in? And we're not in a logged out state.
            if (loginTimer._timeout.tom > 0 && loginTimer._timeout.logged_out != 1) {

                // Update the object logged in state and reset the delay
                loginTimer.logged_in = 1;
                loginTimer.resetDelay();

                // Call the nav update function (controlled by CMS guys)
                // Send false for logged out and true for logged in
                updateAccountsNavigation(true);

            } else {

                // Else just make sure this window is set as logged out
                loginTimer._timeout.tom = 0;
                loginTimer._timeout[window.name].to = 0;
                loginTimer.setCookie();

            }

        }

        // Start the listener again in 1/4 of a second
        loginTimer.cms_listen = window.setTimeout(function () {
            loginTimer.cmsListener();
        }, 250);

    },

    // Function to close Impormptu modal box if open
    closePrompt: function () {

        if (loginTimer.popupStatus == 1) {
            $.ImpromptuClose();
            loginTimer.popupStatus = 0;
        }

    }

}

// Instantiate the loginTimer in the CMS
$('document').ready(function () {

    // Work out what to name the cookie based on the URI
    var full = window.location.host;
    var parts = full.split('.');
    var subparts = parts[0].split('-');
    var sub = subparts[0];
    if (sub == 'www' || sub == 'online') {
        sub = '';
    } else {
        sub = '_' + sub;
    }

    // Is it an Apple device?
    var is_apple_device = /(iPhone|iPod|iPad).*AppleWebKit/i.test(navigator.userAgent);

    // If it's not an Apple device and we're in the CMS (but not the logout page), start the timer
    if (!is_apple_device &&
        (typeof formData.cmsUrl != 'undefined' && window.location.host == formData.cmsUrl && window.location.pathname == "/") &&
        (/logout/.test(self.location.href) == false))
    {
        var loginTimerConfig = {
            in_cms: 1,
            logged_in: (formData.loggedIn === true ? 1 : 0),
            c_name: 'hltimer' + sub
        };
        loginTimer.init_cms(loginTimerConfig);
    } else if (!is_apple_device && (typeof formData.cmsUrl != 'undefined' && window.location.host == formData.cmsUrl)) {
        // If it's not an Apple device and we're in the CMS we must be on the logout page
        loginTimer.init_logout('hltimer' + sub);
    }

});

// JSONP callback function to handle session timeout request responses
function session_timeout_handler(retval) {

    if (retval[0] == 'keptalive') {
        // If the session was kept alive hide popup and reset the timer
        loginTimer.closePrompt();
        if (retval.length == 2) {
            loginTimer.onlineTimerCount = loginTimer.onlineTimer;
            loginTimer.extendTimeout = false;
        }
        loginTimer.resetTimer(true);
        // Set doc title back to original
        document.title = loginTimer.doc_title;

    } else if (loginTimer.redirecting == 0) {

        // Set the correct redirect url
        if (loginTimer._timeout.logged_out == 1) {
            redirect = loginTimer.url_log_out;
        } else if (loginTimer.goto_login && loginTimer._timeout.tos == 1) {
            // Redirect to login
            redirect = loginTimer.url_log_in;
        } else if (typeof loginTimer.url_cv_logout != 'undefined' && loginTimer.url_cv_logout != '') {
            // Corporate Vantage
            redirect = loginTimer.url_cv_logout;
        } else if (loginTimer.logged_in && loginTimer._timeout.tos == 0) {
            // Logged in user chose to log out
            redirect = loginTimer.url_log_out;
        } else if (loginTimer.in_MAAD && !loginTimer.is_topup) {
            // MAAD - timed out
            redirect = window.location.href;
        } else if (loginTimer._timeout.tos == 1) {
            // Apps - timed out
            var logged_in = '';
            if (loginTimer.logged_in) {
                logged_in = '/logged_in/true';
            }
            redirect = loginTimer.url_app_timeout + logged_in;
        } else {
            // Apps - user left
            redirect = loginTimer.url_home_page;
        }

        loginTimer.clearTimers();
        loginTimer.redirecting = 1;
        location.href = redirect;
    }

}