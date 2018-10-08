/**
 * Partials for investment options selection
 */

$(document).ready(function() {

    $("#form-investment-cash-rs-display, #form-investment-cash-ls-display").html('0.00');
    $(".rs-allowed, .ls-allowed").hide();

    $("input[name='form\\[add_cash_options\\]']").click(function () {
        ChangeCashOptions.updateInvestmentOptions(this.value);
    });

    $("#form-lump_sum").keyup(function () {

        ApplicationForm.InvestmentOptions.calculateCashAmounts();

        DispLumpSumTaxRelief70.showLumpSumTaxRelief();
        DispLumpSumTaxRelief70.showZeroLumpSumGross();
    });

    $("#form-direct_debit").keyup(function () {

        ApplicationForm.InvestmentOptions.calculateCashAmounts();

        DispDirectDebitTaxRelief70.showZeroDirectDebitTaxRelief();
        DispDirectDebitTaxRelief70.showZeroDirectDebitGross();
    });

    /**
     * This section caters for pre-populating the investment options page with details
     * the client has previously selected.
     *
     * For example if the client submits the investments page and then changes their mind,
     * then can come back and amend the details
     *
     * This will also populate the form for Simple Invest and Portfolio+ (vmp)
     */
    var cash_option = formData.formVars.application_details.add_cash_options;
    var investment_options = formData.formVars.application_details.investment_options;

    var lump_sum = formData.formVars.application_details.lump_sum;
    var direct_debit = formData.formVars.application_details.direct_debit;

    ChangeCashOptions.setCashAmount(lump_sum, direct_debit);

    if (cash_option != 'undefined' && cash_option != null) {
        ChangeCashOptions.updateInvestmentOptions(cash_option.toString());
    }

    if (investment_options != 'undefined' && $(investment_options).length > 0) {

        $("label[for='form_investments_now_choice_1']").click();

        // loop through the previously chosen investments and display a row in the investment table
        $(investment_options).each(function(index, data) {

            if (data.total_rs !== null && data.total_ls !== null) {
                cash_option = 2;
            } else if (data.total_rs == null && data.total_ls !== null) {
                cash_option = 0;
            } else if (data.total_rs !== null && data.total_ls == null) {
                cash_option = 1;
            }

            if (data.type == 'vmp') {
                data.vmp = true;
                cash_option = 0;
            }

            ChangeCashOptions.updateInvestmentOptions(cash_option.toString());
            $("label[for='form_add_cash_options_" + cash_option + "']").click();

            ChangeCashOptions.setCashAmount(data.total_ls, data.total_rs);

            // populate the hb template with the clients chosen investments
            var html = templates.investment_choice.investment_row(data);

            if (typeof(ipad) != 'undefined') {
                html = templates.investment_choice.investment_row_ipad(data);
            }

            $(html).insertBefore('#select-investment-wrapper');

            /**
             * if we've got VMP investments we need to amend the layout slightly
             */
            if (data.type == 'vmp') {

                investmentOptions70.updateVmpInvestment(data);
                ChangeCashOptions.setCashAmount(data.lsAmount, null);
                PortfolioPlus.updateVmpPercentage(data.id);
                ChangeCashOptions.setInvestmentAmount(data.id, data.vmpInvestedAmount, data.total_rs);

            } else if (data.masterPortfolio == true) {

                // we need to work out the amount to be invested based on the percentage
                var onePercent = parseFloat(data.percentage) / 100;

                var totalValueOfLumpSumPercentage = onePercent * parseFloat(data.total_ls);
                var totalValueOfMonthlyPercentage = onePercent * parseFloat(data.total_rs);

                ChangeCashOptions.setInvestmentAmount(data.id, totalValueOfLumpSumPercentage, totalValueOfMonthlyPercentage);

            } else {

                ChangeCashOptions.setInvestmentAmount(data.id, data.lsAmount, data.rsAmount);
            }

            $('#application-form').validate();

            var selector = $("input[name='form[investment_choice_rs][" + data.id + "]']");

            if ($(selector).length > 0) {
                $(selector).rules('add', {
                    min: monthlyMin,
                    numeric: true,
                    investmentChoiceAmount: true
                });

                HL.InputHelper.amount(selector);
            }

            var lumpMin = 0;

            if (data.type == 'fund') {
                lumpMin = fundInvestmentMin;
            }

            if (data.type == 'vmp') {
                lumpMin = data.fundInvestMin;
            }

            selector = $("input[name='form[investment_choice_ls][" + data.id + "]']");

            if ($(selector).length > 0) {
                $(selector).rules('add', {
                    min: lumpMin,
                    numeric: true,
                    investmentChoiceAmount: true
                });

                HL.InputHelper.amount(selector);
            }
        });

        // recalculate all our cash figures. This includes tax relief
        // and gross amount.
        DispLumpSumTaxRelief70.showLumpSumTaxRelief();
        DispLumpSumTaxRelief70.showZeroLumpSumGross();
        DispDirectDebitTaxRelief70.showZeroDirectDebitTaxRelief();
        DispDirectDebitTaxRelief70.showZeroDirectDebitGross();

        updateValidation.updateRsValidation();
        updateValidation.updateLsValidation();

        ApplicationForm.InvestmentOptions.calculateCashAmounts();

    } else {
        if (lump_sum != null || direct_debit != null ) {
            $("label[for='form_investments_now_choice_0']").click();
        }
    }
});

