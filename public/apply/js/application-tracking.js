/**
 * Application trakcing for Adobe Analytics
 *
 * May need to be re-worked in the future as we
 * bring in the other application forms.
 *
 */

/**
 * One time tracking events - fire on page load
 */

trackingobj = {
    "content_type":"My accounts and dealing",
    "content_name":"maad",
    "user_site":"trading"
};

trackingobj.form_description = "account-open|" + formData.product;

switch(formData.pageRef) {
    case 'personal-details':        
        /**
         * Track money launder failures
         */
        if ($('.ml-fail-notify').length > 0) {
            trackingobj.form_description = "account-open|" + formData.product;
            trackingobj.form_action = "on-app-fail";
        } else {
			trackingobj.form_action = "on-person-1";
		}
        
        break;
    case 'investment-options':
        trackingobj.form_action = 'on-investment-options';
        break;
    case 'open-account':
        trackingobj.form_action = 'on-payment-options';
        break;
    case 'account-options':

        if (formData.paymentAmount > 0 && formData.monthlyAmount > 0) {
            trackingobj.form_action = "on-complete-monthly_lump";
            trackingobj.form_lump_value = formData.paymentAmount;
            trackingobj.form_monthly_value = formData.monthlyAmount;
        } else {

            if (formData.paymentAmount > 0) {
                trackingobj.form_action = "on-complete-lump";
                trackingobj.form_lump_value = formData.paymentAmount;
            }

            if (formData.monthlyAmount > 0) {
                trackingobj.form_action = "on-complete-monthly";
                trackingobj.form_monthly_value = formData.monthlyAmount;
            }
        }

        if (formData.investmentList == false) {
            trackingobj.app_trade_none = true;
            trackingobj.app_ls_trade_value = 0;
        } else {
            trackingobj.app_trade = formData.investmentList;
            trackingobj.app_ls_trade_value = formData.totalInvestmentAmount;
        }

        if ($.isEmptyObject(formData.investmentOptionsChoices)) {
            trackingobj.app_trade_none = true;
            trackingobj.app_ls_trade_value = 0;
            trackingobj.app_rs_trade_value = 0;
        } else {

            var ls_trade_total = 0;
            var rs_trade_total = 0;
            var descList = '';
            var sedolList = '';

            var objectLength = 0;
            var i;

            for (i in formData.investmentOptionsChoices) {
                if (formData.investmentOptionsChoices.hasOwnProperty(i)) {
                    objectLength++;
                }
            }

            var loopCount = 1;

            $.each(formData.investmentOptionsChoices, function(index, tradeDetails) {
                descList += tradeDetails.title + ' - ' + tradeDetails.description;
                sedolList += index;

                if (loopCount < objectLength) {
                    descList += '|';
                    sedolList += '|';
                }

                ls_trade_total += parseFloat(tradeDetails.ls);
                rs_trade_total += parseFloat(tradeDetails.rs);

                loopCount++;
            });

            if (!rs_trade_total) {
                rs_trade_total = 0;
            }

            if (!ls_trade_total) {
                ls_trade_total = 0;
            }

            trackingobj.app_trade = descList;
            trackingobj.app_trade_sedols = sedolList;

            trackingobj.app_ls_trade_value = ls_trade_total;
            trackingobj.app_rs_trade_value = rs_trade_total;
        }

        break;
    case 'application-complete':
        trackingobj.form_action = "on-app-complete";
        break;
}

