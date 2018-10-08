/**
 * HL InputHelper class
 *
 * @package     HL
 * @category    InputHelper
 */
HL.InputHelper = new function()
{
    /**
     * Format the number
     *
     * @var float number
     * @var float precision
     * @var float thousand_separator
     * @var string currency
     *
     * @return string
     */
    this.numberFormat = function(number, precision, thousand_separator, currency)
    {
        var formatted = '';
        var number_float = 0;

        // Default params init
        if (isNaN(precision)) {
            precision = 2;
        }

        if (!thousand_separator) {
            thousand_separator = ',';
        }

        number_float = this.parseAmount(number, false, thousand_separator, currency);

        if (!isNaN(number_float)) {
            formatted += number_float.toFixed(precision).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
        }

        if (currency) {
            formatted = currency + ' ' + formatted;
        }

        return formatted;
    }

    /**
     * Parsing the amount from the string
     *
     * @var string value
     * @var boolean parse_NAN
     * @var float thousand_separator
     * @var string currency
     *
     * @return int
     */
    this.parseAmount = function(number, parse_NAN, thousand_separator, currency)
    {
        var amount = 0;

        // Default params init
        if (typeof(parse_NAN) == 'undefined') {
            parse_NAN = true;
        }

        if (!currency) {
            currency = '£';
        }

        if (!thousand_separator) {
            thousand_separator = ',';
        }

        if (typeof(number) == 'number') { // Number is already a number
            amount = number;
        } else { // Remove thousand separator to help the parsing correctly
            if (number != null) {
                amount = parseFloat(number.replace(thousand_separator, '').replace(currency, ''));
            }
        }

        if (parse_NAN == true && isNaN(amount)) {
            amount = 0;
        }

        return amount;
    }

    /**
     * Handle the amount input typing and masking
     *
     * @param string selector
     *
     * @return void
     */
    this.amount = function(selector)
    {
        var self = this;

        $(selector)
            .on('change', function() {
                var formatted = self.numberFormat($(this).val());
                $(this).val(formatted);
            })
            .on('keyup', function(event) {

                var formatted;

                if($(this).val().length <= 5) {
                    formatted = $(this).val().replace(',', '');
                    formatted = formatted.replace(/(\d)(?=(\d{3})+)/g, '$1,');
                    $(this).val(formatted);
                }
                // If 6 characters and back space isn't pressed
                else if($(this).val().length == 6 && event.keyCode != 8) {
                    formatted = $(this).val().replace(',', '');
                    formatted = formatted.replace(/(\d{2})(?=(\d{3})+)/g, '$1,');

                    $(this).val(formatted);
                }

            })
            .on('focus', function() {
                $(this).siblings('.input-group-label').addClass('focus');
            })
            .on('blur', function() {
                $(this).siblings('.input-group-label').removeClass('focus notempty');

                if ($(this).val()) {
                    $(this).siblings('.input-group-label').addClass('notempty');
                } else {
                    $(this).siblings('.input-group-label').removeClass('notempty');
                }
            });
    }
}