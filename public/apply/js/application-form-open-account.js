/**
 * Step 3 specific functions and handlers
 */
var validatorRules = {};
var validatorMessages = {};

var validator = ApplicationForm.validator;

var step   = 3;
var formID = 'application-form';

ApplicationForm.OpenAccount = new function()
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

                        switch (name) {
                            case 'form[card_type]':
                                error.insertAfter('#form-card-type-error-spaceholder');
                                break;

                            case 'form[security_code]':
                                error.insertAfter('#form-security-code-error-spaceholder');
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