$(document).ready(function() {
    /**
     * Fieldset tracking - fire once on first click
     * in fieldset. Does not fire again thereafter
     */

    var PersonalDetailsClicked = false;
    var personalDetailsSelector =
        $(
            '[name="form[title]"],' +
            '#form_forename,' +
            '#form_surname,' +
            '#form_date_of_birth,' +
            '#form_nino,' +
            '#form_email,' +
            '#form_phone_number,' +
            '#form_house_number,' +
            '#form_postcode'
        );
    personalDetailsSelector.focus(function () {
        if (!PersonalDetailsClicked) {
            if (typeof(scto) != 'undefined') {
                scto.adv_trackevent('form', 'engage', 'details');
            }
            PersonalDetailsClicked = true;
        }
    });

    $('[name="form[title]"], #form_no_nino').click(function () {
        if (!PersonalDetailsClicked) {
            if (typeof(scto) != 'undefined') {
                scto.adv_trackevent('form', 'engage', 'details');
            }
            PersonalDetailsClicked = true;
        }
    });


    var paymentDetailsClicked = false;
    var paymentDetailsSelector = $(
        '[name="form[card_type]"],' +
        '#form_amount,' +
        '#form_card_number,' +
        '#form_expiry_date,' +
        '#form_card_name,' +
        '#form_security_code'
    );

    paymentDetailsSelector.focus(function () {
        if (!paymentDetailsClicked) {
            if (typeof(scto) != 'undefined') {
                scto.adv_trackevent('form', 'engage', 'payment');
            }
            paymentDetailsClicked = true;
        }
    });

    $('[name="form[card_type]"]').click(function () {
        if (!paymentDetailsClicked) {
            if (typeof(scto) != 'undefined') {
                scto.adv_trackevent('form', 'engage', 'payment');
            }
            paymentDetailsClicked = true;
        }
    });

    var onlineAccessClicked = false;
    var onlineAccessSelector =
        $(
            '#form_username,' +
            '#form_online_password,' +
            '#form_confirm_online_password,' +
            '#form_secure_number,' +
            '#form_confirm_secure_number,' +
            '#form_security_question_one,' +
            '#form_security_answer_one,' +
            '#form_security_question_two,' +
            '#form_security_answer_two,' +
            '#form_security_question_three,' +
            '#form_security_answer_three'
        );
    onlineAccessSelector.focus(function () {
        if (!onlineAccessClicked) {
            if (typeof(scto) != 'undefined') {
                scto.adv_trackevent('form', 'engage', 'onlineAccess');
            }
            onlineAccessClicked = true;
        }
    });

    var nbaClicked = false;
    var nbaSelector =
        $(
            '#form_bank_account_name,' +
            '#form_account_number,' +
            '#form_sort_code,' +
            '#form_building_society_ref'
        );
    nbaSelector.focus(function () {

        if (formData.pageRef == 'account-options') {
            if (!nbaClicked) {
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('form', 'engage', 'nba');
                }
                nbaClicked = true;
            }
        } else {
            if (!nbaClicked) {
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('form', 'engage', 'payment');
                }
                nbaClicked = true;
            }
        }
    });

    var paymentMethodClicked = false;
    var paymentSelector =
        $(
            '[name="form[add_cash_options]"],' +
            '#form-lump_sum,' +
            '#form-direct_debit'
        );
    paymentSelector.focus(function () {
        if (!paymentMethodClicked) {
            if (typeof(scto) != 'undefined') {
                scto.adv_trackevent('form', 'engage', 'paymentType');
            }
            paymentMethodClicked = true;
        }
    });

    $('[name="form[add_cash_options]"]').click(function () {
        if (!paymentMethodClicked) {
            if (typeof(scto) != 'undefined') {
                scto.adv_trackevent('form', 'engage', 'paymentType');
            }
            paymentMethodClicked = true;
        }
    });

    var investmentOptionClicked = false;
    var investmentSelector =
        $(
            '[name="form[investments_now_choice]"],' +
            '[name^="form[investment_choice_ls]["],' +
            '[name^="form[investment_choice_rs]["],' +
            '#add-share-button,' +
            '#add-fund-button'
        );
    investmentSelector.click(function () {
        if (!investmentOptionClicked) {
            if (typeof(scto) != 'undefined') {
                scto.adv_trackevent('form', 'engage', 'investmentOptions');
            }
            investmentOptionClicked = true;
        }
    });


    $("select, input").blur(function() {

        var input = this;
        var field;
        var fieldName;
        var fieldContents;

        fieldName = input.id.replace('form_', '');
        field = $('#form_'+fieldName+'-error');
        fieldContents = field.text();

        if (field.is(":visible") && fieldContents) {
            if (typeof(scto) != 'undefined') {
                scto.adv_trackevent('error', 'account-error', formData.product + '|' + fieldContents);
            }
        }
    });

    /**
     * Input field tracking - fire on focus/click to form
     * field
     */

    $("label[for^='title-option'], label[data-toggle='title-dropdown']").click(function() {

        if (typeof(scto) != 'undefined') {
            scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Personal details|Title')
        }
    });

    $("label[for^='form_card_type']").click(function() {
        if (typeof(scto) != 'undefined') {
            scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Payment details|Card type')
        }
    });

    $("#address-not-found-link").click(function() {
        if (typeof(scto) != 'undefined') {
            scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Personal details|Address not found')
        }
    });

    $("#view-illustration").click(function() {
        if (typeof(scto) != 'undefined') {
            scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Open account|View illustration')
        }
    });

    $("#change-investments").click(function() {
        if (typeof(scto) != 'undefined') {
            scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Open account|Change investments')
        }
    });

    $("input, select").focus(function() {

        switch (this.name) {

            case 'form[forename]':
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Personal details|Forename')
                }
                break;
            case 'form[surname]':
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Personal details|Surname')
                }
                break;
            case 'form[marital_status]':
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Personal details|Martial status')
                }
                break;
            case 'form[date_of_birth]':
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Personal details|Date of birth')
                }
                break;
            case 'form[nino]':
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Personal details|NI number')
                }
                break;
            case 'form[no_nino]':
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Personal details|no NI number')
                }
                break;
            case 'form[employment_status]':
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Personal details|Employment status')
                }
                break;
            case 'form[retirement_age]':
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Personal details|Retirement age')
                }
                break;
            case 'form[nationality]':
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Personal details|Nationality')
                }
                break;
            case 'form[house_number]':
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Personal details|House number or name')
                }
                break;
            case 'form[postcode]':
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Personal details|Postcode')
                }
                break;
            case 'form[email]':
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Personal details|Email')
                }
                break;
            case 'form[phone_number]':
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Personal details|Phone number')
                }
                break;

            case 'form[amount]':
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Payment details|Amount')
                }
                break;
            case 'form[card_number]':
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Payment details|Card number')
                }
                break;
            case 'form[card_name]':
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Payment details|Name on card')
                }
                break;
            case 'form[expiry_date]':
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Payment details|Expiry date')
                }
                break;
            case 'form[security_code]':
                if (typeof(scto) != 'undefined') {
                    scto.adv_trackevent('content', 'internal', 'account|' + formData.product + '|Payment details|Security code')
                }
                break;
        }
    });
});