/**
 * Partials for address finder form elements, like validator rules, form handlers, masks, etc...
 */
var AddressFinder = new function() {
    this.addValidatorRules = function () {

        var rules = {

            'form[house_number]': {
                required: true
            },

            'form[postcode]': {
                required: true,
                postcode: true
            },

            'form[address_pict]': {
                required: true,
                minlength: 11
            }

        };

        validatorRules = $.extend({}, validatorRules, rules);

    }();

};
