/**
 * HL FormHandler class
 *
 * @package     HL
 * @category    FormHandler
 *
 * @require jQuery ScrollTo plugin
 */
HL.FormHandler = new function()
{
    /**
     * Init the function
     */
    this.init = function()
    {
        $(function() {

            $('input').focus(function() {

                var id = $(this).attr('id');
                var errorElement = $('#' + id + '-error');
                var $body = $('body');

                // Scroll to the related error message if it's not visible on the screen
                if (errorElement.length === 1 && !HL.UI.isScrolledIntoView(errorElement)) {

                    $body.animate({
                        scrollTop: $body.scrollTop() + 100
                    }, 400);

                }

            });

        })
    };


    /**
     * Raise all input errors from a provided list to the top of the form
     *
     * @param errorMessages message list
     *
     * @return void
     */
    this.raiseFormTopErrorsByList = function(errorMessages)
    {
        // Scroll to top
        $('body').scrollTo(0);

        var msgs = JSON.parse(errorMessages);
        var fieldName;

        if (msgs != 'undefined') {

            var errorHtml = '';

            // Build the error list
            for (var key in msgs) {

                errorHtml += this.buildHtmlErrorMessage(key, msgs[key]);

            }

            this.displayFormTopError(formID, errorHtml, 'server');

        } else {

            // No errors -> Hide the whole wrapper container
            $('.form-top-errors', '#' + formID).hide();

        }
    };



    /**
     * Raise all input errors at the top of the form
     *
     * @param formID string
     * @param validator object
     *
     * @return void
     */
    this.raiseFormTopErrors = function(formID, validator)
    {
        // Scroll to top
        $('body').scrollTo(0);

        if (validator.numberOfInvalids() > 0) {

            var errorHtml = '';

            // Build the error list
            for (var index in validator.errorList) {

                var error = validator.errorList[index];

                errorHtml += this.buildHtmlErrorMessage(error.element.name, error.message);

            }

            this.displayFormTopError(formID, errorHtml);

        } else {

            // No errors -> Hide the whole wrapper container
            $('.form-top-errors', '#' + formID).hide();

        }
    };

    /**
     * Raise the form top error in a single call by the field name
     *
     * @param formID string
     * @param fieldName string
     * @param errorMessage string
     *
     * @return boolean
     */
    this.raiseFormTopErrorByName = function(formID, fieldName, errorMessage)
    {
        var validatorMessage = '';

        if (typeof(errorMessage) == 'undefined') {
            validatorMessage = validatorMessages[fieldName];
        } else {
            validatorMessage = errorMessage;
        }

        var errorHtml = this.buildHtmlErrorMessage(fieldName, validatorMessage);

        this.displayFormTopError(formID, errorHtml);
    };

    /**
     * Get the field name and build the HTML based error message with a jump to element link
     *
     * @param fieldName string
     * @param validatorMessage string
     *
     * @return string
     */
    this.buildHtmlErrorMessage = function(fieldName, validatorMessage)
    {
        var jumpToError = '';
        var errorHtml = '';

        var element = $("[name='" + fieldName + "']")[0];

        if ($('label[for=' + element.id + ']').length) {

            // Scroll to the label as a default
            jumpToError += '$(\'body\').scrollTo(\'label[for=' + element.id + ']\');';

        } else if ($('input#' + element.id).length && element.id.indexOf('form-investment-') == -1) {

            // Scroll to the element (if label is missing)
            jumpToError += '$(\'body\').scrollTo(\'input#' + element.id + '\');';

        } else if(element.id.indexOf('form-investment-') > -1) {

            if(element.id == 'form-investment-input-total'){

                // Scroll to the investment's table total
                jumpToError += '$(\'body\').scrollTo(\'#form-investment-input-total-error-row' + '\');';

            } else {

                // Scroll to the investment's table row
                jumpToError += '$(\'body\').scrollTo(\'#form-investment-row' + element.id.slice(-1) + '\');';

            }

        }

        // Focus after jumping
        if (element.type != 'radio' && element.type != 'checkbox') {
            jumpToError += '$(\'input#' + element.id + '\').focus();';
        }

        var filteredValidatorMessage = validatorMessage
            .replace('{label}', '<a href="javascript:;" onclick="' + jumpToError + '">')
            .replace('{/label}', '</a>');

        errorHtml += '<li id="top-error-' + fieldName + '">' + filteredValidatorMessage + '</li>';

        return errorHtml;
    };

    /**
     * Build and display the form's top error
     *
     * @param formID string
     * @param errorHtml string
     *
     * @param errorType string
     * @return void
     */
    this.displayFormTopError = function(formID, errorHtml, errorType)
    {
        if (errorHtml) { // Build and display the errors

            if(errorType == undefined) {

                $('.form-top-errors', '#' + formID)
                    .show()
                    .find('#client-error').html(errorHtml);

            } else if (errorType == 'server') {

                $('.form-top-errors', '#' + formID)
                    .show()
                    .find('#server-error').html(errorHtml);

            }

        } else {

            // No errors -> Hide the whole wrapper container
            $('.form-top-errors', '#' + formID).hide();

        }
    };

    /**
     * Remove the related error from the top error container
     *
     * @param formID string
     * @param fieldKey The field name or id - string
     *
     * @return void
     */
    this.removeFormTopError = function(formID, fieldKey)
    {
        var fieldName = '';

        var fieldKeyEscaped = fieldKey.replace('[', '\\[').replace(']', '\\]');

        // Top error list is identified by the field name -> Get it when passed the ID
        if ($('#' + fieldKeyEscaped).length) {
            fieldName = $('#' + fieldKeyEscaped).attr('name');
        } else {
            fieldName = fieldKey;
        }

        var fieldNameEscaped = fieldName.replace('[', '\\[').replace(']', '\\]');

        $('.form-top-errors li#top-error-' + fieldNameEscaped, '#' + formID).remove();

        // Hide the top errors container after removed the last error
        if ($('.form-top-errors li').length <= 0) {
            $('.form-top-errors', '#' + formID).hide();
        }
    };

    /**
     * Remove the unnecessary space holders
     *
     * @param errorList object
     *
     * @return void
     */
    this.removeSpaceholders = function(errorList)
    {
        // Remove the label spaceholders
        for (var index in errorList) {

            var error = errorList[index];

            error.message = error.message.replace('{label}', '').replace('{/label}', '');

        }
    };

    /**
     * Display the editable items for the given field group
     *
     * @param fieldGroupId string
     *
     * @return boolean Always false to prevent the link action
     */
    this.editFields = function(fieldGroupId)
    {
        $('#prepopulated-fields-for-' + fieldGroupId).hide();
        $('#editable-fields-for-' + fieldGroupId).show();
    };

    // Auto init
    this.init();
};
