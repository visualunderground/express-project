/**
 * HL AddressFinder class
 *
 * @package     HL
 * @category    AddressFinder
 */
HL.AddressFinder = new function()
{
    /**
     * Init the class and the related inputs
     *
     * @return void
     */
    this.init = function()
    {
        var self = this;

        $(function() {
            // on load, if logged in, populate hidden address fields
            if (formData.pageRef == "personal-details" && formData.loggedIn) {

                var items;

                if (formData.clientDetails != null) {

                    items = {
                            address0: String(formData.clientDetails.address0) == "null" ? '' : self.parseEntities(String(formData.clientDetails.address0)),
                            address1: String(formData.clientDetails.address1) == "null" ? '' : self.parseEntities(String(formData.clientDetails.address1)),
                            address2: String(formData.clientDetails.address2) == "null" ? '' : self.parseEntities(String(formData.clientDetails.address2)),
                            address3: String(formData.clientDetails.address3) == "null" ? '' : self.parseEntities(String(formData.clientDetails.address3)),
                            address4: String(formData.clientDetails.address4) == "null" ? '' : self.parseEntities(String(formData.clientDetails.address4))
                    };

                    var data = {
                        address: items,
                        postcode: formData.clientDetails.postcode
                    };

                    $('#selected-address-display').html(templates.personal_details.address_display_readonly(data));
                }


            }

            // Find address button
            $('#form_find_address').click(function() {
                self.findAddress();
            });

            $('#form_postcode, #form_house_number')
                // Hide the existing results when typing a new post code or house number
                .keyup(function(e) {

                    // Pressing enter has a different function, see below
                    if (e.which !== 13) {
                        $('#address-finder').hide();
                    }

                })
                // Pressing enter search for the postcode instead of submitting the form
                .keypress(function(e) {

                    if (e.which == 13) {
                        $('#form_find_address').click();
                        e.preventDefault();
                        return false;

                    }

                })
            ;

        });
    }

    /**
     * Parses HTML entities into their literal equivilents
     * @param value The value to parse
     * @returns string The parsed value
     */
    this.parseEntities = function(value) {
        return $('<textarea></textarea>').html(value).text();
    }

    /**
     * Clicked on find address button
     *
     * @return boolean Found and displayed the addresses
     */
    this.findAddress = function()
    {
        var self = this;

        var validator = $('#' + formID).validate();

        // Try find it now
        $('#address-finder .not-found').hide();

        // Validate both postcode and house number
        var postcodeValid     = validator.element('#form_postcode');
        var houseNumberValid = validator.element('#form_house_number');

        if (!postcodeValid || !houseNumberValid) {
            return false;
        }

        var postcode = $('#form_postcode').val();
        var house = $('#form_house_number').val();

        // Display the main container
        $('#address-finder').show();

        // Hide the existing list
        $('#address-finder .list').hide();

        // Loading...
        $('#address-finder .loading').show();

        $.ajax({
            url: '/apply/account-application/account/'+ product +'/postcode/'+ postcode +'/house/' + house + '/find-address',
            dataType: 'json',
            success: function(data) {

                data.rs = data.details.results;

                if (data.details.results.length == 1) { // Only one address, select it automatically

                    var address = data.rs[0];

                    self.selectAddress(address.Picklist, address.Postcode, address.Moniker);

                } else if (data.rs.length > 1) { // Select address from the list

                    // Build the find address list
                    
                    if (typeof(ipad) != 'undefined') {
                        var address_list = '<option value="">Please select...</option>'; 
                    } else {
                        var address_list = '';    
                    }

                    $.each(data.rs, function(key, address) {

                        var escaped = {
                            address  : address.Picklist.replace(/'/g, "\\'").replace(/"/g, '&#34;'),
                            postcode : address.Postcode.replace(/'/g, "\\'").replace(/"/g, '&#34;'),
                            pict     : address.Moniker.replace(/'/g, "\\'").replace(/"/g, '&#34;')
                        };


                        if (typeof(ipad) != 'undefined') {

                            address_list +=
                                '<option value="' + escaped.address + '? ' + escaped.postcode + '? ' + escaped.pict + '">' +
                                    address.Picklist 
                                '</option>';
                        } else {
                            address_list +=
                                '<li onclick="HL.AddressFinder.selectAddress(\'' + escaped.address + '\', \'' + escaped.postcode + '\', \'' + escaped.pict + '\');">' +
                                    address.Picklist +
                                    ' <strong>' + address.Postcode + '</strong>' +
                                '</li>';
                        }

                    });

                    // Display the list

                    if (typeof(ipad) != 'undefined') {
                        $('#address-finder .list').show()
                            .find('.list-scrollable select').html(address_list);
                    } else {
                        $('#address-finder .list').show()
                            .find('.list-scrollable ul').html(address_list);
                    }

                    // Scroll to the list
                    $('body').animate({
                        scrollTop: $('#lookup-address-form').offset().top - 50
                    }, 400);

                } else { // Error

                    self.addressNotFound();

                }

            },
            error: function() {
                self.addressNotFound();
            },
            complete: function() {
                $('#address-finder .loading').hide();
            }
        });
    }

    /**
     * Select the address for ipad view
     * This will internally call selectAddress()
     * Which will show the selected address
     */ 
    this.selectAddressOnChange = function()
    {
        if ($('#lookup-addresslist').val()) {

            var address, postcode, pict;

            var addressDetails = $('#lookup-addresslist').val();

            var elems = $.map($('#lookup-addresslist').val().split('?'), $.trim);

            // extract required params
            address = typeof(elems[0] != 'undefined') ? elems[0]  : '';
            postcode = typeof(elems[1] != 'undefined') ? elems[1]  : '';
            pict = typeof(elems[2] != 'undefined') ? elems[2]  : '';

            this.selectAddress(address, postcode, pict);
        }
    }

    /**
     * Select the address from the list
     *
     * @param string address Comma separated address parts
     * @param string postcode
     *
     * @return boolean
     */
    this.selectAddress = function(address, postcode, pict) {
        var items = address.split(',');

        items = items.map(function(item) {return item.trim();});
        items = items.filter(function(e){return e != '';});

        var numRowsToCombine = Math.floor(items.length - 5);
        var address = [];
        address.push(items.shift())

        while (numRowsToCombine > 0 && items.length > 1) {
            address.push(items.shift() + ', ' + items.shift());
            numRowsToCombine--;
        }

        while (items.length > 0) {
            address.push(items.shift());
        }

        var data = {
            address: address,
            postcode: postcode
        };

        // populate handlebars template
        $('#selected-address-display').html(templates.personal_details.address_display(data));

        $('#lookup-address-form').hide();
        $('#selected-address-display').show();

        $('#form_address_pict').val(pict);

        // Revalidate the selected address to hide the related error messages
        var validator = $('#' + formID).validate();

        validator.element('#form_address_pict');
    }

    /**
     * Display the form again for searching an address
     *
     * @return void
     */
    this.editAddress = function()
    {
        $('#selected-address-display').hide();
        $('#lookup-address-form').show();
        $('#address-finder').hide();
        $('#button-cancel-address-change').show();

        // Remove the address parts, otherwise they will be validated
        $('#selected-address-display input[id^=form_address]').remove();
    }


    /**
     * Cancel Address change and bring the already selected address
     *
     * @return void
     */
    this.finish_address_change = function()
    {
        $('#button-cancel-address-change, #lookup-address-form').hide();
        $('#selected-address-display').show();
    }

    /**
     * Address not found handler
     *
     * @return void
     */
    this.addressNotFound = function()
    {
        $('#address-finder .list').hide();
        $('#address-finder .not-found').show();
    }

    /**
     * Checks that a valid address is selected. Can be used for on form submit
     *
     * @return boolean
     */
    this.onsubmit = function()
    {
        // Check that client selected the address after given a valid house number and postcode

        var validator = $('#' + formID).validate();

        var postcodeValid     = validator.element('#form_postcode');
        var houseNumberValid = validator.element('#form_house_number');

        if (postcodeValid && houseNumberValid) {

            if ($('#form_address0').length <= 0 || $('#form_address0').val() == '') {

                // Address is not selected -> raise a validation message manually

                // Allow the validation now if address form is being displayed
                if($('#details-editable').css('display') != 'none'){

                    $('#form_address_pict').removeClass('ignore');

                }

                validator.element('#form_address_pict');

                return false;

            }
        }

        return true;
    }

    // Auto init
    this.init();
}