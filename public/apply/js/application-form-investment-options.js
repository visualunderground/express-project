/**
 * Investment Options step specific handlers/functions
 */

var formID = 'application-form';

var searchTimeout = null;
var investmentAmountTimer = null;

var validatorRules = {};
var validatorMessages = {};

ApplicationForm.InvestmentOptions = new function() {
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function(searchString, position){
            position = position || 0;
            return this.substr(position, searchString.length) === searchString;
        };
    }

    /**
     * Parent class shortcut
     *
     * @var function
     */
    this.parent = ApplicationForm;

    /**
     * Set to true when all pages of fund search results are loaded in, to prevent
     * loading in any more.
     *
     * @type {boolean}
     */
    this.fundSearchResultsEnd = false;

    var self = this;

    this.addValidatorRules = function() {

        var rules = {
            'form[investment_cash_ls]': {
                min: 0,
                max: lumpAmount
            },
            'form[investment_cash_rs]': {
                min: 0,
                max: monthlyAmount
            }
        };

        var messages = {
            'form[investment_cash_ls]': '{label}Total of investments{/label} must not exceed available balance',
            'form[investment_cash_rs]': '{label}Total of investments{/label} must not exceed available balance'
        };

        validatorRules = $.extend({}, validatorRules, rules);
        validatorMessages = $.extend({}, validatorMessages, messages);
    }();

    /**
     * Init the application form page
     */
    this.init = function () {
        $(function () {
            self.initForm();

            /**
             * Close the fund search results when anything else is clicked.
             */
            $('*').click(function() {
                $('#name-search-results, #share-search-results').hide();
            });

            $('#add-share-button').click(function() {
                $('#share-search-modal').foundation('open');
            });

            $('#add-fund-button').click(function() {
                $('#fund-search-modal').foundation('open');
            });

            $('#fund-search-modal, #share-search-modal').on('open.zf.reveal', function () {
                $('body').addClass('body-fixed');
            });

            $('#fund-search-modal, #share-search-modal').on('closed.zf.reveal', function () {
                $('body').removeClass('body-fixed');
            });

            /**
             * User selects whether to add investments now or later.
             */
            $("input[name='form[investments_now_choice]']").change(function() {
                var value = parseInt($("input[name='form[investments_now_choice]']:checked").val());

                if ($('#application-submit-button').is(':disabled')) {
                    $('#application-submit-button')
                        .prop('disabled', false)
                        .removeClass('disabled')
                        .addClass('submit')
                        .attr('type', 'submit');
                }

                if (value === 1) {
                    $('#investments-choice-wrapper').fadeIn();
                    $('#investments-choice-wrapper').before(
                        '<div class="box-footer"><div class="outer"></div><div class="inner"></div></div>'
                    );
                } else {
                    $('#investments-choice-wrapper').fadeOut();
                    $('#investment-option-choice-box .box-footer').remove();
                }
            });

            /**
             * User selects a fund search result, close the modal
             */
            $('#fund-search-results').on(
                'click',
                'li',
                function () {

                    var sedol = $(this).attr('data-sedol');

                    InvestmentChoice.select(sedol, $(this), 'fund');

                    $('#fund-search-modal').foundation('close');
                    $('body').removeClass('fixed');
                }
            );

            /**
             * User selects a fund search result, close the modal
             */
            $('#name-search-results').on(
                'click',
                'ul li',
                function () {

                    var sedol = $(this).attr('data-sedol');

                    InvestmentChoice.select(sedol, $(this), 'fund');

                    $('#fund-search-modal').foundation('close');
                    $('body').removeClass('fixed');
                }
            );

            /**
             * User selects a share search result, close the modal
             */
            $('#share-search-results').on(
                'click',
                'ul li',
                function() {

                    var sedol = $(this).attr('data-sedol');

                    InvestmentChoice.select(sedol, $(this), 'share');

                    $('#share-search-modal').foundation('close');
                    $('body').removeClass('fixed');
                }
            );

            /**
             * User selects a fund search result, close the modal
             */
            $('.recently-viewed-fund-title, .recently-viewed-share-title').click(function() {

                var sedol = $(this).parent().attr('data-sedol');

                var type = 'share';

                if ($(this).hasClass('recently-viewed-fund-title')) {
                    type = 'fund';
                }

                InvestmentChoice.select(sedol, $(this), type);

                $('#fund-search-modal, #share-search-modal').foundation('close');
                $('body').removeClass('fixed');
            });

            /**
             * User is typing a search term in the input, perform stock search
             */
            $('#fund-search-name').on('keyup', function() {
                $('#name-search-results').hide();
                self.fundSearch($(this));
            });

            /**
             * User is typing a search term in the input, perform stock search
             */
            $('#share-search-name').on('keyup', function() {
                $('#share-search-results').hide();
                self.shareSearch($(this));
            });

            /**
             * Select all of the input text when user clicks back onto the search input
             */
            $('#fund-search-name, #share-search-name').on('click', function () {
                $(this).select();
            });

            /**
             * Update the cash amounts when user enters a lump sum/monthly
             * amount for one of the investments they've added.
             */
            $('#section-investment-choice').on(
                'keyup',
                '.investment-row-ls, .investment-row-rs',
                function() {

                    if (investmentAmountTimer) {
                        clearTimeout(investmentAmountTimer);
                    }

                    investmentAmountTimer = setTimeout(function() {
                        investmentAmountTimer = null;
                        self.calculateCashAmounts();
                    }, 100);
                }
            );

            /**
             * Re-validate investment options
             */
            $('#section-investment-choice').on(
                'focusout',
                '.investment-row-ls, .investment-row-rs',
                function() {
                    var parentRow = $(this).parent().parent().parent();
                    $('.investment-row-ls, .investment-row-rs', parentRow).valid();
            });


            /**
             * Load the next page of fund search results in when scrolled to the bottom.
             */
            $('div:eq(0)', '#fund-search-results-wrapper').scroll(function() {

                if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {

                    // get the next page of results
                    self.searchFundsByCompanyAndSector(true, false);
                }
            });

            /**
             * Update validation rules for redisplayed investment choices. In theory, this shouldn't be needed unless
             * frontend validation fails and errors are returned from the backend.
             */
            $('.investment-row-ls, .investment-row-rs').each(function() {

                $('#application-form').validate();

                if ($(this).hasClass('investment-row-rs')) {

                    $(this).rules('add', {
                        min: monthlyMin,
                        numeric: true,
                        investmentChoiceAmount: true
                    });

                } else if ($(this).hasClass('investment-row-ls')) {

                    var lumpMin = 0;

                    if ($(this).attr('data-type') == 'fund') {
                        lumpMin = fundInvestmentMin;
                    }

                    $(this).rules('add', {
                        min: lumpMin,
                        numeric: true,
                        investmentChoiceAmount: true
                    });
                }
            });
        });
    };

    /**
     * Init the form and input handlers
     */
    this.initForm = function () {

        $('#' + formID).on('submit', function() {

            // strip commas from amount input fields
            $('input[data-role=amount]').each(function() {
                var value = $(this).val().replace(/,/g, '');
                $(this).val(value);
            });

        }).validate({
            ignore              : '.ignore',
            focusInvalid        : false,
            rules               : validatorRules,
            messages            : validatorMessages,
            showErrors          : function(errorMap, errorList) {

                ApplicationForm.formHandler.removeSpaceholders(errorList);
                this.defaultShowErrors();

            },
            errorPlacement : function (error, element) {

                var name = element.attr('name');
                var id = element.attr('id');

                if (name.startsWith('form[investment_choice')) {

                    // insert the error in tr after the funds/shares input row
                    if (typeof(ipad) == "undefined") {
                        error.insertAfter('#form-' + id + '-error-spaceholder');
                    } else {

                        var errorContainer = "<tr id='error-container-"+ id +"' class='error'><td colspan='3'><div></div></td><td></td></tr>";
                        var parenttr = $(errorContainer).insertAfter($('#'+id).closest('tr'));

                        error.insertAfter('#error-container-'+ id +' td:first-child div');
                    }
                }

                switch (name) {
                    case 'form[investment_cash_ls]':
                        error.insertAfter('#form-investment_cash_ls-error-spaceholder');
                        break;
                    case 'form[investment_cash_rs]':
                        error.insertAfter('#form-investment_cash_rs-error-spaceholder');
                        break;

                    case 'form[income_option]':
                        error.insertAfter('#form-income-option-error-spaceholder');
                        break;

                    case 'form[tax_relief_option]':
                        error.insertAfter('#form-tax-relief-error-spaceholder');
                        break;

                    case 'form[direct_debit]':
                        error.insertAfter('#form-direct-debit-error-spaceholder');
                        break;

                    case 'form[lump_sum]':
                        error.insertAfter('#form-lump-sum-error-spaceholder');
                        break;
                }
            },
            success : function(label) {

                if (typeof(ipad) == "undefined") {
                    ApplicationForm.formHandler.removeFormTopError(formID, label.attr('for'));
                } else {
                    // remove error tr on success
                    label.closest('tr.error').remove();
                }
            },
            invalidHandler : function(event, validator) {

                if (typeof(ipad) == "undefined") {
                    ApplicationForm.formHandler.raiseFormTopErrors(formID, validator);
                }
            },
            highlight: function(element) {

                if (typeof(ipad) != "undefined")
                    CustomValidation.setErrorClass(element);
            },
            unhighlight: function(element) {

                if (typeof(ipad) != "undefined")
                    CustomValidation.removeErrorClass(element);
            }
        });

    };

    this.init();

    /**
     * Perform search for shares.
     *
     * @param element {object}
     */
    this.shareSearch = function(element)
    {
        var searchTerm = $.trim($(element).val());

        if (searchTerm.length < 2) {
            return;
        }

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        searchTimeout = setTimeout(function() {
            searchTimeout = null;

            var params = {
                stock_types_csv     : 'share,investment_trust,etf',
                search_term         : searchTerm
            };

            HL.Ajax.stockSearch(params, function(status, data) {

                if (data.length == 0 || data.results.length == 0) {

                    $('#share-search-results').text('No results found');

                } else {

                    $('#share-search-results').html('<ul></ul>');

                    $.each(data.results, function(index, data) {

                        var templateVars = {
                            sedol : data.sedol,
                            title : data.title,
                            description : data.description
                        };

                        if (index % 2 == 0) {
                            templateVars.class = 'even';
                        } else {
                            templateVars.class = 'odd';
                        }

                        var html = templates.investment_choice.share_search_result_row(templateVars);

                        $('ul', '#share-search-results').append(html);

                    });
                }

                var searchBox = $('#share-search-name');

                var searchBoxPosition = searchBox.position();

                $('#share-search-results').show().css({
                    'width': searchBox.outerWidth(),
                    'height': '100px',
                    'position': 'absolute',
                    'top': searchBoxPosition.top + searchBox.outerHeight(),
                    'left': searchBoxPosition.left,
                    'overflow': 'auto',
                    'background-color': '#FFF',
                    'padding': '5px'
                });
            });
        }, 500);
    };

    /**
     * Perform search for funds.
     *
     * @param element {object}
     */
    this.fundSearch = function(element)
    {
        var searchTerm = $.trim($(element).val());

        if (searchTerm.length < 2) {
            return;
        }

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        searchTimeout = setTimeout(function() {
            searchTimeout = null;

            var params = {
                stock_types_csv     : 'fund',
                search_term         : searchTerm
            };

            HL.Ajax.stockSearch(params, function(status, data) {

                if (data.length == 0 || data.results.length == 0) {

                    $('#name-search-results').text('No results found');

                } else {

                    $('#name-search-results').html('<ul></ul>');

                    $.each(data.results, function(index, data) {

                        var templateVars = {
                            sedol           : data.sedol,
                            title           : data.title,
                            description     : data.description,
                            wealth150_plus  : data.wealth150_plus
                        };

                        if (index % 2 == 0) {
                            templateVars.class = 'even';
                        } else {
                            templateVars.class = 'odd';
                        }

                        var html = templates.investment_choice.fund_search_result_row(templateVars);

                        $('ul', '#name-search-results').append(html);
                    });
                }

                var searchBox = $('#fund-search-name');

                var searchBoxPosition = searchBox.position();

                $('#name-search-results').show().css({
                    'width': searchBox.outerWidth(),
                    'height': '100px',
                    'position': 'absolute',
                    'top': searchBoxPosition.top + searchBox.outerHeight(),
                    'left': searchBoxPosition.left,
                    'overflow': 'auto',
                    'background-color': '#FFF',
                    'padding': '5px'
                });

            });

        }, 500);

    };

    /**
     * Perform alternative search for funds (by company/sector)
     *
     * @param append {boolean}      are we appending results to previously
     *                              found results (for pagination)?
     * @param start {boolean}       start from page 1?
     */
    this.searchFundsByCompanyAndSector = function(append, start)
    {
        // we're starting from the beginning to reset the offset

        if (start) {
            self.fundSearchResultsEnd = false;
            $('#fund-search-results').attr('data-offset', 0);
        }

        // have we reached the end of the available pages?

        if (self.fundSearchResultsEnd) {
            return;
        }

        var perPage = 25;
        var offset  = parseInt($('#fund-search-results').attr('data-offset'));

        var fundCompany = $('#fund-search-company').val();
        var fundSector = $('#fund-search-sector').val();

        var params = {
            stock_types_csv   : 'fund',
            per_page          : 25,
            offset            : offset
        };

        if (fundCompany != '' && fundCompany != '-') {
            params.fund_provider_id = fundCompany;
        }

        if (fundSector != '' && fundSector != '-') {
            params.fund_sector_id = fundSector;
        }

        HL.Ajax.stockSearch(params, function(status, data) {

            if (!append) {
                $('#fund-search-results').html('');
            }

            $('#fund-search-results-wrapper').hide();

            if (data.length == 0 || data.results.length == 0) {

                $('#fund-search-results').text('No results found');

            } else {

                var i = 0;

                $.each(data.results, function(index, data) {

                    var tplData = {
                        sedol               : data.sedol,
                        title               : data.title,
                        description         : data.description,
                        wealth150_plus      : data.wealth150_plus
                    };

                    if (i % 2 == 0) {
                        tplData.class = 'even';
                    } else {
                        tplData.class = 'odd';
                    }

                    var html = templates.investment_choice.fund_search_result_row(tplData);

                    $('#fund-search-results').append(html);

                    i++;
                });

                if (data.headers.hasOwnProperty('X-Link-Next')) {
                    $('#fund-search-results').attr('data-offset', offset + perPage);
                } else {
                    // no more pages, don't attempt to ajax anything more in
                    self.fundSearchResultsEnd = true;
                }
            }

            $('#fund-search-results-wrapper').show();
        });

    };

    /**
     * Calculate the lump/monthly amounts to be retained as cash on the account based on
     * the values given for the chosen investments.
     */
    this.calculateCashAmounts = function()
    {
        var totalLsAmount = 0;
        var totalRsAmount = 0;

        // get the lump/monthly amounts that were specified by the user
        // in the personal details section earlier

        if (product == 70) {
            var lumpVal = $('#form-lump_sum').val();
            if (lumpVal == '') {
                lumpAmount = null;
            } else {
                lumpAmount = parseFloat(lumpVal.replace(/,/g, ''));
            }

            var monthlyVal = $('#form-direct_debit').val();
            if (monthlyVal == '') {
                monthlyAmount = null;
            } else {
                monthlyAmount = parseFloat(monthlyVal.replace(/,/g, ''));
            }
        }

        var lumpCashAmount = lumpAmount;
        var monthlyCashAmount = monthlyAmount;

        var newLumpCashTotalSelector = $('#form-investment-cash-ls');
        var newMonthlyCashTotalSelector = $('#form-investment-cash-rs');

        // loop around all of the amount inputs and total it up

        // specified stock lump amounts

        $('.investment-row-ls').each(function() {

            var value = $.trim($(this).val());
            value = value.replace(/,/g, '');
            
            if (value == '') {
                return true;
            }

            totalLsAmount = totalLsAmount + parseFloat(value);
        });

        // specified stock monthly amounts

        $('.investment-row-rs').each(function() {

            var value = $.trim($(this).val());
            value = value.replace(/,/g, '');

            if (value == '') {
                return true;
            }

            totalRsAmount = totalRsAmount + parseFloat(value);
        });

        if (isNaN(totalLsAmount)) {
            totalLsAmount = 0;
        }

        if (isNaN(totalRsAmount)) {
            totalRsAmount = 0;
        }

        // subtract the totals from the available amounts, the result
        // is what's left over to be retained as cash on the account

        var adjustedLsAmount = lumpCashAmount - totalLsAmount;
        var adjustedRsAmount = monthlyCashAmount - totalRsAmount;

        // if they adjust the amount, remove the error
        if (adjustedLsAmount >= 0) {
            $('#form-investment-cash-ls-error').addClass('hide');
            HL.FormHandler.removeFormTopError(formID, 'form[investment_cash_ls]');
        } else if (adjustedLsAmount < 0) {
            $('#form-investment-cash-ls-error').removeClass('hide');
        }

        if (adjustedRsAmount >= 0) {
            $('#form-investment-cash-rs-error').addClass('hide');
            HL.FormHandler.removeFormTopError(formID, 'form[investment_cash_rs]');
        } else if (adjustedRsAmount < 0) {
            $('#form-investment-cash-rs-error').removeClass('hide');
        }

        $(newLumpCashTotalSelector).val(adjustedLsAmount.toFixed(2));
        $(newMonthlyCashTotalSelector).val(adjustedRsAmount.toFixed(2));

        $('#form-investment-cash-ls-display').html(adjustedLsAmount.toFixed(2));
        $('#form-investment-cash-rs-display').html(adjustedRsAmount.toFixed(2));
    };
};