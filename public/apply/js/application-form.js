/**
 * Application form class with commonly using functions and handlers
 */
ApplicationForm = new function()
{
    /**
     * Stores the validator object
     *
     * @var object
     */
    this.validator = HL.Validation;

    /**
     * Stores the validator object
     *
     * @var object
     */
    this.formHandler = HL.FormHandler;

    /**
     * Supported card types
     *
     * @var object array
     */
    this.supportedCardTypes = ['delta', 'maestro', 'mastercard'];

    /**
     * Maximum lump sum investment value
     *
     * @var int
     */
    this.maxAmount = 99999;

    /**
     * Auto recognised card type
     *
     * @var boolean
     */
    this.autoRecognised = false;

    /**
     * Auto select card type
     *
     * @var boolean
     */
    this.autoSelectCard = false;

    /**
     * Products allowed to transfer.
     *
     * @todo look into alt way of defining this
     * @type {array}
     */
    this.allowedTransferProducts = [92, 98];

    /**
     * Locale options for on-screen number formatting.
     *
     * @type {{minimumFractionDigits: number}}
     */
    this.localeOptions = {minimumFractionDigits: 2};

    /**
     * Init the common inputs
     *
     * @return void
     */
    this.initFormInputs = function()
    {
        // Mask default setting in application form scope
        $.mask.autoclear = false;

        var date = new Date();

        // Modern touch devices implemented correctly the HTML date inputs
        if (Modernizr.touch) {

            $('input[html5_type=date], input[html5_type=month]').each(function() {

                // Update the input type to the correct one
                var input_type = $(this).attr('html5_type');

                $(this).attr('type', input_type);

                // Input tip is confusing from now, remove it
                $('#input-tip-' + $(this).attr('id').replace('form_', '')).remove();

            });

        } else { // Mask the date inputs for desktop browser

            $('input[html5_type=date], input[html5_type=month]').each(function() {

                var mask = '';

                switch ($(this).attr('placeholder')) {
                    case 'dd/mm/yyyy':
                        mask = '99/99/9999';
                        break;
                    case 'mm/yyyy':
                        mask = '99/9999';
                        break;
                    case 'mm/yy':
                        mask = '99/99';
                        break;
                }

                if (mask) {
                    $(this).mask(mask, { placeholder : ' ' });
                }

            });

        }

        // Check if on POST back error(s) exist
        if(formData.appStatus == 'error' && typeof formData.error === 'object'){

            // Instantly re-validate the form to show the previous validation status
            $("#" + formID).valid();

            // Re-bind the FormTopError call
            $("#" + formID).bind(

                'invalid-form.validate',

                function(event, validator) {
                    ApplicationForm.formHandler.raiseFormTopErrors(formID, validator);
                }

            );

            // Re-assign card icon to previously selected card type
            $('input[id^=form_card_type_]').each(function() {

                var curInputId = $(this).attr('id');
                var cardType = $(this).attr('id').replace('form_card_type_', '');
                var checked = $(this).attr('checked');

                if (checked == 'checked'){

                    $('label[for=' + curInputId + ']').attr('class', cardType);

                } else {

                    $('label[for=' + curInputId + ']').attr('class', cardType + '-inactive');

                }

            });
        }

    }

    /**
     * Init the card type selector on the form
     *
     * @return void
     */
    this.initCardTypeSelector = function()
    {
        var self = this;

        // Change card type icons on click
        $('input[id^=form_card_type_]').click(function(){

            var clickedItemId = $(this).attr('id');

            $('input[id^=form_card_type_]').each(function() {

                var curInputId = $(this).attr('id');
                var cardType = $(this).attr('id').replace('form_card_type_', '');

                if(clickedItemId == curInputId) {

                    $('label[for=' + curInputId + ']').attr('class', cardType);

                } else {

                    $('label[for=' + curInputId + ']').attr('class', cardType + '-inactive');

                }

            });

        });

        if (self.autoSelectCard) {
            // Automatic card type selector
            $('#form_card_number').bind('keypress paste', function () {

                $(this).validateCreditCard(function (result) {

                    var card_type = '';
                    var card_type_show = true;

                    if (result.card_type !== null) {
                        card_type = result.card_type.name;
                    }

                    // Handle the visa as delta
                    if (card_type == 'visa') {
                        card_type = 'delta';
                    }


                    if (card_type !== '' && $('#form_card_type_' + card_type).length) { // Recognised and supported

                        self.autoRecognised = true;

                        // Select the right card type
                        if (typeof(ipad) == "undefined") {
                            $('#form_card_type_' + card_type).click();
                        } else {
                            $('#cardType').val(card_type);
                        }

                    } else if (card_type !== '') { // Recognised, but not supported

                        card_type_show = false;

                    } else { // Unknown card type

                        self.autoRecognised = false;

                        self.cardTypeSelector('');

                    }

                    if (card_type_show) {
                        $('#card-type-row').show();
                    } else {
                        $('#card-type-row').hide();
                    }

                });

            });
        }

        // Card type selector
        $('input[name=form\\[card_type\\]]').click(function(e) {
            self.cardTypeSelector(e.target.value);
        });

    }

    /**
     * Handle the card type selector with visual feedback
     *
     * @param string card_type visa, mastercard or mastercard
     *
     * @return void
     */
    this.cardTypeSelector = function(card_type)
    {
        var self = this;

        if ($.inArray(card_type, this.supportedCardTypes) > -1) { // Card type recognised

            $('input[id=form_card_type_' + card_type + ']').removeAttr('disabled');

            // Uncheck and disable all other options
            $('input[id^=form_card_type]:not([id=form_card_type_' + card_type + '])').each(function() {

                $(this).removeAttr('checked');

                // Disable other options
                if (self.autoRecognised) {
                    $(this).attr('disabled', 'disabled');
                }

            });

        } else { // Unknown card type

            // Reallow all options
            $('input[name=form\\[card_type\\]]')
                .removeAttr('disabled')
                .removeAttr('checked');

        }
    };

    /**
     * Get the current tax year to display.
     *
     * @returns {string}
     */
    this.currentTaxYear = function()
    {
        var now = new Date();

        var day   = now.getDate();
        var month = now.getMonth() + 1;
        var year  = now.getFullYear();

        var lastYear = year - 1;
        var nextYear = year + 1;

        lastYear = lastYear.toString();
        nextYear = nextYear.toString();

        year = year.toString();

        if (month >= 4 && day >= 6) {
            return year + '/' + nextYear.substring(2);
        }

        return lastYear + '/' + year.substring(2);
    };

    /**
     * Check if the user is accessing the form on a mobile device.
     *
     * @returns {boolean}
     */
    this.isMobileDevice = function()
    {
        var ua = navigator.userAgent;

        return (/android|iphone/i).test(ua);
    };

};