var ChangeCashOptions ={
    /**
     * Show/hide all the relevant sections depending on the
     * clients chosen payment method
     *
     * @param paymentOption
     */
    updateInvestmentOptions: function(paymentOption) {

        $("#payment-option-selected").removeClass('hide');
        $('#payment-option').addClass('spacer-no-bottom').removeClass('spacer-bottom-double');

        switch (paymentOption) {
            case '0':
                investmentOptions70.showLumpSum();
                investmentOptions70.hideDirectDebit();
                investmentOptions70.showInvestmentOption();
                investmentOptions70.showTaxReliefOption();
                investmentOptions70.showIncomeOption();
                investmentOptions70.updateRsInvestmentDisplay();
                break;
            case '1':
                investmentOptions70.hideLumpSum();
                investmentOptions70.hideTaxReliefOption();
                investmentOptions70.showIncomeOption();
                investmentOptions70.showDirectDebit();
                investmentOptions70.showInvestmentOption();
                investmentOptions70.updateLsInvestmentDisplay();
                break;
            case '2':
                investmentOptions70.showLumpSum();
                investmentOptions70.showDirectDebit();
                investmentOptions70.showInvestmentOption();
                investmentOptions70.showTaxReliefOption();
                investmentOptions70.showIncomeOption();
                investmentOptions70.updateLsAndRsInvestmentDisplay();
                break;
            default:
                investmentOptions70.updateLsAndRsInvestmentDisplay();
        }
    },

    setCashAmount: function(lump_sum, direct_debit) {

        var lumpSumInput = $("#form-lump_sum");
        var directDebitInput = $("#form-direct_debit");

        if (lump_sum != null) {
            lump_sum = HL.InputHelper.numberFormat(lump_sum);
            lumpSumInput.val(lump_sum).valid();
            lumpSumInput.prev().addClass('notempty');
        }

        if (direct_debit != null) {
            direct_debit = HL.InputHelper.numberFormat(direct_debit);
            directDebitInput.val(direct_debit).valid();
            directDebitInput.prev().addClass('notempty');
        }
    },

    setInvestmentAmount: function(investment_id, lump_sum, direct_debit) {

        var rsSelector = $("input[name='form[investment_choice_rs][" + investment_id + "]']");
        var lsSelector = $("input[name='form[investment_choice_ls][" + investment_id + "]']");

        // update the payment amounts
        if (lump_sum != null && !isNaN(lump_sum)) {
            lsSelector.val(HL.InputHelper.numberFormat(lump_sum)).valid();
            lsSelector.prev().addClass('notempty');
        }

        if (direct_debit != null && !isNaN(direct_debit)) {
            rsSelector.val(HL.InputHelper.numberFormat(direct_debit)).valid();
            rsSelector.prev().addClass('notempty');
        }
    }
};

