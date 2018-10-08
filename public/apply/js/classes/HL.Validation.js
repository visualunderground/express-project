/**
 * HL Validation class
 *
 * @package     HL
 * @category    Validation
 *
 * @require jQueryValidate plugin
 */
HL.Validation = new function () {

    var self = this;

    /**
     * UI init with init the common classes and plugins
     *
     * @return void
     */
    this.init = function () {
        this.addCustomValidations();
    }

    /**
     * Extend the jQuery validator with some custom validation
     *
     * @return void
     */
    this.addCustomValidations = function () {

        jQuery.validator.addMethod(
            'expirydate',
            function (value, element) {
                var today = new Date();
                var curMonth = today.getMonth() + 1; //January is 0!
                var expMonth, expYear, curYear;

                if (curMonth < 10) {
                    curMonth = '0' + curMonth
                }

                var valid = false;

                if (/[0-9]{2}\/[0-9]{2}/.test(value)) {
                    expMonth = value.substr(0, 2);
                    expYear = value.substr(3, 2);
                    curYear = today.getFullYear().toString().substr(2, 2);
                } else {
                    // for ipad/safari
                    expiryDate = new Date(value)
                    expYear = expiryDate.getFullYear();
                    expMonth = expiryDate.getMonth() + 1;
                    curYear = today.getFullYear();
                }

                if (expYear >= curYear) {
                    valid = true;
                } else {
                    valid = false;
                }

                if (expYear == curYear && expMonth < curMonth) {
                    valid = false;
                }

                return valid;
            },
            'Please enter a valid expiry date.'
        );

        jQuery.validator.addMethod(
            'alpha',
            function (value, element) {
                return /^[a-zA-Z]*$/.test(value);
            },
            'Please enter only letters.'
        );

        jQuery.validator.addMethod(
            'numeric',
            function (value, element) {
                return /^[0-9.,]*$/.test(value);
            },
            'Please enter a valid amount.'
        );

        jQuery.validator.addMethod(
            'alphanumeric',
            function (value, element) {
                return /^[a-zA-Z0-9]*$/.test(value);
            },
            'Please enter only letters and numbers.'
        );

        jQuery.validator.addMethod(
            'phone',
            function (value, element) {
                return /^(\+?([0-9 ])){10,20}$/.test(value);
            },
            'Please enter a valid phone number.'
        );

        jQuery.validator.addMethod(
            'postcode',
            function (value, element) {
                return /^[a-zA-Z0-9 ]{6,10}$/.test(value);
            },
            'Please enter a valid post code.'
        );

        jQuery.validator.addMethod(
            'firstname',
            function (value, element) {
                // Only letters, spaces, hyphens and apostrophes are allowed with min 1 char
                return hasOneOfSpecialChar(value);
            },
            'Please enter your first name.'
        );

        jQuery.validator.addMethod(
            'lastname',
            function (value, element) {
                // Only letters, spaces, hyphens and apostrophes are allowed with min 1 char
                return hasOneOfSpecialChar(value);
            },
            'Please enter your last name.'
        );

        jQuery.validator.addMethod(
            'higherdate',
            function (value, element) {
                var today = new Date();
                var curDay = today.getDate();
                var curMonth = today.getMonth() + 1; //January is 0!
                var curYear = today.getFullYear();

                var dobDay = value.substr(0, 2);
                var dobMonth = value.substr(3, 2);
                var dobYear = value.substr(6, 4);

                if (curDay < 10) {
                    curDay = '0' + curDay
                }

                if (curMonth < 10) {
                    curMonth = '0' + curMonth
                }

                var valid = false;

                if (dobYear > curYear) {
                    valid = false;
                } else {
                    valid = true;
                }

                if (dobYear == curYear && dobMonth > curMonth) {
                    valid = false;
                }

                if (dobYear == curYear && dobMonth == curMonth && dobDay > curDay) {
                    valid = false;
                }

                return valid;
            },
            'Please enter a valid date of birth.'
        );

        jQuery.validator.addMethod(
            'fullname',
            function (value, element) {
                // Only letters, spaces, hyphens and apostrophes are allowed
                return /^[a-zA-Z0-9\.\'-]{1,}[\s]{1,}[a-zA-Z0-9\.\'\- ]{1,}$/.test(value);
            },
            'Please enter your name.'
        );

        jQuery.validator.addMethod(
            'accountname',
            function (value, element) {

                if (value === '') {
                    return true;
                }

                // Only letters, spaces, hyphens and apostrophes are allowed
                return /^[a-zA-Z0-9\.\'-]{1,}[\s]{1,}[a-zA-Z0-9\.\'\- ]{1,}$/.test(value);
            },
            'Please enter a valid account holder.'
        );

        jQuery.validator.addMethod(
            "validemail",
            function (value, element) {

                if (value == '') {
                    return true;
                }

                var ind = value.indexOf('@');
                var str2 = value.substr(ind + 1);
                var str3 = str2.substr(0, str2.indexOf('.'));

                if (str3.lastIndexOf('-') == (str3.length - 1) || (str3.indexOf('-') != str3.lastIndexOf('-'))) {
                    return false;
                }

                var str1 = value.substr(0, ind);

                if ((str1.lastIndexOf('.') == (str1.length - 1)) || (str1.lastIndexOf('-') == (str1.length - 1))) {
                    return false;
                }

                var str = /(\w+)\@(\w+)\.[a-zA-Z]/g;
                temp1 = str.test(value);

                return temp1;

            }, "Please enter valid email."
        );

        jQuery.validator.addMethod(
            'noduplicatesuffix',
            function (value, element) {

                var prefices = [".com", ".co.uk", ".org"];
                var duplicate = false;

                // Check if any of the prefices occurs more than once
                for (var i = 0; i < prefices.length; i++) {

                    var count = (value.match(new RegExp("\\" + prefices[i], "g")) || []).length;
                    if (count > 1) {
                        duplicate = true;
                    }

                }

                return !duplicate;

            },
            'Please enter a valid email'
        );

        jQuery.validator.addMethod(
            'datecustom',
            function (value, element, options) {

                var result = false;

                if (typeof(options) == 'object' && typeof(options.supported_formats)) {

                    options.supported_formats.forEach(function (format) {

                        // Alrady validated positively
                        if (result === true) {
                            return true;
                        }

                        var regex = '';
                        var shortYear = false;

                        var dateSep = null;

                        var dateKeys = {
                            'year': null,
                            'month': null,
                            'day': null
                        };

                        switch (format) {

                            case 'YYYY-MM-DD':
                                regex = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;

                                dateSep = '-';

                                dateKeys.year = 0;
                                dateKeys.month = 1;
                                dateKeys.day = 2;

                                break;

                            case 'DD/MM/YYYY':
                                regex = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/;

                                dateSep = '/';

                                dateKeys.year = 2;
                                dateKeys.month = 1;
                                dateKeys.day = 0;

                                break;

                            case 'MM/YYYY':
                                regex = /^([0-9]{2})\/([0-9]{4})$/;

                                dateSep = '/';

                                dateKeys.year = 1;
                                dateKeys.month = 0;
                                dateKeys.day = null;

                                break;

                            case 'MM/YY':
                                regex = /^([0-9]{2})\/([0-9]{2})$/;

                                dateSep = '/';

                                dateKeys.year = 1;
                                dateKeys.month = 0;
                                dateKeys.day = null;

                                shortYear = true;

                                break;

                            case 'YYYY-MM':
                                regex = /^([0-9]{4})-([0-9]{2})$/;

                                dateSep = '-';

                                dateKeys.year = 0;
                                dateKeys.month = 1;
                                dateKeys.day = null;

                                break;

                            default: // Not supported format
                                return false;
                                break;

                        }

                        // Soft checking
                        if (!regex.test(value)) {
                            return false;
                        }

                        // Real date checking
                        var dateParts = value.split(dateSep);
                        var date = new Date(
                            (shortYear == true ? '20' : '') +
                            dateParts[dateKeys.year] + '-' +
                            dateParts[dateKeys.month] + '-' +
                            (dateKeys.day == null ? '01' : dateParts[dateKeys.day])
                        );

                        if (Object.prototype.toString.call(date) === '[object Date]'
                            && !isNaN(date.getTime())
                        ) {
                            result = true;
                        }

                    });

                }

                return result;
            },
            'Please enter a date.'
        );

        jQuery.validator.addMethod(
            'nino',
            function (value, element) {

                var valid = false;

                if (typeof(value) == 'string') {

                    // Uppercase without spaces
                    value = value.toUpperCase().replace(/ /g, '');

                    // First format check
                    if (/^[A-CEGHJ-NOPR-TW-Z][A-CEGHJ-NPR-TW-Z][0-9]{6}[ABCD]$/.test(value)) {

                        var badPrefixes = ['GB', 'BG', 'NK', 'KN', 'TN', 'NT', 'ZZ'];

                        var prefix = value.substring(0, 2);

                        if ($.inArray(prefix, badPrefixes) == -1) {
                            valid = true;
                        }

                    }

                }

                return valid;

            },
            'Please enter a valid national insurance number.'
        );

        jQuery.validator.addMethod(
            'creditcardtype',
            function (value, element, params) {

                var valid = false;

                // Supported types as default
                var supportedTypes = ['visa', 'maestro', 'mastercard'];

                if (typeof(params) == 'object' && typeof(params.supported_types) == 'object') {
                    supportedTypes = params.supported_types;
                }

                $('#' + element.id).validateCreditCard(function (result) {

                    if (result.card_type !== null) {

                        // Card is recognised and supported
                        if ($.inArray(result.card_type.name, supportedTypes) > -1) {
                            valid = true;
                        }

                    }

                });

                return valid;
            },
            'This card type is not recognised, please check your card number'
        );

        // Kept the existing validation with name changed from password to validPassword
        jQuery.validator.addMethod(
            'validPassword',
            function (value, element) {

                var valid = false;

                if (typeof(value) == 'string') {

                    // This must be between 8 and 20 characters long and contain at least 2 numbers and 2 letters
                    if (/^(?=.*?\d.*\d)[a-zA-Z0-9]{8,20}$/.test(value)) {

                        valid = true;

                    }

                }

                return valid;

            },
            'Please enter your password.'
        );

        jQuery.validator.addMethod(
            'username',
            function (value, element) {
                var valid = false;
                if (typeof(value) == 'string') {

                    if (/^(?=.*?\d.*\d)[a-zA-Z0-9]{8,20}$/.test(value)) {
                        valid = true;
                    }
                }

                return valid;
            },
            'Please enter your username.'
        );

        jQuery.validator.addMethod(
            'sortcode',
            function (value, element) {

                if (value === '') {
                    return true;
                }

                var valid = false;

                if (typeof(value) == 'string') {

                    if (/^[0-9]{2,2} - [0-9]{2,2} - [0-9]{2,2}$/.test(value)) {

                        valid = true;

                    }

                }

                return valid;

            },
            'Please enter a valid sort code.'
        );

        jQuery.validator.addMethod(
            'twoletters',
            function (value, element) {
                if (hasMinLetters(value, 2)) {
                    return true;
                } else {
                    return false;
                }
            },
            'Please enter a valid username'
        );

        jQuery.validator.addMethod(
            "notEqual",
            function (value, element, param) {
                otherVal = $(param).val();
                if (value == otherVal) {
                    return false;
                } else {
                    return true;
                }
            },
            "Master password and trading password are the same"
        );

        jQuery.validator.addMethod(
            "isadult",
            function (value, element) {

                var today = new Date();
                var dobSplit = '';

                if (/[0-9]{2}\/[0-9]{2}\/[0-9]{4}/.test(value)) {
                    dobSplit = value.split('/');
                    value = new Date(dobSplit[2], (dobSplit[1] - 1), dobSplit[0]);
                } else {
                    value = new Date(value);
                }

                var curYear = today.getFullYear();
                var dobYear = value.getFullYear();
                var ageLimit = curYear - 18;

                return dobYear <= ageLimit;

            },
            "You must be over 18 to apply"
        );

        jQuery.validator.addMethod(
            "equalsinitials",
            function (value, element, param) {
                return self.checkNameMatches(value, param);
            },
            "Please enter your {label}card name{/label} as it appears on your debit card. Please ensure there are spaces between any initials"
        );

        /**
         * Ensure that the name of the bank account matches the application name
         */
        jQuery.validator.addMethod(
            'bankaccountname',
            function (value, element, param) {
                return this.optional(element) || self.checkNameMatches(value, param);
            },
            'The {label}bank account{/label} you specify must be held in your name.'
        );

        jQuery.validator.addMethod(
            "min",
            function( value, element, param ) {
                if (value == 0) {
                    // lump sum/monthly can be 0 even if there's a minimum, as long as either lump sum OR monthly has
                    // been specified e.g. a chosen fund can have 0 lump sum as long as it has 25 monthly
                    // the 'investmentChoiceAmount' rule will check one or the other has been specified

                    var name  = $(element).attr('name');
                    var rules = $("input[name='" + name + "']").rules();

                    if (rules.hasOwnProperty('investmentChoiceAmount') && rules.investmentChoiceAmount === true) {
                        return true;
                    }
                }

                var value_string = value.replace(/,/g, '');
                var value = parseFloat(value_string);

                return this.optional( element ) || value >= param;
            },
            function(param, element) {
                if(element.id == 'form-investment-input-total'){
                    return "Active Savings Account must have a minimum value of {label}&pound;" + HL.InputHelper.numberFormat(param) + '{/label}';
                }
                return "Please enter a value greater than or equal to {label}&pound;" + HL.InputHelper.numberFormat(param) + '{/label}';
            }
        );

        /**
         * Minimum amount validation for ISA transfers.
         */
        jQuery.validator.addMethod(
            'isaTransferMin',
            function(value, element, params) {
                value = parseFloat(value);

                var currentYearSubs  = params.currentYearSubs;
                var previousYearSubs = params.previousYearSubs;

                // lifetime ISA is a pain, have to check whether there's PY subs too

                if (product == 25) {
                    if (value > previousYearSubs && value < currentYearSubs) {
                        return false;
                    }
                } else {
                    if (value < currentYearSubs) {
                        return false;
                    }
                }

                return true;
            },
            function(param, element) {
                return "Your current year's subscription must be transferred in full";
            }
        );

        jQuery.validator.addMethod(
            "max",
            function( value, element, param ) {

                var value_string = value.replace(/,/g, '');
                var value = parseFloat(value_string);

                return this.optional( element ) || value <= param;
            },
            function(param, element) {
                return "Please enter a value less than or equal to {label}&pound;" + HL.InputHelper.numberFormat(param) + '{/label}';
            }
        );

        /**
         * Validates against the user putting 0 for both lump sum and monthly.
         */
        jQuery.validator.addMethod(
            'investmentChoiceAmount',
            function( value, element, param ) {

                value = value.replace(/,/g, '');

                var elementId       = $(element).attr('id');
                var elementIdSplit  = elementId.split('_');
                var sedol           = elementIdSplit[3];

                if (value == 0 || value == '') {
                    if (elementId.indexOf('investment_choice_ls_') !== -1) {

                        // if the sedol is a matrix ID, allow a value of zero
                        if (sedol.length == 3) {
                            return true;
                        }
                        if ($('#investment_choice_rs_' + sedol).length == 0
                            || parseInt($('#investment_choice_rs_' + sedol).val()) === 0 || $('#investment_choice_rs_' + sedol).val() == '') {
                            return false;
                        }
                    } else {
                        if ($('#investment_choice_ls_' + sedol).length == 0
                            || parseInt($('#investment_choice_ls_' + sedol).val()) === 0 || $('#investment_choice_ls_' + sedol).val() == '') {
                            return false;
                        }
                    }
                }

                return true;
            },
            function(param, element) {
                if (formData.vmpApplication == true) {
                    return 'Please enter a {label}lump sum{/label}';
                } else {
                    return 'Please enter either a {label}lump sum or monthly amount{/label} or remove from your investments';
                }
            }
        );

        /**
         * Validates that the direct debit amount is sufficient to last for
         * 3 months on regular savings.
         */
        jQuery.validator.addMethod('regularSaverMax', function(value, element) {

                value = parseFloat(value.replace(',', ''));

                var max = ApplicationForm.maxAmount;

                // override the max with the ISA limit, if applicable

                if (productDetails.product_type == 'isa') {
                    max = CardPayment.calculateRemainingIsaAllowance();
                }

                var investmentOption = $("input[name='form[investment_option]']:checked").val();

                // adjust the maximum if a lump sum amount has been input

                if (investmentOption === '3') {

                    var lumpSumMethod = $("input[name='form[lump_sum_method]']:checked").val();

                    var paymentAmount = '';

                    if (lumpSumMethod !== '0') {
                        if (isaDetails !== undefined && isaDetails !== null && isaDetails.hasOwnProperty('products')
                            && isaDetails.products.hasOwnProperty(lumpSumMethod)) {
                            if (!$("input[name='form[isa_transfer_amount_simple]']").hasClass('ignore')) {
                                paymentAmount = $("input[name='form[isa_transfer_amount_simple]']").val();
                            } else {
                                paymentAmount = $("input[name='form[isa_transfer_amount_complex]']").val();
                            }
                        } else {
                            paymentAmount = $("input[name='form[amount]']").val();
                        }
                    } else {
                        paymentAmount = $("input[name='form[amount]']").val();
                    }

                    if (paymentAmount != '') {
                        paymentAmount = parseFloat(paymentAmount.replace(',', ''));
                        max = max - paymentAmount;
                    }
                }

                var monthlyMax = max / regularSaverMonths;

                if (value > monthlyMax) {
                    return false;
                }

                return true;
            },
            function(param, element) {
                var periodStr = 'month';

                if (regularSaverMonths > 1) {
                    periodStr += 's';
                }

                return 'The {label}regular payments{/label} must be able to run for a minimum of ' +
                    regularSaverMonths + ' ' + periodStr;
            });


        /**
         * Validates that the direct debit will come out before the client turns 40
         */
        jQuery.validator.addMethod('regularSaverAgeCheck', function() {

            var dob = $("input[name='form[date_of_birth]']").val();

            var radioSelector =  $('#form_investment_option_1').parent().parent();
            var textSelector =  $('#regular-saver-age-check');

            if (typeof(ipad) == 'object') {
                radioSelector =  $('#form_investment_option_1').parent();
            }

            var rsDate = formData.regularSaverDate.split('/');
            var regDate = new Date(rsDate[2], rsDate[1], rsDate[0]);

            regDate.setMonth(regDate.getMonth()+ 2);
            var regSavingsMonth = regDate.getMonth();

            var month = $.trim(regSavingsMonth).length === 1 ? '0' + regSavingsMonth : regSavingsMonth;

            var newRsDate = rsDate[0] +'/'+ month +'/'+ rsDate[2];

            // if they're just doing RS, check they're not 40 before the first 3 payments are taken
            // this is a safety precaution incase the first payment fails
            var age = checkAgeOnDate(dob, newRsDate);

            if (age >= 40 && dob !== '') {

                radioSelector.addClass('hide');
                textSelector.removeClass('hide');
                $("input[name='form[investment_option]']").prop('checked', false);

            } else {

                radioSelector.removeClass('hide');
                textSelector.addClass('hide');
            }

            return true;

        });

        var productName   = productDetails.names.short;

        if (product == 70) {

            /**
             * SIPP retirement age validation.
             */
            jQuery.validator.addMethod('retirementAgeCheck', function(value, element) {

                var dob = $("input[name='form[date_of_birth]']").val();

                if (dob != '') {
                    return HL.Validation.isClientBetweenTwoAges(dob, 18, 75);
                }

                return true;

            }, 'You can only open a ' + productName + ' online if you are {label}aged between 18 and 74{/label}');

            /**
             * SIPP retirement age validation.
             */
            jQuery.validator.addMethod('alreadyRetiredCheck', function(value, element) {

                var dob = $("input[name='form[date_of_birth]']").val();
                var age = $("select[name='form[retirement_age]']").find(":selected").text();

                if (dob != '' && age != 'Please select...') {
                    return !(HL.Validation.isClientOverAge(dob, age))
                }

                return true;

            }, 'Please choose the age you {label}expect to retire{/label}. It must be older than your current age');
        }

        /**
         * LISA age validation.
         */
        if (product == 25) {

            var maxAccOpenAge = productDetails.maximum_account_open_age;
            var maxSubAge     = productDetails.maximum_subscription_age;

            jQuery.validator.addMethod('lisaAgeCheck', function(value, element) {

                if (HL.Validation.isClientOverAge(value, maxAccOpenAge)) {

                    // is the client between the max. account opening age and max.
                    // subscription age? if so, display an element allowing them to
                    // select whether they have a LISA already

                    if (HL.Validation.isClientBetweenTwoAges(value, maxAccOpenAge, maxSubAge)) {
                        $('#lisa_age_declaration_wrapper').show();
                        $("input[name='form[lisa_age_declaration_confirm]']").removeClass('ignore');

                        // you've passed the test... for now
                        return true;
                    } else {

                        // client is over the subscription age so cannot proceed

                        $('#lisa_age_declaration_wrapper').hide();
                        $("label[for='form[lisa_age_declaration_confirm]']").remove();
                        $("input[name='form[lisa_age_declaration_confirm]']").prop('checked', false).addClass('ignore');

                        return false;
                    }
                } else {

                    // client is under the max. age

                    $('#lisa_age_declaration_wrapper').hide();
                    $("label[for='form[lisa_age_declaration_confirm]']").remove();
                    $("input[name='form[lisa_age_declaration_confirm]']").prop('checked', false).addClass('ignore');

                    return true;
                }

            }, 'You cannot add money to a ' + productName + ' if you are ' + maxSubAge + ' or over');

            /**
             * LISA age declaration validation.
             */
            jQuery.validator.addMethod('lisaAgeDeclarationCheck', function(value, element) {

                if (value == 'no') {
                    return false;
                }

                return true;

            }, 'You must be under ' + maxAccOpenAge + ' to open a ' + productName);
        }

        jQuery.validator.addMethod(
            'validOnlinePassword',
            function (value, element) {

                var valid = false;
                if (typeof(value) == 'string') {

                    // This must be between 8 and 50 characters long and contain at least 1 numbers, 1 upper and 1 lower letter
                    if (value.length >= 8 && value.length <= 50 && hasMinNumbers(value, 1) && hasMixedCaseLetters(value)) {
                        valid = true;
                    }
                }

                return valid;
            },
            'Please enter your password.'
        );

        jQuery.validator.addMethod(
            'securenumber',
            function (value, element) {
                var valid = false;
                if (typeof(value) == 'string') {
                     if (value.length == 6 && hasOnlyNumbers(value)) {
                        valid = true;
                    }
                }

                return valid;
            },
            'Please enter valid secure number 6 digit.'
        );

    };

    /**
     * Return the national insurance number validation rules
     *
     * @param extra_rules object
     *
     * @return object
     */
    this.nino = function (extra_rules) {
        var basic_rules = {
            nino: true
        };

        return this.mergeRules(basic_rules, extra_rules);
    };

    /**
     * Merge object rules in to one object array
     *
     * @param basicRules object
     * @param extraRules object -This will override the items from the basic_rules on matching
     *
     * @return object
     */
    this.mergeRules = function (basicRules, extraRules) {
        var rules = {};

        if (typeof(basicRules) === 'object' && typeof(extraRules) === 'object') {

            // The standard one
            rules = basicRules;

            for (var key in extraRules) {
                rules[key] = extraRules[key];
            }

        } else if (typeof(basicRules) === 'object') {
            rules = basicRules;
        } else if (typeof(extraRules) === 'object') {
            rules = extraRules;
        }

        return rules;
    };

    /**
     * Validate the input field by the id
     *
     * @param string id
     *
     * @return boolean
     */
    this.realTimeValidation = function (id) {

        var valid = true;

        var validationContainer = $('#' + id + '-validation');

        var input = $('#' + id);

        if (validationContainer.length < 1 || input.length < 1) {
            return false;
        }

        var inputValue = input.val();

        switch (validationContainer.attr('data-validation-ruleset')) {

            case 'username':

                // 8-20 characters
                var addClass = 'valid-icon';
                var removeClass = 'invalid-icon';

                if (inputValue.length < 8 || inputValue.length > 20) {

                    removeClass = 'valid-icon';
                    addClass = 'invalid-icon';
                    valid = false;
                }
                validationContainer.find('.length .icon').removeClass(removeClass).addClass(addClass);

                // 2 numbers
                addClass = 'valid-icon';
                removeClass = 'invalid-icon';

                if (!hasMinNumbers(inputValue, 2)) {

                    removeClass = 'valid-icon';
                    addClass = 'invalid-icon';
                    valid = false;
                }
                validationContainer.find('.numbers .icon').removeClass(removeClass).addClass(addClass);

                // 2 letters
                addClass = 'valid-icon';
                removeClass = 'invalid-icon';

                if (!hasMinLetters(inputValue, 2)) {

                    removeClass = 'valid-icon';
                    addClass = 'invalid-icon';
                    valid = false;
                }
                validationContainer.find('.letters .icon').removeClass(removeClass).addClass(addClass);                

                break;

            case 'password':

                // 8-50 characters
                var addClass = 'valid-icon';
                var removeClass = 'invalid-icon';

                if (inputValue.length < 8 || inputValue.length > 50) {

                    removeClass = 'valid-icon';
                    addClass = 'invalid-icon';
                    valid = false;
                }
                validationContainer.find('.length .icon').removeClass(removeClass).addClass(addClass);

                // 1 number
                addClass = 'valid-icon';
                removeClass = 'invalid-icon';

                if (!hasMinNumbers(inputValue, 1)) {

                    removeClass = 'valid-icon';
                    addClass = 'invalid-icon';
                    valid = false;
                }
                validationContainer.find('.numbers .icon').removeClass(removeClass).addClass(addClass);

                // 1 lower/upper letter
                addClass = 'valid-icon';
                removeClass = 'invalid-icon';

                if (!hasMixedCaseLetters(inputValue)) {

                    removeClass = 'valid-icon';
                    addClass = 'invalid-icon';
                    valid = false;
                }
                validationContainer.find('.letters .icon').removeClass(removeClass).addClass(addClass);                

                break;

            case 'securenumber':

                var addClass = 'valid-icon';
                var removeClass = 'invalid-icon';

                // 6 characters
                if (inputValue.length != 6) {

                    removeClass = 'valid-icon';
                    addClass = 'invalid-icon';
                    valid = false;
                }

                // Only numbers
                if (!hasOnlyNumbers(inputValue)) {

                    removeClass = 'valid-icon';
                    addClass = 'invalid-icon';
                    valid = false;
                }
                validationContainer.find('.numbers .icon').removeClass(removeClass).addClass(addClass);

                break;
        }

        return valid;
    };

    /**
     * Check if client is over 40 years of age.
     *
     * @param dob {string}
     * @param maxAge {int}
     * @returns {boolean}
     */
    this.isClientOverAge = function(dob, maxAge)
    {
        var age = checkAgeOnDate(dob, null);

        return age >= maxAge;
    };

    /**
     * Check if client is between two ages.
     *
     * @param dob {string}
     * @param rangeStart {int}
     * @param rangeEnd {int}
     * @returns {boolean}
     */
    this.isClientBetweenTwoAges = function(dob, rangeStart, rangeEnd)
    {
        var age = checkAgeOnDate(dob, null);

        // is client between the range i.e. are they within the age bracket 18 - 75 for example
        return age >= rangeStart && age < rangeEnd;
    };

    /**
     * Check that the given name matches what's on the application.
     *
     * @param value {string}
     * @param param {object}
     * @returns {boolean}
     */
    this.checkNameMatches = function(value, param) {

        value = value.toLowerCase();
        var titles = formData.formVars.title;

        $.each(titles, function(index, name) {
            value = value.replace(name.toLowerCase() + ' ', '');
        });

        var nameParts = value.split(' ');

        if (nameParts.length < 2) {
            // We expect at least an initial and a surname
            return false;
        }

        var firstName = nameParts.shift();
        var lastNames = nameParts.join(' ');

        var clientFirstName = $(param[0]).val().toLowerCase();
        var clientSurname = $(param[1]).val().toLowerCase();

        clientSurname = clientSurname.split(' ').splice(-1);

        // check the initial of the firstname from bf is at the very start of the card name
        var initial = firstName.substr(0, 1).toLowerCase() == clientFirstName.substr(0, 1).toLowerCase();

        // check the surname from bf is preceded and superceeded by a whitespace
        // - or -
        // is at the very end of the card name

        var surname = lastNames.indexOf(clientSurname) != -1 || lastNames.substr(- clientSurname.length) == clientSurname;

        return (surname && initial);
    };

    // Auto init
    this.init();
};

/**
 * Check if a value has more than one occurrence of letters
 *
 * @param val string
 *
 * @return bool
 */
function hasTwoLetters(val) {
    return val.replace(/[^a-z]/gi, '').length >= 2;
}

/**
 * Check if a value has more than one occurrence of letters
 *
 * @param val           string
 * @param minNumber     number
 *
 * @return bool
 */
function hasMinLetters(val, minNumber) {
    return val.replace(/[^a-z]/gi, '').length >= minNumber;
}

/**
 * Check if a value has more than one occurrence of numbers
 *
 * @param val           string
 * @param minNumber     number
 *
 * @return bool
 */
function hasMinNumbers(val, minNumber) {
    return val.replace(/[^0-9]/gi, '').length >= minNumber;
}

/**
 * Check for presence of lower and upper case letters
 *
 * @param val string
 *
 * @return bool
 */
function hasMixedCaseLetters(val)
{
    return /[a-z]{1,}/.test(val) && /[A-Z]{1,}/.test(val);
}

/**
 * Check if a value has more than one occurrence of numbers
 *
 * @param val string
 *
 * @return bool
 */
function hasTwoNumbers(val) {
    return /(?=.*?\d.*\d)[0-9]{0,}/.test(val);
}

/**
 * Check for number only
 *
 * @param val string
 *
 * @return bool
 */
function hasOnlyNumbers(val)
{
    return /^[0-9]+$/.test(val);
}

/**
 * Check if a value has more than one occurrence of unwanted characters
 *
 * @param value
 */
function hasOneOfSpecialChar(value){
    var valid = /^[a-zA-Z0-9\.\'\- ]{1,}$/i.test(value);
    var char = [".", "'", "-"];

    // Check if any of the prefices occurs more than once
    if(valid){
        for (var i = 0; i < char.length; i++) {

            var regex = new RegExp("[^" + char[i] + "]", "g");

            if(value.replace(regex, "").length > 1){
                valid = false;
            }
        }
    }

    return valid;
}

/**
 * Give users age on a given date
 *
 * @param dob
 * @param dateToCheck
 */
function checkAgeOnDate(dob, dateToCheck) {

    var date = new Date();

    if (dateToCheck != null) {
        var dateSplit = dateToCheck.split('/');
        date = new Date(dateSplit[2], (dateSplit[1] - 1), dateSplit[0]);
    }

    var birthDate = new Date(dob);

    if (/[0-9]{2}\/[0-9]{2}\/[0-9]{4}/.test(dob)) {
        var dobSplit = dob.split('/');
        birthDate = new Date(dobSplit[2], (dobSplit[1] - 1), dobSplit[0]);
    } else {
        birthDate = new Date(dob);
    }

    var age = date.getFullYear() - birthDate.getFullYear();
    var m = date.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && date.getDate() < birthDate.getDate())){
        age--;
    }

    return age;
}