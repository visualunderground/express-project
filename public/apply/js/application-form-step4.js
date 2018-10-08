/**
 * Step 4 specific functions and handlers
 */
var validatorRules = {};

var step = 4;
var formID = 'application-form';

var alert_on_leave = true;

ApplicationForm.Step4 = new function () {
    /**
     * Parent class shortcut
     *
     * @var function
     */
    this.parent = ApplicationForm;

    /**
     * Init the application form page
     */
    this.init = function () {
        var self = this;

        $(function () {
            self.initForm();
        });

        this.initNavigateAway();
    }

    /**
     * Init the form and input handlers
     */
    this.initForm = function () {
        var self = this;
        var validator = self.parent.validator;
        var onlinePassword = 'form_online_password';
        var secureNumber = 'form_secure_number';
        var confOnlinePassword = 'form_confirm_online_password';
        var confSecureNumber = 'form_confirm_secure_number';

        // Validate form on keyup and submit
        $('#' + formID)

            .on('submit', function () {


                if (typeof(ipad) != "undefined" && $('.item-box-in-error:visible').length > 0) {
                    setTimeout(function() {
                        $('html, body').animate({ 
                            scrollTop: $('.item-box-in-error:visible').eq(0).closest('.item-row').offset().top - 10,
                        }, 300);
                    }, 100);
                }

                // Submitting the form doesn't mean you leave the page now
                alert_on_leave = false;

                return true;

            })

            .validate({

                    // Do not ignore the hidden fields as radio boxes and check boxes are hidden for their custom UI
                    ignore: '.ignore',

                    focusInvalid: false,

                    rules: validatorRules,

                    messages: validatorMessages,

                    errorPlacement: function (error, element) {

                        var name = element.attr('name');

                        switch (name) {
                            case 'form[income_option]':
                                error.insertAfter('#form-income-option-error-spaceholder');
                                break;

                            default:
                                if (typeof(ipad) != "undefined") {
                                    // check for reveals and make sure they
                                    // appear before the error label...

                                    var elementId = $(element).attr('id');
                                    elementId = elementId.replace(/form_/g, '');
                                    elementId = elementId.replace(/_/g, '-');

                                    if ($('#' + elementId + '-reveal').length > 0) {
                                        error.insertAfter($('#' + elementId + '-reveal'));
                                    } else {
                                        error.insertAfter(element);
                                    }
                                } else {
                                    error.insertAfter(element);
                                }

                        }
                    },

                    showErrors: function (errorMap, errorList) {

                        var self = ApplicationForm;

                        self.formHandler.removeSpaceholders(errorList);


                            // Scroll to the first error
                            if (typeof(ipad) != "undefined") {
                                if (typeof errorList[0] != "undefined") {
                                    var position = $(errorList[0].element).position().top;
                                    $('html, body').animate({
                                        scrollTop: position
                                    }, 300);
                                }
                            }

                        this.defaultShowErrors();

                    },

                    success: function (label) {

                        if (typeof(ipad) == "undefined") {
                            var self = ApplicationForm;
                            self.formHandler.removeFormTopError(formID, label.attr('for'));
                        }

                    },

                    invalidHandler: function (event, validator) {

                        if (typeof(ipad) == "undefined") {
                            var self = ApplicationForm;
                            self.formHandler.raiseFormTopErrors(formID, validator);
                        }

                    },

                    onfocusout: function (element) {
                        if ($(element).val() != '') {
                            $(element).valid();
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
                }
            );

        this.parent.initFormInputs();
        this.parent.initCardTypeSelector();

        // Username validation feedbacks
        $('#form_username').keyup(function () {

            // Remove spaces anyway (if has, otherwise cursor jumps to the end)
            if ($(this).val().indexOf(' ') >= 0) {
                $(this).val($(this).val().replace(/ /g, ''));
            }

            validator.realTimeValidation($(this).attr('id'));
        });

        // Password validation feedbacks
        $('#form_online_password, #form_secure_number').blur(function () {
            if ($(this).val() == '') {

                switch ($(this).attr('id')) {
                    case onlinePassword:
                        showNoValidationState(onlinePassword, confOnlinePassword);
                        break;
                    case secureNumber:
                        showNoValidationState(secureNumber, confSecureNumber);
                        break;
                }

            }

        });

        $('#form_online_password, #form_secure_number').keyup(function () {
            var valid = validator.realTimeValidation($(this).attr('id'));

            var confirm_password_element = '';

            switch ($(this).attr('id')) {
                case onlinePassword:
                    confirm_password_element = confOnlinePassword;
                    break;
                case secureNumber:
                    confirm_password_element = confSecureNumber;
                    break;
            }

            if (valid) {
                $('#' + confirm_password_element).removeAttr('disabled');
            } else {
                $('#' + confirm_password_element).attr('disabled', 'disabled');
            }

            if ($(this).val() == '') {

                switch ($(this).attr('id')) {
                    case onlinePassword:
                        showNoValidationState(onlinePassword, confOnlinePassword);
                        break;
                    case secureNumber:
                        showNoValidationState(secureNumber, confSecureNumber);
                        break;
                }

            }

            if (!formData.guestAccount) {

                // If passwords differ, re-validate the other
                if ($('#' + onlinePassword).val() != $('#' + secureNumber).val() &&
                    $('#' + onlinePassword).val() != '' &&
                    $('#' + secureNumber).val() != ''
                ) {

                    switch ($(this).attr('id')) {
                        case onlinePassword:
                            $('#' + secureNumber).valid();
                            break;
                        case secureNumber:
                            $('#' + onlinePassword).valid();
                            break;
                    }

                }
            }

        });

        // Helping the client to confirm when the password confirmation matches
        $('#form_confirm_online_password, #form_confirm_secure_number').keyup(function () {

            var equal_to_field = $(this).attr('id').replace('_confirm', '');
            if ($(this).val() == $('#' + equal_to_field).val()) {

                var validator = $('#' + formID).validate();
                validator.element($(this));
            }
        });

        // Gray out questions already selected
        $("#form_security_question_one,#form_security_question_two,#form_security_question_three").change(function (e) {
            var currentValues = [];
            id = $(this).attr("id");
            value = this.value;
            $("select").each(function () {
                currentValues.push($(this).val());
            })
            $("select option").each(function () {
                var idParent = $(this).parent().attr("id");
                if (id != idParent) {
                    if (this.value == value) {
                        if(false == this.disabled){
                            this.disabled = true;
                            $(this).css('color', '#d6d2ce');
                        }
                    } else {
                        if(true == this.disabled && $(this).attr("value") != 0 && currentValues.indexOf(this.value) == -1) {
                            this.disabled = false;
                            $(this).css('color', '#001d38');
                        }
                    }
                }
            });
        });

        // Sortcode mask
        $('#form_sort_code').mask('99 - 99 - 99', {placeholder: ' '});

        // Ignore the HTML5 validation and use our own validations
        $('#' + formID).attr('novalidate', 'novalidate');

        $('.password-reveal-input').on('keyup', function() {
            if ($(this).val().length === 0) {
                $(this).parent().find('.show-password-text').hide();
            } else {
                $(this).parent().find('.show-password-text').show();
            }
        });

        //Show hide password functionality
        $('.show-password-text').on("click", function(){
            passwordField = $(this).parent().find('input');
            if ('password' == passwordField.attr('type')) {
                passwordField.attr('type', 'text');
                $(passwordField).parent().find('.show-password-text').text('Hide');
            } else {
                passwordField.attr('type', 'password');
                $(passwordField).parent().find('.show-password-text').text('Show');
            }
        });
    }

    /**
     * Drops a message if client leaves the page without setting up online access
     *
     * @return void
     */
    this.initNavigateAway = function () {
        var modal_id = 'modal-no-online-access';

        var data = {
            id: modal_id,
            product: product,
            name: formData.productDetails.names.short
        };

        // Drops a customised navigate away modal window for events we can catch
        $('body').append(templates.modals.no_online_access(data));

        $('a').on('click', function (e) {

            if (alert_on_leave) {

                $('#' + modal_id).foundation('open');

                return false;
            }

        });
    };

    // Auto init
    this.init();
};

/**
 * Set UI state of passwords and confirm passwords fields to a no validation state
 *
 * @param String mainPwId
 * @param String confPwId
 */
function showNoValidationState(mainPwId, confPwId) {

    $('#' + mainPwId).removeClass('valid error').next('label.error').remove();
    $('#' + confPwId).attr('disabled', 'disabled');
    $('#' + confPwId).val('');
    $('#' + confPwId).removeClass('error').next('label.error').remove();

}