var DispLumpSumTaxRelief70 = {
    showLumpSumTaxRelief: function() {

        var lump_sum = $("#form-lump_sum").val().replace(/,/g, '');
        var tax_relief = (lump_sum * taxReliefAmount);

        var tr_amount = parseFloat(tax_relief);
        var span = $('#ls-tax-relief');

        span.html(HL.InputHelper.numberFormat(tr_amount));
    },
    showZeroLumpSumGross: function() {

        // will get the lump_sum value
        var lump_sum = $("#form-lump_sum").val().replace(/,/g, '');
        var tax_relief = (lump_sum * taxReliefAmount);

        var tr_amount = parseFloat(tax_relief);
        var ls_amount = parseFloat(lump_sum);
        var gross = tr_amount + ls_amount;
        var span = $('#ls-gross');

        if (isNaN(gross)) {
            gross = 0;
        }

        span.html(HL.InputHelper.numberFormat(gross));
    }
};

var DispDirectDebitTaxRelief70 = {
    showZeroDirectDebitTaxRelief: function() {

        var direct_debit = $("#form-direct_debit").val().replace(/,/g, '');
        var tax_relief = (direct_debit * taxReliefAmount);

        var tr_amount = parseFloat(tax_relief);
        var span = $('#dd-tax-relief');

        span.html(HL.InputHelper.numberFormat(tr_amount));

    },
    showZeroDirectDebitGross: function() {

        // will get the lump_sum value
        var direct_debit = $("#form-direct_debit").val().replace(/,/g, '');
        var tax_relief = (direct_debit * taxReliefAmount);

        var tr_amount = parseFloat(tax_relief);
        var dd_amount = parseFloat(direct_debit);
        var gross = tr_amount + dd_amount;
        var span = $('#dd-gross');

        if (isNaN(gross)) {
            gross = 0;
        }

        span.html(HL.InputHelper.numberFormat(gross));

    }
};

