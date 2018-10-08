/**
 * Internal transfer logic.
 */

var InternalTransfer = new function()
{
    var self = this;

    this.addValidatorRules = function() {

        var rules = {
            'form[lump_sum_method]': {
                required: true
            }
        };

        var messages = {
            'form[lump_sum_method]': 'Please select a payment method.'
        };

        validatorRules    = $.extend({}, validatorRules, rules);
        validatorMessages = $.extend({}, validatorMessages, messages);

    }();

    /**
     * Form event listeners.
     */
    this.initInputHandlers = function()
    {
        /**
         * User has selected a product to transfer from as their lump sum method.
         */
        $("input[name='form[lump_sum_method]']").click(function () {

            var cardFields = [
                'form[card_type]',
                'form[card_number]',
                'form[expiry_date]',
                'form[card_name]',
                'form[security_code]'
            ];

            var val = parseInt($(this).val());

            // 0 is debit card

            if (val !== 0) {

                // ignore validation on card detail fields

                $.each(cardFields, function (index, fieldName) {
                    $("input[name='" + fieldName + "']").addClass('ignore');
                });

                if (isaDetails != null && Object.keys(isaDetails).length > 0 && isaDetails.hasOwnProperty('products')
                    && isaDetails.products.hasOwnProperty(val)) {

                    var selectedIsaDetails = self.getSelectedISADetails(val);

                    var cashAvailableToTransfer      = selectedIsaDetails.cashAvailableToTransfer;
                    var balance                      = selectedIsaDetails.balance;
                    var minCashBalance               = selectedIsaDetails.minCashBalance;
                    var isaCtySubs                   = parseFloat(selectedIsaDetails.isaCtySubs);
                    var isaPtySubs                   = parseFloat(selectedIsaDetails.isaPtySubs);
                    var lisaRemainingAllowance       = parseFloat(selectedIsaDetails.lisaRemainingAllowance);
                    var transferFromName             = selectedIsaDetails.transferFromName;
                    var transferType = '';

                    // ignore validation on amount, we have dedicated inputs for ISA transfer amount

                    $("input[name='form[amount]']").addClass('ignore');

                    var amount = $(this).attr('data-suggested-amount');

                    $("input[name='form[isa_transfer_amount]']").val(amount);

                    var isaName         = productDetails.names.short;
                    var isaProductLimit = parseFloat(productDetails.subscription_limit.value);

                    var transferoption = '';

                    var enableCtySubOption = true;

                    // we can't use CTY subs if we have don't have the cash or
                    // they exceed the product limit

                    if (isaCtySubs > cashAvailableToTransfer || isaCtySubs > isaProductLimit || isaCtySubs <= 0) {
                        enableCtySubOption = false;
                    }

                    var enablePyOption = false;

                    if (isaPtySubs > 0) {
                        enablePyOption = true;
                    }

                    var transferBoth = false;

                    if (enablePyOption && enableCtySubOption && isaCtySubs != lisaRemainingAllowance) {
                        transferBoth = true;
                    }

                    // template's away

                    var localeOptions = ApplicationForm.localeOptions;

                    var templateData = {
                        'suggestedAmount'            : parseFloat(amount).toLocaleString(undefined, localeOptions),
                        'aatt'                       : parseFloat(cashAvailableToTransfer).toLocaleString(undefined, localeOptions),
                        'minCashBalance'             : parseFloat(minCashBalance).toLocaleString(undefined, localeOptions),
                        'balance'                    : parseFloat(balance).toLocaleString(undefined, localeOptions),
                        'isaName'                    : isaName,
                        'isaAllowance'               : parseFloat(isaProductLimit).toLocaleString(undefined, localeOptions),
                        'isaCurrentYearSubsDisplay'  : parseFloat(isaCtySubs).toLocaleString(undefined, localeOptions),
                        'isaCurrentYearSubs'         : parseFloat(isaCtySubs),
                        'enableCurrentYrOption'      : enableCtySubOption,
                        'enablePyOption'             : enablePyOption,
                        'isaPreviousYearSubsDisplay' : parseFloat(isaPtySubs).toLocaleString(undefined, localeOptions),
                        'currentTaxYear'             : ApplicationForm.currentTaxYear(),
                        'transferBoth'               : transferBoth,
                        'transferFromName'           : transferFromName,
                        'enablePyOption'             : enablePyOption,
                        'enableCtySubOption'         : enableCtySubOption
                    };

                    // set to true if product 25 so that we can display previous year nonsense

                    if (product === 25) {
                        templateData.lifetimeIsa = true;
                    }

                    var html;

                    if (typeof(ipad) == 'object') {
                        html = templates.personal_details.isa_transfer_ipad(templateData);
                    } else {
                        html = templates.personal_details.isa_transfer(templateData);
                    }


                    $('#card-payment-wrapper, #amount-wrapper').hide();
                    $('#section-isa-transfer').html(html).removeClass('hidden').removeClass('hide').fadeIn();

                } else if ($.inArray(val, ApplicationForm.allowedTransferProducts) !== -1) {

                    InternalTransfer.resetTransferFields();

                    // Amount validation is expired
                    $('label#form_amount-error').remove();

                    // remove ignore on amount validation
                    $("input[name='form[amount]']").removeClass('ignore');

                    ApplicationForm.formHandler.removeFormTopError(formID, 'form_amount');

                    $('#card-payment-wrapper').hide();
                    $('#section-isa-transfer').hide();
                    $('#amount-wrapper').fadeIn();
                }
            }
        });

        /**
         * Click handlers to recalculate ISA transfer total if user selects
         * whether to use their CTY value, etc.
         */
        $('#section-isa-transfer').on('click', "input[name='form[isa_transfer_use_cty]']", function() {
            self.calculateIsaTransferAmount();
            self.ISATransferComplexValidation();
        }).on('blur', '#form_isa_transfer_previous_year_amount', function() {
            self.calculateIsaTransferAmount();
            self.ISATransferComplexValidation();
        }).on('blur', '#form_isa_transfer_previous_year_amount_1', function() {
            self.calculateTransferAmountOne();
            self.ISATransferComplexValidation();
            self.ISATransferPYValueOnlyValidation();
        }).on('click', "input[name='form[isa_transfer_previous_year]']", function () {
            if ($("#form_isa_transfer_use_py").is(':checked')) {
                $("#form_isa_transfer_previous_year_amount").removeAttr('hidden');
                $('#isaTransferPy').show();
            } else {
                $("#form_isa_transfer_previous_year_amount").val('');
                $("#form_isa_transfer_previous_year_amount").removeClass('valid');
                $("#form_isa_transfer_previous_year_amount").attr('hidden', 'hidden');
                $('#isaTransferPy').hide();
                self.calculateIsaTransferAmount();
                self.ISATransferComplexValidation();
            }
        }).on('click', "#form_isa_transfer_use_py_1", function () {
            if ($("#form_isa_transfer_use_py_1").is(':checked')) {
                $("#form_isa_transfer_previous_year_amount_1").removeAttr('hidden');
                $('#isaTransferPy').show();
                self.calculateTransferAmountOne();
            } else {
                $("#form_isa_transfer_previous_year_amount_1").val('');
                $("#form_isa_transfer_previous_year_amount_1").removeClass('valid');
                $("#form_isa_transfer_previous_year_amount_1").attr('hidden', 'hidden');
                $('#isaTransferPy').hide();
                self.calculateTransferAmountOne();
                self.ISATransferComplexValidation();
            }
        });
        $('#section-isa-transfer').on('click', "input[name='form[isa_transfer_choose]']", function() {
            var transfer = $("input[name='form[isa_transfer_choose]']:checked").val();

            self.calculateTransferAmountOne();

        });

        $('#form_isa_transfer_use_cty_1').click(function() {

            self.calculateTransferAmountOne();
        });

        /**
         * Validation on simple ISA transfer amount input.
         */
        $('#section-isa-transfer').on('focusout', "input[name='form[isa_transfer_amount_simple]']", function() {

            var localeOptions = ApplicationForm.localeOptions;

            var selectedProduct = $("input[name='form[lump_sum_method]']:checked").val();

            selectedProduct = isaDetails.products[selectedProduct];

            var aatt = parseFloat(
                selectedProduct.detail.totals.cash_totals.amount_available_to_transfer.value
            );

            var maxTransfer = aatt;

            var maxMessage = 'You cannot {label}transfer{/label} more than the cash amount available.';

            var subscribedAmount = 0;
            var previousYearSubscribedAmount = 0;

            if (selectedProduct.allowance.subscribed_amount !== null) {
                subscribedAmount = parseFloat(
                    selectedProduct.allowance.subscribed_amount.value
                );
            }

            if (selectedProduct.allowance.previous_year_subscribed_amount !== null) {
                previousYearSubscribedAmount = parseFloat(
                    selectedProduct.allowance.previous_year_subscribed_amount.value
                );
            }

            if (productDetails.product_type === 'isa') {
                var productMax = productDetails.subscription_limit.value;

                if (subscribedAmount > productMax) {
                    if (product == 25 && previousYearSubscribedAmount > 0) {
                        maxTransfer = previousYearSubscribedAmount;
                        maxMessage = 'You cannot {label}transfer{/label} more than the £' +
                            previousYearSubscribedAmount.toLocaleString(undefined, localeOptions) +
                            ' previous tax year or investment growth available.';
                    } else {
                        // we shouldn't get here, as the option would have been disabled
                        maxTransfer = 0;
                        maxMessage = 'You have insufficient subscriptions to transfer.';
                    }
                }

                if (maxTransfer > productMax) {
                    maxTransfer = productMax;
                    maxMessage = 'Your total transfer amount must not exceed &pound;'
                        + parseFloat(maxTransfer).toLocaleString(undefined, localeOptions);
                }
            }

            $('#application-form').validate();

            $("input[name='form[isa_transfer_amount_simple]']").rules('add', {
                max: maxTransfer,
                min: lumpSumMin,
                isaTransferMin: {
                    currentYearSubs: subscribedAmount,
                    previousYearSubs: previousYearSubscribedAmount
                },
                messages: {
                    max: maxMessage,
                    min: 'The minimum amount that you can {label}transfer{/label} is £' + lumpSumMin
                }
            });
        });

        /**
         * User has clicked on the 'Why can't I transfer?' button.
         */
        $('.no-transfer-tip').click(function() {
            var reason = $(this).attr('data-reason');

            switch (reason) {
                case 'insufficient_cash':
                    $('#transfer-insufficient-cash-modal').foundation('open');
                    break;
                case 'existing_withdrawal':
                    $('#transfer-existing-withdrawal-modal').foundation('open');
                    break;
                case 'current_year_subs_exceed_isa_limit':
                    $('#transfer-cy-subs-exceed-allowance-modal').foundation('open');
                    break;
                case 'current_year_subs_exceed_available_cash':
                    $('#transfer-cy-subs-exceed-cash-modal').foundation('open');
                    break;
                case 'duplicate_product_type':
                    $('#transfer-duplicate-product-type').foundation('open');
                    break;
                default:
                    // something weird on the account is occurring, open generic 'call us' modal
                    $('#transfer-error-modal').foundation('open');
            }
        });

    }();

    /**
     * Validation for the expanded ISA transfer screen.
     *
     */
    this.ISATransferPYValueOnlyValidation = function()
    {
        var productNo = $("input[name='form[lump_sum_method]']:checked").val();
        var selectedIsaDetails = self.getSelectedISADetails(productNo);

        var ptyValue = ($("input[name='form[isa_transfer_previous_year_amount_radio]").val());

        var isaPtySubs              = selectedIsaDetails.isaPtySubs;

        var ptySubRules = {
            max: isaPtySubs,
            messages: {
                max: 'Your transfer limit from previous years is  £' + parseFloat(isaPtySubs).toLocaleString()
            }
        };

        if (!isNaN(ptyValue)) {
            $("input[name='form[isa_transfer_previous_year_amount_radio]").rules('add', ptySubRules);
        }

    };

    /**
     * Validation for the expanded ISA transfer screen.
     *
     */
    this.ISATransferComplexValidation = function()
    {
        $('label#form_isa_transfer_amount_complex-error').remove();

        var productNo = $("input[name='form[lump_sum_method]']:checked").val();

        var selectedIsaDetails = self.getSelectedISADetails(productNo);

        var isaPtySubs              = selectedIsaDetails.isaPtySubs;
        var cashAvailableToTransfer = selectedIsaDetails.cashAvailableToTransfer;

        var maxAmount               = cashAvailableToTransfer;

        var maxOverallAllowance     = cashAvailableToTransfer;

        if (productDetails.product_type == 'isa') {
            var isaProductLimit = parseFloat(productDetails.subscription_limit.value);

            if (parseFloat(cashAvailableToTransfer) > parseFloat(isaProductLimit)) {
                maxAmount = isaProductLimit;
                maxOverallAllowance = isaProductLimit;
            }

            if (parseFloat(maxAmount) > parseFloat(isaPtySubs)) {
                maxAmount = isaPtySubs;
            }
        }

        var ptyValue = ($("input[name='form[isa_transfer_previous_year_amount]']").val());

        var ptySubRules = {
            messages : {}
        };

        ptySubRules.max = maxAmount;

        if (maxAmount == isaPtySubs) {
            ptySubRules.messages.max = 'Your transfer limit from previous years is &pound;' + parseFloat(isaPtySubs).toLocaleString();
        } else if (maxAmount == cashAvailableToTransfer) {
            ptySubRules.messages.max = 'Your total transfer amount must not exceed &pound;' + parseFloat(cashAvailableToTransfer).toLocaleString();
        } else {
            ptySubRules.messages.max = 'You cannot transfer more than your remaining &pound;' + parseFloat(maxAmount).toLocaleString() + ' allowance';
        }


        if ($("input[name='form[isa_transfer_use_cty]']").length == 0
            || $("input[name='form[isa_transfer_use_cty]:checked']").val() == 0) {
            ptySubRules.min = 1;
            ptySubRules.messages.min = 'The minimum amount you can transfer is &pound; 0.01' ;
        }

        if (!isNaN(ptyValue)) {
            $("input[name='form[isa_transfer_previous_year_amount]']").rules('add', ptySubRules);
        }

        var ptyComplexRule = {
            required: true,
            min: lumpSumMin,
            max: maxOverallAllowance,
            messages : {
                required: 'Your total transfer amount must be a minimum of £' + parseFloat(lumpSumMin).toLocaleString(),
                min: 'Your total transfer amount must be a minimum of £' + parseFloat(lumpSumMin).toLocaleString(),
                max: 'Your total transfer amount must not exceed &pound; ' + parseFloat(maxOverallAllowance).toLocaleString()
            }
        };


        $("input[name='form[isa_transfer_amount_complex]']").rules('add', ptyComplexRule);


        $('#application-form').validate();

    };

    /**
     * Get product details for a selected ISA.
     *
     * @param productNo {number}
     * @returns {{currentValue: number, cashAvailableToTransfer: number, balance: number, minCashBalance: number, isaCtySubs: number, isaPtySubs: number}}
     */
    this.getSelectedISADetails = function(productNo) {

        var currentValue = 0;
        var cashAvailableToTransfer = 0;
        var balance = 0;
        var minCashBalance = 0;
        var isaCtySubs = 0;
        var isaPtySubs = 0;
        var lisaRemainingAllowance = 0;
        var transferFromName = '';

        if (isaDetails.products.hasOwnProperty(productNo)) {
            var productDetails = isaDetails.products[productNo];
            var cashTotals = productDetails.detail.totals.cash_totals;
            var minCashBalanceDetails = productDetails.detail.minimum_cash_balance_details;

            currentValue = productDetails.detail.totals.total_value.value;

            cashAvailableToTransfer     = cashTotals.amount_available_to_transfer.value;
            balance                     = minCashBalanceDetails.balance.value;
            minCashBalance              = minCashBalanceDetails.minimum_cash_balance_amount.value;
            transferFromName            = productDetails.detail.product_name.short;

            if (productDetails.allowance.lisa_remaining_allowance !== null) {
                lisaRemainingAllowance = productDetails.allowance.lisa_remaining_allowance.value;
            }

            if (productDetails.allowance.current_year_available_to_transfer !== null) {
                isaCtySubs = productDetails.allowance.current_year_available_to_transfer.value;
            }

            if (productDetails.allowance.previous_year_available_to_transfer !== null) {
                isaPtySubs = productDetails.allowance.previous_year_available_to_transfer.value;
            }
        }

        var returnObj = {
            currentValue            : currentValue,
            cashAvailableToTransfer : cashAvailableToTransfer,
            balance                 : balance,
            minCashBalance          : minCashBalance,
            isaCtySubs              : isaCtySubs,
            isaPtySubs              : isaPtySubs,
            lisaRemainingAllowance  : lisaRemainingAllowance,
            transferFromName        : transferFromName
        };

        return returnObj;
    };

    this.calculateTransferAmountOne = function()
    {
        var productNo = $("input[name='form[lump_sum_method]']:checked").val();
        var selectedIsaDetails = self.getSelectedISADetails(productNo);

        var transferOption = $("input[name='form[isa_transfer_choose]']:checked").val();

        var total = 0;

        if (transferOption === '1') {
            total += parseFloat($("input[name='form[isa_transfer_cty_value_1]']").val());
        } else {
            var ptyValue = parseFloat($('#form_isa_transfer_previous_year_amount_1').val());
        }

        if (!isNaN(ptyValue)) {
            total += ptyValue;
        }

        $('#total-transfer-amount').text(total.toFixed(2));
        $('#form_isa_transfer_amount_complex').val(total);

        var lisaRemainingAllowance = selectedIsaDetails.lisaRemainingAllowance;

        var ptyAllowanceRules = {
            max: lisaRemainingAllowance,
            messages: {
                max: 'Please enter a maximum amount of £' + lisaRemainingAllowance
            }
        };

        if (!isNaN(ptyValue)) {
            $("#form_isa_transfer_use_py_1").rules('add', ptyAllowanceRules);
        }



        return total.toFixed(2);
    };

    /**
     * Recalculate ISA transfer total if user selects whether to use
     * their CTY value, etc.
     */
    this.calculateIsaTransferAmount = function()
    {
        var useCtySubs = $("input[name='form[isa_transfer_use_cty]']:checked").val();

        var total = 0;

        if (useCtySubs === '1') {
            total += parseFloat($("input[name='form[isa_transfer_cty_value]']").val());
        }

        var ptyValue = parseFloat($('#form_isa_transfer_previous_year_amount').val());

        if (!isNaN(ptyValue)) {
            total += ptyValue;
        }

        $('#total-transfer-amount').text(total.toFixed(2));
        $('#form_isa_transfer_amount_complex').val(total.toFixed(2));

        return total.toFixed(2);
    };

    /**
     * Ignore all of the transfer fields if someone selects a different option to transfer (having already selected
     * transfer initially).
     */
    this.resetTransferFields = function()
    {
        var transferFields = [
            'form[isa_transfer_amount_simple]',
            'form[isa_transfer_use_cty]',
            'form[isa_transfer_previous_year_amount]',
            'form[isa_transfer_amount_complex]'
        ];

        $.each(transferFields, function(index, name) {
            $("input[name='" + name + "']").addClass('ignore');
        });

        $("input[name='form[isa_transfer_use_cty]']").prop('checked', false);
    };

    this.showCYDisclaimerText = function()
    {
        $('#currentYearTextDisclaimer').toggle();
    };

};
