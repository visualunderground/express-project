/**
 * Partials for investment choice form elements, like validator rules, form handlers, masks, etc...
 */

var InvestmentChoice70 = new function()
{
    var self = this;

    this.addValidatorRules = function () {

        var maxAmount = ApplicationForm.maxAmount;

        var rules = {

            'form[income_option]': {
                required: true
            },

            'form[tax_relief_option]': {
                required: true
            },

            'form[direct_debit]': {
                required: true,
                min: directDebitMin,
                regularSaverMax: true
            },

            'form[lump_sum]': {
                required: true,
                max: maxAmount,
                min: lumpSumMin
            }
        };

        var messages = {
            'form[income_option]': {required: 'Please select an {label}income option{/label}'},
            'form[tax_relief_option]': {required: 'Please select a {label}tax relief option{/label}'},
            'form[direct_debit]': {
                required: 'Please enter a {label}monthly amount{/label}. The minimum monthly amount that can be invested is £' + directDebitMin,
                min: 'The minimum {label}monthly amount{/label} that can be invested is £' + directDebitMin
            },
            'form[lump_sum]': {
                required: 'Please enter a {label}lump sum amount{/label}. The minimum monthly amount that can be invested is £' + lumpSumMin,
                min: 'The minimum {label}lump sum{/label} that can be invested is £' + lumpSumMin
            }
        };

        validatorRules = $.extend({}, validatorRules, rules);
        validatorMessages = $.extend({}, validatorMessages, messages);

    }();
};