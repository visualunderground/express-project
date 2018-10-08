/**
 * Step 3 specific functions and handlers
 */
var validatorRules = {};
var validatorMessages = {};

var validator = ApplicationForm.validator;

var step   = 3;
var formID = 'application-form';

var transferableAmount = 0;

ApplicationForm.Step3 = new function()
{
    /**
     * Parent class shortcut
     *
     * @var function
    */
    this.parent = ApplicationForm;

    /**
     * Init the application form page
     */
    this.init = function()
    {
        var self = this;

        $(function() {
            self.initForm();
        });
    };

    /**
     * Init the form and input handlers
     */
    this.initForm = function()
    {
        var self = this;

        this.parent.initFormInputs();
        this.parent.initCardTypeSelector();

        // Validate form on keyup and submit
        $('#' + formID)

            .on('submit', function() {

                // strip commas from amount input fields
                $('input[data-role=amount]').each(function() {
                    var value = $(this).val().replace(/,/g, '');
                    $(this).val(value);
                });

                if (typeof(ipad) != "undefined" && $('.item-box-in-error:visible').length > 0) {
                    setTimeout(function() {
                        $('html, body').animate({ 
                            scrollTop: $('.item-box-in-error:visible').eq(0).offset().top - 10,
                        }, 2);
                    }, 100);
                }

                // Check the address finder
                if (typeof(HL.AddressFinder) != "undefined" && product != 70) {
                    return HL.AddressFinder.onsubmit();
                }
                $('#' + formID).valid();
            })

            .validate({

                // Do not ignore the hidden fields as radio boxes and check boxes are hidden for their custom UI
                ignore : '.ignore',

                focusInvalid: false,

                rules: validatorRules,

                messages: validatorMessages,

                errorPlacement: function (error, element) {

                    var name = element.attr('name');

                    var investmentNum = '';
                    if (name.indexOf('form[investment') != 0) {
                        investmentNum = element.attr('id').split('-')[2];
                    }

                    switch (name) {

                        case 'form[title]':
                            error.insertAfter('#form-title-error-spaceholder');
                            break;

                        case 'form[card_type]':
                            error.insertAfter('#form-card-type-error-spaceholder');
                            break;

                        case 'form[security_code]':
                            error.insertAfter('#form-security-code-error-spaceholder');
                            break;

                        case 'form[address_pict]':
                            if (typeof(ipad) == 'object' ) {
                                error.insertAfter('#lookup-address-necessary-error');
                                $('#lookup-address-necessary-error').closest('.item-box').show();
                            } else {
                                error.insertAfter('#form_postcode');
                            }
                            break;

                        case 'form[investment_option]':
                            error.insertAfter('#form-investment-option-error-spaceholder');
                            break;

                        case 'form[lump_sum_method]':
                            error.insertAfter('#form-payment-method-error-spaceholder');
                            break;

                        case 'form[amount]':
                            if (typeof(ipad) == 'object' ) {
                                error.insertAfter('#form_amount');
                            } else {
                                error.appendTo('#form-amount-error-spaceholder');
                            }
                            break;

                        case 'form[investment_cash]':
                            $(error).insertAfter('#form-investment-cash-error-row span');
                            break;

                        case 'form[investment_total]':
                            $(error).insertAfter('#form-investment-input-total-error-row span');
                            break;

                        case 'form[investment'+investmentNum+']':
                            $(error).insertAfter('#form-investment-' + investmentNum + '-error-row span');
                            break;

                        case 'form[postcode]':
                            if (typeof(ipad) == 'object' ) {
                                error.insertAfter('#form_find_address');
                            }
                            break;

                        case 'form[lisa_age_declaration_confirm]':
                            error.insertAfter('#form-lisa-age-declaration-confirm-error-spaceholder');
                            break;

                        case 'form[isa_transfer_use_cty]':
                            error.insertAfter('#form_isa_transfer_use_cty-error-spaceholder');
                            break;

                        case 'form[isa_transfer_amount_complex]':
                            error.insertAfter('#form_isa_transfer_amount_complex-error-spaceholder');
                            break;

                        default:
                            error.insertAfter(element);
                            break;

                    }

                },

                showErrors: function(errorMap, errorList) {

                    ApplicationForm.formHandler.removeSpaceholders(errorList);

                    this.defaultShowErrors();
                },

                success: function(label) {

                    // TODO: iPad check, this is only for iPad 
                    if (typeof(ipad) == "undefined")
                        ApplicationForm.formHandler.removeFormTopError(formID, label.attr('for'));
                },

                invalidHandler: function(event, validator) {

                    if (typeof(ipad) == "undefined")
                        ApplicationForm.formHandler.raiseFormTopErrors(formID, validator);
                },

                highlight: function(element) {
                    
                    if (typeof(ipad) != "undefined")
                        CustomValidation.setErrorClass(element);
                },

                unhighlight: function(element) {

                    if (typeof(ipad) != "undefined")
                        CustomValidation.removeErrorClass(element);  
                }
            }
        );

        // Ignore the HTML5 validation and use our own validations
        $('#' + formID).attr('novalidate', 'novalidate');

    }

    // Auto init
    this.init();

    $('#form_amount, #form_secAmount').keyup(function() {

        var cleanAmt = $('#form_amount').val().replace(/,/g, "");
        var cleanSecAmt = $('#form_secAmount').val().replace(/,/g, "");

        var amtVal = parseInt(cleanAmt);
        var ordVal = parseInt(cleanSecAmt);

        $('#total-value').html(amtVal + ordVal);

    });
};