/**
 * HL UI class
 *
 * @package     HL
 * @category    UI
 */
HL.UI = new function()
{
    /**
     * UI init with init the common classes and plugins
     *
     * @return void
     */
    this.init = function()
    {

        // IE specific stylesheet
        if ($.browser.msie) {
            $('<link/>')
                .attr('rel', 'stylesheet')
                .attr('type', 'text/css')
                .attr('href', '/apply/css/main-ie.css')
                .appendTo('html');
        }

        $(function() {

            // Foundation init
            $(document).foundation();

            // Selector group init
            $('.selector-group').selectorGroup();

            // Amount input formatting
            HL.InputHelper.amount('input[data-role=amount]');

            // Default scrollTo settings
            $.extend($.scrollTo.defaults, {
                axis: 'y',
                duration: 500,
                offset: -100
            });

        });
    }

    /**
     * Check that the element is visible on screen
     *
     * @param object jQuery element
     *
     * @return boolean
     */
    this.isScrolledIntoView = function(elem)
    {
        var $elem = $(elem);
        var $window = $(window);

        var docViewTop = $window.scrollTop();
        var docViewBottom = docViewTop + $window.height();

        var elemTop = $elem.offset().top;
        var elemBottom = elemTop + $elem.height();

        return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
    }

    // Auto init
    this.init();
}