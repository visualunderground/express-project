/**
 * Internal transfer logic.
 */

var PortfolioPlus = new function()
{
    /**
     * Work out how mcuh cash the client is investing into each portfolio
     * based on the weights set in BF
     */
    this.updateVmpPercentage = function() {

        var investment_options = formData.formVars.application_details.investment_options;

        var investmentId = investment_options[0].id;

        $("input[name='form[investment_choice_ls][" + investmentId + "]']").on('keyup', function () {
            var inputValue = $(this).val().replace(/,/g, '');

            $(investment_options).each(function(index, data) {

                $(data.vmp_weightings).each(function(key, stockWeightings) {

                    var onePercent = parseFloat(stockWeightings.percentage) / 100;

                    var totalValueOfPercentage = onePercent * parseFloat(inputValue);

                    $('#vmp-perc-'+stockWeightings.stock_details.sedol).html(HL.InputHelper.numberFormat(totalValueOfPercentage));
                });
            });
        });
    };
};
