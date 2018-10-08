/**
 * Partials for personal details form elements, like validator rules, form handlers, masks, etc...
 */
var PersonalDetails = new function()
{
    var self = this;

    this.addValidatorRules = function() {

        var messages = {};

        var rules = {
            
            'form_mifid_nationality': {
                required: true
            },

            'form[title]': {
                required: true
            },

            'form[forename]': {
                required: true,
                firstname: true
            },

            'form[surname]': {
                required: true,
                lastname: true
            },

            'form[date_of_birth]': {
                required: true,
                higherdate: true,
                // HTML 5 date input returns with YYYY-MM-DD format
                datecustom: {'supported_formats': ['DD/MM/YYYY', 'YYYY-MM-DD']},
                isadult: true
            },

            'form[nino]': validator.nino(),

            'form[email]': {
                noduplicatesuffix: true,
                required: true,
                validemail: true
            },

            'form[phone_number]': {
                required: true,
                phone: true
            },

            'form[source]' : {
                required: true
            }

        };

        if (product == 25) {
            rules['form[date_of_birth]'].lisaAgeCheck = true;

            rules['form[lisa_age_declaration_confirm]'] = {
                required: true,
                lisaAgeDeclarationCheck: true
            };

            messages['form[lisa_age_declaration_confirm]'] = {
                required: 'Please select {label}whether you have a Lifetime ISA{/label}'
            };
        }

        if (product == 70) {
            rules['form[gender]'] = {
                required: true
            };
            rules['form[nationality]'] = {
                required: true
            };
            rules['form[marital_status]'] = {
                required: true
            };
            rules['form[employment_status]'] = {
                required: true
            };
            rules['form[retirement_age]'] = {
                retirementAgeCheck: true,
                alreadyRetiredCheck: true
            };
            if (!formData.loggedIn) {
                rules['form[date_of_birth]'].retirementAgeCheck = true
            }
        }

        validatorRules = $.extend({}, validatorRules, rules);
        validatorMessages = $.extend({}, validatorMessages, messages);

    }();

    this.initInputHandlers = function()
    {
        // When no NI Number checked, disable the NI Number field and display a note
        $('#form_no_nino').click(function() {

            if ($(this).is(':checked')) { // Disable the input with removing the error messages

                $('#form_nino')
                    .attr('disabled', 'disabled')
                    .removeClass('valid error');

                $('#form_nino-error').remove();
                $('#nino-error').remove();

                $('#no-nino-text').show();

                // remove error box in ipad
                if (typeof(ipad) != 'undefined') {
                    $('#form_nino').closest('.item-box').removeClass('item-box-in-error');
                }

                // Remove the top error
                HL.FormHandler.removeFormTopError(formID, 'form[nino]');

            } else {

                $('#form_nino').removeAttr('disabled');

                $('#no-nino-text').hide();

            }

        });

        $("select[name='form[retirement_age]']").focusout(function() {
            var ageCheck  = validatorMessages['form[retirement_age]'].retirementAgeCheck;
            var ageError = ageCheck.replace('{product}', formData.productDetails.names.short);

            $('#application-form').validate();

            $("select[name='form[retirement_age]']").rules('add', {
                messages: {
                    retirementAgeCheck: ageError
                }
            });
        });

        if (product == 70) {
            $("input[name='form[date_of_birth]']").focusout(function () {
                var ageField = $("select[name='form[retirement_age]']").find(":selected").text();
                if (ageField != 'Please select...') {
                    $("select[name='form[retirement_age]']").valid();
                }
            });
        }

        // NINO mask
        // for some reason marketing requested we allow any characters in the segments and just error afterwards...

        // turn the mask off for mobiles, it puts all of the chars in the wrong order...
        if (!ApplicationForm.isMobileDevice()) {
            $('#form_nino').mask('** ** ** ** *', {placeholder: ' '});
        }

        if (product == 25) {

            if (formData.loggedIn) {
                jQuery.validator.methods.regularSaverAgeCheck.call(this);
            }

            /**
             * Handle LISA age declaration choice.
             */
            $("input[name='form[lisa_age_declaration_confirm]']").click(function () {

                $(this).valid();

                var val = $(this).val();

                if (val === 'yes_hl') {
                    if (typeof(ipad) != 'undefined') {
                        ipad.UI.ModalWindow.open_by_id('lisa-maad-login-prompt-modal');
                    } else {
                        $('#lisa-maad-login-prompt-modal').foundation('open');
                    }

                } else if (val === 'yes_other') {
                    if (typeof(ipad) != 'undefined') {
                        ipad.UI.ModalWindow.open_by_id('lisa-transfer-prompt-modal');
                    } else {
                        $('#lisa-transfer-prompt-modal').foundation('open');
                    }
                }
            });
        }
    }();
};

$(document).ready(function() {

    // if we have a chosen payment menthod on page load, simulate click to trigger dropdown
    var investmentOption = $("input[name='form[investment_option]']:checked").val();

    // Savings currently only have one option for investing
    if (formData.savingsProduct) {
        investmentOption = 1;
        $("input[name='form[investment_option]']").addClass('ignore');
    }

    var investmentChoice = investmentOption - 1;

    $("#form_investment_option_"+investmentChoice).click();

});

