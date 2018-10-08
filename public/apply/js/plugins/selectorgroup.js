/**
 * Searchable selector group
 *
 * Sample usage: $('.selector-group').selectorGroup();
 *
 * @require Foundation Dropdown plugin
 */
(function ($) {
    $.fn.selectorGroup = function () {
        var self = this;

        /**
         * Init the event handlers
         *
         * @return void
         */
        function init() {
            // Close the more list on click out
            $('body').click(function () {
                $.fn.selectorGroup.closeDropdown(self);
            });
        }

        /**
         * Handle the event when an input has selected
         *
         * @var jQueryObject checked_input
         *
         * @return void
         */
        function selectionHandler(checked_input) {

            // due to Silex being a pain, rename all label tags to remove spaces
            // this is for titles with multiple parts e.g. Squadron Leader
            $('#titles li').each(function(index, li) {
                var labelFor = $(li).find('label').attr('for');
                var newLabelFor = labelFor.replace(/ /g, '-');
                $(li).find('label').attr('for', newLabelFor);
            });

            var id = checked_input.attr('id');
            var value = checked_input.val();
            var standard = checked_input.attr('data-standard');
            var input_name = checked_input.attr('name');

            // Escape the brackets with two backslashes
            var escaped_input_name = checked_input.attr('name').replace('[', '\\[').replace(']', '\\]');

            // Hide the jQuery Validation error
            $('#' + escaped_input_name + '-error').hide();

            // Chosen an option from the more option list
            if (standard != 'true') {

                // Move the standard options to the more container
                $($('li.column:not(.more):not(.checked-value)', self).get().reverse()).each(function () {

                    $(this)
                        .clone(true, true)
                        .removeClass() // Remove all grid classes
                        .prependTo('.more-options .scrollable ul', self);

                    $(this).remove();

                });

                // Everything is in the scrollable list now, not required to differentiate the options
                $('.more-options .scrollable ul li input', self).removeAttr('data-standard');

                id = id.replace(/ /g, '-');

                // Display the selected option
                $('li.checked-value label', self).html($('label[for=' + id + ']', self).html()).parent().show();

                // now we need to put the spaces back so the selector can find the correct
                // ID if the user chooses a different one
                $('#titles li').each(function(index, li) {
                    var labelFor = $(li).find('label').attr('for');
                    var title = labelFor.replace('title-option-', '');
                    var labelWithSpace = title.replace(/-/g, ' ');
                    var newLabelFor = 'title-option-' + labelWithSpace;
                    $(li).find('label').attr('for', newLabelFor);
                });

                // Swap the more to edit
                $('.more .more-label').html('Edit');

            }

            HL.FormHandler.removeFormTopError(formID, input_name);

            // Close on select
            $.fn.selectorGroup.closeDropdown(self);
        }

        /**
         * Search in the available options
         *
         * @param string query
         *
         * @return void
         */
        function search(query) {
            var sort = false;

            // Allow only string type
            if (typeof(query) != 'string') {
                query = '';
            }

            // Walk through on labels to filter
            $('.more-options label', self).each(function () {

                // If no query added, all labels are matched
                var show = true;

                if (query) {

                    var label = $(this).html();

                    // Partial search
                    if (label.toLowerCase().indexOf(query.toLowerCase(), 1) === -1) {
                        show = false;
                    }
                }

                if (show) {
                    $(this).parent().show();
                } else {
                    $(this).parent().hide();
                    sort = true;
                }

            });

            if (sort) {
                sortList('titles', query);
            }

        }

        /**
         * Sort list items according to query
         *
         * @param ul string
         * @param query string
         */
        function sortList(ul, query) {

            if (typeof ul == "string") {
                ul = document.getElementById(ul);
            }

            var lis = ul.getElementsByTagName("LI");
            var labelValue;

            for (var i = 0, l = lis.length; i < l; i++) {

                if (typeof lis[i].getElementsByTagName('LABEL')[0] !== 'undefined') {

                    labelValue = lis[i].getElementsByTagName('LABEL')[0].innerHTML;

                    if (labelValue.toLowerCase().substring(0, query.length) == query.toLowerCase()) {
                        lis[i].removeAttribute("style");

                    } else {
                        lis[i].style.display = "none";
                    }
                }
            }

        }

        // Chainable
        return this.each(function () {

            // Do not close clicking on the more options container
            $('.more-options', $(this)).click(function (e) {
                e.stopPropagation();
            });

            // Trigger the checked handler
            $('input[type=radio]', $(this)).on('click', function () {
                selectionHandler($(this));
            });

            // Init the search input
            $('input[type=search]', $(this)).bind('keyup', function (e) {
                search($(this).val());
            });

            // Value is already checked
            var checked = $('input[type=radio]:checked', $(this));
            if (checked.length) {
                selectionHandler(checked);
            }

        });

        // Auto init
        init();

    }

    /**
     * Customisable dropdown closing - Using Foundation as a default
     *
     * @param context Close the related selector group's dropdown
     *
     * @return void
     */
    $.fn.selectorGroup.closeDropdown = function (context) {
        if ($('.more-options', context).length) {
            $('.more-options', context).foundation('close');
        }
    }

}(jQuery));