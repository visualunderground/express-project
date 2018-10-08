/**
 * Partials for investment choice form elements, like validator rules, form handlers, masks, etc...
 */

var stockDocuments = [];
var InvestmentChoice = new function()
{
    var self = this;

    this.initInputHandlers = function()
    {

    }();

    /**
     * Add share/fund/IPO selector to the DOM
     *
     * @param type string    share, fund or ipo
     *
     * @return boolean Always false to avoid the validation on button click
     */
    this.add = function(type)
    {
        var html = '';

        if (typeof(ipad) == "undefined") {
            colspan = colspan+1;
        }

        var data = {
            lsAllowed : lsAllowed,
            rsAllowed : rsAllowed,
            colspan   : colspan,
            selection : shareList,
            fundManagers : fundManagers
        };

        switch (type) {
            case 'share':
                html = templates.investment_choice.add_share(data);
                break;

            case 'ipo':
                html = templates.investment_choice.add_ipo(data);
                break;

            case 'fund':
                html = templates.investment_choice.add_fund(data);
                break;
        }

        $('#select-investment-wrapper').html(html).show();

        // Do not validate on button click
        return false;
    };

    /**
     * Remove the selected fund/share/ipo
     *
     * @param rowID integer     The row ID
     *
     * @return boolean Always false to avoid the on click
     */
    this.remove = function(rowID)
    {
        $('#investment-choice-row-' + rowID).remove();
        $('#error-container-investment_choice_rs_' + rowID).remove();
        $('#error-container-investment_choice_ls_' + rowID).remove();

        if ($("[id^='investment-choice-row-']").length >= 10) {
            $("#investment-buttons").addClass('hide');
        } else {
            $("#investment-buttons").removeClass('hide');
        }

        ApplicationForm.InvestmentOptions.calculateCashAmounts();
    };

    /**
     * Select the investment
     *
     * @param selectorID string
     * @param element object
     * @param type string
     * @param ipad bool
     *
     * @return boolean Added the investment row
     */
    this.select = function(selectorID, element, type)
    {
        var data = {
            id        : selectorID,
            type      : type,
            name      : element.text(),
            lsAllowed : lsAllowed,
            rsAllowed : rsAllowed
        };

        // Client is selected an empty value (like the Please select...)
        if (data.id == '') {
            return false;
        }

        // Is the investment already added?
        if ($('#investment-choice-row-' + data.id).length > 0) {
            $('span', '#duplicate-investment-alert').text(data.name);

            if (typeof(ipad) != 'undefined') {
                ipad.UI.ModalWindow.open_by_id('duplicate-investment-alert');
            } else {
                $('#duplicate-investment-alert').foundation('open');
            }

            return false;
        }

        if (typeof(ipad) != "undefined") {
            data.ipad = 1;
        }

        data.monthlyMin = monthlyMin;

        if (type == 'fund') {
            data.fundInvestMin = fundInvestmentMin;

            // Append fund managers name before the fund selected
            if (typeof(ipad) != "undefined") {
                data.name = $("#fund-manager").text() +' '+ data.name;
            }
        }

        var html = templates.investment_choice.investment_row(data);

        if (data.ipad) {
            html = templates.investment_choice.investment_row_ipad(data);
        }

        $(html).insertBefore('#select-investment-wrapper');


        if ($("[id^='investment-choice-row-']").length >= 10) {
            $("#investment-buttons").addClass('hide');
        } else {
            $("#investment-buttons").removeClass('hide');
        }

        this.removeSelector();

        if (type == 'fund') {
            if (!stockDocuments.hasOwnProperty(selectorID)) {
                HL.Ajax.stockDocuments(selectorID, function (status, docs) {

                    if (status == 1) {
                        $.each(docs, function (index, doc) {

                            self.addKiidLink(doc, selectorID);

                            // save for later so that we don't keep calling the API

                            stockDocuments[selectorID] = docs;

                        });
                    }
                });
            } else {
                $.each(stockDocuments[selectorID], function(index, doc) {
                    self.addKiidLink(doc, selectorID);
                });
            }
        }

        $('#application-form').validate();

        var selector = $("input[name='form[investment_choice_rs][" + selectorID + "]']");

        if ($(selector).length > 0) {
            $(selector).rules('add', {
                min: monthlyMin,
                numeric: true,
                investmentChoiceAmount: true
            });

            HL.InputHelper.amount(selector);
        }

        var lumpMin = 0;

        if (type == 'fund') {
            lumpMin = fundInvestmentMin;
        }

        selector = $("input[name='form[investment_choice_ls][" + selectorID + "]']");

        if ($(selector).length > 0) {
            $(selector).rules('add', {
                min: lumpMin,
                numeric: true,
                investmentChoiceAmount: true
            });

            HL.InputHelper.amount(selector);
        }

        return true;
    };

    /**
     * Select the fund manager
     *
     * @param selectorID {string}
     *
     * @return void
     */
    this.selectFundManager = function(selectorID) {
        var element = $('#' + selectorID + ' option:selected');

        var fundManager = {
            id: element.val(),
            name: element.html()
        };

        // Get the funds for the fund manager from AJAX

        var funds = [];

        HL.Ajax.getFundsForManager(fundManager.id, function(status, data) {

            if (status == 1) {

                $('#select-investment-fund option:not(:first-child)').remove();

                $.each(data, function (index, data) {

                    var sedol       = data.sedol;
                    var title       = data.title;
                    var description = data.description;

                    funds[index] = {
                        id: sedol,
                        name: title + ' - ' + description
                    }

                    $('#select-investment-fund')
                        .append('<option value="' + sedol + '">' + title + ' - ' + description + '</option>');
                });

                // Display the selector wrapper
                $('#select-investment-fund-wrapper').show();
            }
        });
    };

    /**
     * Get the KIID document link for funds.
     *
     * @param doc {object}
     * @param sedol {string}
     */
    this.addKiidLink = function(doc, sedol)
    {
        if (doc.type == 'mutual_fund_kiid' || doc.type == 'mutual_fund_simplified_prospectus') {
            var kiidUrl = doc.href;

            if (typeof(ipad) == "undefined") {
                $('#investment-details-' + sedol).html('<br><small><a href="' + kiidUrl + '">View KIID</a></small>');
            } else {
                var ipadOpt = '<input type="button" value="Commission" class="button-blue button-small float-right" onclick="ipad.UI.open_commission_information(\'' + sedol +'\');">';
                ipadOpt += '<input type="button" value="KIID" class="button-blue button-small float-right" onclick="ipad.UI.open_kiid(\'' + sedol +'\');">';

                $('#investment-details-' + sedol).html(ipadOpt);
            }
        }
    };

    /**
     * Add share/fund/IPO selector to the DOM
     *
     * @return boolean Always false to avoid the on click
     */
    this.removeSelector = function()
    {
        $('#select-investment-wrapper').html('').hide();
    };
};