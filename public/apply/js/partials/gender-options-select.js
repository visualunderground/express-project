/**
 * Partials for gender option selection
 */

$( "button#application-submit-button" ).on( "click", function() {

    var checkExist = setInterval(function() {
        if ($('#form\\[gender\\]-error').length) {
            var el = $('#form\\[gender\\]-error');
            el.detach().appendTo($("#form_gender"));
            clearInterval(checkExist);
        }

    }, 100); // check every 100ms

});
