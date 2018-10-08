/**
 * Partials for card payment form elements, like validator rules, form handlers, masks, etc...
 */
var CardPayment = new function()
{
    var self = this;

    this.addValidatorRules = function() {

        var rules = {

            'form[amount]': {
                required: true
            },

            'form[investment_option]': {
                required: true
            },

            'form[card_number]': {
                required: true,
                creditcard: true,
                creditcardtype: {'supported_types': self.supportedCardTypes}
            },

            'form[card_type]': {
                required: true
            },

            'form[card_name]': {
                required: true,
                fullname: true,
                equalsinitials: ['#form_forename', '#form_surname']
            },

            'form[security_code]' : {
                required: true,
                minlength: 3,
                number: true
            },

            'form[expiry_date]' : {
                required: true,
                expirydate: true,
                // HTML 5 month input returns with YYYY-MM-DD format
                datecustom: {'supported_formats': ['MM/YY', 'YYYY-MM']}
            }

        };

        // Amount validation is expired
        $('label#form_amount-error').remove();

        ApplicationForm.formHandler.removeFormTopError(formID, 'form_amount');

        validatorRules = $.extend({}, validatorRules, rules);

    }();

    this.initInputHandlers = function()
    {
        // ignore validation on the debit card fields unless they're on display
        // this prevents us displaying validation errors for them when no payment type has been selected yet

        var cardFields = [
            'form[amount]',
            'form[card_number]',
            'form[card_type]',
            'form[expiry_date]',
            'form[card_name]',
            'form[security_code]'
        ];

        $.each(cardFields, function(index, fieldName) {

            var fieldNameEscaped = fieldName.replace('[', '\\[').replace(']', '\\]');

            if (fieldName == 'form[card_type]') {
                if (!$('label[for^=form_card_type]').is(':visible')) {

                    $('[name=' + fieldNameEscaped + ']').addClass('ignore');
                }
            } else if (!$('[name=' + fieldNameEscaped + ']').is(':visible')) {

                $('[name=' + fieldNameEscaped + ']').addClass('ignore');
            }
        });

        var fieldNameEscaped;

        // Fields which validation relates to the payment method
        var fields = [
            'form[amount]',
            'form[card_number]',
            'form[card_type]',
            'form[expiry_date]',
            'form[card_name]',
            'form[security_code]',
            'form[lump_sum_method]'
        ];

        // Investment option handler
        $('input[name=form\\[investment_option\\]]').click(function() {

            var investmentOptions = $(this).val();

            // Ignore the validation and remove error messages on debit card payment
            $.each(fields, function(index, fieldName) {

                fieldNameEscaped = fieldName.replace('[', '\\[').replace(']', '\\]');

                if (investmentOptions == 2) {
                    $('[name=' + fieldNameEscaped + ']').addClass('ignore');
                    ApplicationForm.formHandler.removeFormTopError(formID, fieldName);
                } else {
                    $('[name=' + fieldNameEscaped + ']').removeClass('ignore');
                }

            });
        });

        // Payment method handler
        $("input[name='form[lump_sum_method]']").click(function() {

            var cardFields = [
                'form[amount]',
                'form[lump_sum_method]',
                'form[card_type]',
                'form[card_number]',
                'form[expiry_date]',
                'form[card_name]',
                'form[security_code]'
            ];

            var val = parseInt($(this).val());

            if (val == 0) {

                $.each(cardFields, function(index, fieldName) {
                    $("input[name='" + fieldName + "']").removeClass('ignore');

                    if (typeof(ipad) == 'object' ) {
                        $("#cardType").removeClass('ignore');
                    }
                });

                $('#card-payment-wrapper, #amount-wrapper').fadeIn();
                $('#section-isa-transfer').hide();
                InternalTransfer.resetTransferFields();
            } else {
                if (typeof(ipad) == 'object' ) {
                    $("#cardType").addClass('ignore');
                }
            }
        });

        // Card number mask
        $('#form_card_number').mask('9999 9999 9999 9?999', {placeholder : ' '});

        // Security code mask
        $('#form_security_code').mask('999', {placeholder : ' '});

        /**
         * Validation for amount field. Max amount/error message is dependent on
         * whether a transfer option has been selected for logged in clients.
         */
        $("input[name='form[amount]']").focusout(function() {

            var maxAmount = ApplicationForm.maxAmount;
            var maxError  = validatorMessages['form[amount]'].max_card_payment;
            var minError  = validatorMessages['form[amount]'].min;

            if (formData.savingsProduct) {
                maxError  = validatorMessages['form[amount]'].savings_max_card_payment;
                minError  = validatorMessages['form[amount]'].savings_min;
            }

            var lumpSumMethod = parseInt($("input[name='form[lump_sum_method]']:checked").val());

            if ($.inArray(lumpSumMethod, ApplicationForm.allowedTransferProducts) !== -1) {
                maxAmount = transferLimits[lumpSumMethod];
                maxError = validatorMessages['form[amount]'].max_transfer;

                if (formData.savingsProduct) {
                    maxError = validatorMessages['form[amount]'].savings_max_transfer;
                }
            }

            // set upper maximum to ISA limit if we're applying for an ISA

            if (productDetails.product_type === 'isa') {
                var isaAllowanceAmount = self.calculateRemainingIsaAllowance();

                if (isaAllowanceAmount < maxAmount) {
                    maxAmount = isaAllowanceAmount;
                }
            }

            maxError = maxError.replace('{maxAmount}', HL.InputHelper.numberFormat(maxAmount));
            minError = minError.replace('{minAmount}', HL.InputHelper.numberFormat(lumpSumMin));

            $('#application-form').validate();

            $("input[name='form[amount]']").rules('add', {
                max: maxAmount,
                min: lumpSumMin,
                messages: {
                    max: maxError,
                    min: minError
                }
            });
        });

    }();

    /**
     * Get the lowest of the two ISA limits (product limit and remaining ISA limit).
     *
     * @returns {number}
     */
    this.calculateRemainingIsaAllowance = function()
    {
        var isaProductLimit = productDetails.subscription_limit.value;

        if (isaDetails !== undefined && isaDetails !== null) {
            if (Object.keys(isaDetails).length > 0 && isaDetails.hasOwnProperty('allowances')) {
                if (isaDetails.allowances.hasOwnProperty('overall_remaining_allowance')) {
                    var remainingIsaAllowance = isaDetails.allowances.overall_remaining_allowance.value;
                    return Math.min(isaProductLimit, remainingIsaAllowance);
                }
            }
        }

        return isaProductLimit;
    };
}