var investmentOptions70 = {
    showLumpSum: function () {
        $('div.row-lump-sum').removeClass('hide');
    },

    showDirectDebit: function () {
        $('div.row-direct-debit').removeClass('hide');
    },

    hideLumpSum: function () {
        $("#form-lump_sum").val('').removeClass('valid');
        $("#ls-tax-relief, #ls-gross").html('0.00');
        $('div.row-lump-sum').addClass('hide');
    },

    hideDirectDebit: function () {
        $("#form-direct_debit").val('').removeClass('valid');
        $("#dd-tax-relief, #dd-gross").html('0.00');
        $('div.row-direct-debit').addClass('hide');
    },

    showInvestmentOption: function () {
        $('div.section-investment-choice').removeClass('hide');
        $('fieldset.section-investment-choice').removeClass('hide');
    },

    showTaxReliefOption: function () {
        $('div.row-tax-relief-options').removeClass('hide');
        $('fieldset.row-tax-relief-options').removeClass('hide');
    },

    hideTaxReliefOption: function () {
        $('div.row-tax-relief-options').addClass('hide');
        $('fieldset.row-tax-relief-options').addClass('hide');
    },
    showIncomeOption: function () {
        $('div.row-income-options').removeClass('hide');
    },
    updateRsInvestmentDisplay: function () {

        $("#form-investment-cash-rs-display").html('0.00');
        $("input#form-direct_debit").prev().removeClass('notempty');
        $(".ls-allowed").show();
        $(".rs-allowed, .ipad-hide").hide();

        $("[name^='form[investment_choice_rs]']").val('').removeClass('valid');

        $("input#form-direct_debit").addClass('ignore');
        $("input#form-lump_sum").removeClass('ignore');
        $("input[name='form[tax_relief_option]']").removeClass('ignore');

        $("[name^='form[investment_choice_rs][']").each(function () {
            $(this).addClass('ignore');
        });

        $("[name^='form[investment_choice_ls][']").each(function () {
            $(this).removeClass('ignore');
        });

    },

    updateLsInvestmentDisplay: function () {

        $("#form-investment-cash-ls-display").html('0.00');
        $("input#form-lump_sum").prev().removeClass('notempty');

        $(".rs-allowed").show();
        $(".ls-allowed, .ipad-hide").hide();

        $("[name^='form[investment_choice_ls]']").val('').removeClass('valid');

        $("input#form-direct_debit").removeClass('ignore');
        $("input#form-lump_sum").addClass('ignore');
        $("input[name='form[tax_relief_option]']").addClass('ignore');
        $("input[name='form[tax_relief_option]']").removeClass('required');

        $("[name^='form[investment_choice_rs][']").each(function () {
            $(this).removeClass('ignore');
        });

        $("[name^='form[investment_choice_ls][']").each(function () {
            $(this).addClass('ignore');
        });
    },

    updateLsAndRsInvestmentDisplay: function () {

        $(".rs-allowed, .ls-allowed, .ipad-hide").show();

        $("input#form-direct_debit").removeClass('ignore');
        $("input#form-lump_sum").removeClass('ignore');
        $("input[name='form[tax_relief_option]']").removeClass('ignore');

        $("[name^='form[investment_choice_rs][']").each(function() {
            $(this).removeClass('ignore');
        });

        $("[name^='form[investment_choice_ls][']").each(function() {
            $(this).removeClass('ignore');
        });

    },

    updateVmpInvestment: function(data) {

        $('#payment-option-select').addClass('hide');
        $('#investment-select').addClass('hide');
        $('#investment-buttons').addClass('hide');

        investmentOptions70.showLumpSum();
        investmentOptions70.updateRsInvestmentDisplay();
        investmentOptions70.showTaxReliefOption();

        $(".ls-input").addClass('medium-4 large-4 small-12').removeClass('large-3 medium-3 small-6');
        $(".text-cell").addClass('medium-8 large-8').removeClass('large-5 medium-5');
        $(".remove").addClass('hidden');

        $(data.vmp_weightings).each(function(index, stockDetails) {

            var sedol = stockDetails.stock_details.sedol;

            if (!stockDocuments.hasOwnProperty(sedol)) {
                HL.Ajax.stockDocuments(sedol, function (status, docs) {

                    if (status == 1) {
                        $.each(docs, function (index, doc) {

                            investmentOptions70.addKiidLinks(sedol, doc);

                            // save for later so that we don't keep calling the API
                            stockDocuments[sedol] = docs;

                        });
                    }
                });
            } else {
                $.each(stockDocuments[sedol], function(index, doc) {
                    investmentOptions70.addKiidLinks(sedol, doc);
                });
            }

        });
    },

    addKiidLinks: function(sedol, doc) {

        if (doc.type == 'mutual_fund_factsheet_private') {
            var kiidUrl = doc.href;

            if (typeof(ipad) == "undefined") {
                $('#investment-details-' + sedol).html('<a target="_blank" href="' + kiidUrl + '">Key features</a>');
            } else {
                var ipadOpt = '<input type="button" value="Commission" class="button-blue button-small float-right" onclick="ipad.UI.open_commission_information(\'' + sedol +'\');">';
                ipadOpt += '<input type="button" value="KIID" class="button-blue button-small float-right" onclick="ipad.UI.open_kiid(\'' + sedol +'\');">';

                $('#investment-details-' + sedol).html(ipadOpt);
            }
        }
    }
};
