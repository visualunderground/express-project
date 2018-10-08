/**
 * Partials for investment choice form elements, like validator rules, form handlers, masks, etc...
 */

$(document).ready(function() {

    $("#form-lump_sum").blur(function () {
        updateValidation.updateLsValidation();
    });

    $("#form-direct_debit").blur(function () {
        updateValidation.updateRsValidation();
    });

    // need this to grab inital click
    $("label[for='form_add_cash_options_0']," +
        "label[for='form_add_cash_options_1']," +
        "label[for='form_add_cash_options_2']").click(function() {

        updateValidation.updateRsValidation();
        updateValidation.updateLsValidation();

    });

    $("input[name='form[investments_now_choice]']").change(function() {

        updateValidation.updateRsValidation();
        updateValidation.updateLsValidation();

    });
});

var updateValidation = {
    updateLsValidation: function() {

        lumpAmount = $("#form-lump_sum").val().replace(/,/g, '');
        $("input#form-investment-cash-ls").rules('add', {
            max: lumpAmount
        });

    },
    updateRsValidation: function() {

        monthlyAmount = $("#form-direct_debit").val().replace(/,/g, '');
        $("input#form-investment-cash-rs").rules('add', {
            max: monthlyAmount
        });
    }
};