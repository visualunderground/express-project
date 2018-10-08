/**
 * Mifid related functionality, mostly fetching and rendering nationality dependant fields for data capture
 */

HL.Mifid = new function () {

    /**
     * Container function for all of our setup of event handlers etc
     */
    this.initialize = function (formID) {
        //closest parent form will be the containing form as form_mifid_nationality is a required submit element
        var $applicationForm = $('#form_mifid_nationality').closest('form');

        this.hasExistingNINOField = $('#form_nino').length > 0;
        this.isExistingNINOCompulsary = $('#form_no_nino').length > 0;

        $('<input type="hidden" name="form_mifid_is_uk" id="form_mifid_is_uk" value="0">').appendTo($applicationForm);

        this.addCustomValidationRules();

        var mifidStructure = $applicationForm.find('#form_mifid_form_structure').val();
        if (mifidStructure !== '') {
            this.renderFormFromJSONStructure(JSON.parse(mifidStructure));
        }

        $('input[type="radio"][name="form_mifid_nationality"]')
            .change(function () {
                HL.Mifid.evaluateNationalityTypeChange()
            });

        $applicationForm.submit(function () {
            HL.Mifid.handleSubmit()
        });
    };

    /**
     * Add the custom validation rules for the MiFID fields
     */
    this.addCustomValidationRules = function () {
        $.validator.addMethod("uniqueNationality", function (value, element) {
            var firstSelected = null;
            var secondSelected = null;
            var $nationality0 = $('#form_mifid_choice_nationality_0');
            var $nationality1 = $('#form_mifid_choice_nationality_1');

            if ($nationality0.length > 0) {
                firstSelected = $nationality0.val();
            }
            if ($nationality1.length > 0) {
                secondSelected = $nationality1.val();
            }
            if (firstSelected && secondSelected) {
                if (firstSelected !== secondSelected) {
                    $nationality0.addClass('valid');
                    $nationality1.addClass('valid');
                    return true;
                }
                return false;
            }
            return true;
        }, "Multiple nationalities cannot be the same");

        $.validator.addMethod("regex", function (value, element, pattern) {
            var re = new RegExp(pattern);
            return this.optional(element) || re.test(value);
        });
    };

    /**
     * Validate and fill hidden fields before form submits to server
     *
     * @param event Event
     */
    this.handleSubmit = function (event) {
        var hasCompulsaryNino = this.isExistingNINOCompulsary;
        var hasExistingNino = this.hasExistingNINOField;
        var isOnlyUK = $('#form_mifid_is_uk').val() == "1";
        var haveCapturedField = false;
        var hasUKWinDual = false;
        var existingNino = '';
        var primaryNationality = null;
        var secondaryNationality = null;
        var firstChoice = $('#form_mifid_choice_nationality_0').val();
        var secondChoice = $('#form_mifid_choice_nationality_1').val();
        var hasDualNationality = firstChoice && secondChoice;

        var $identifiers = $('[data-id-type]');

        if (!isOnlyUK) {
            //clear the boxes ready for new values
            $('#form_mifid_dual_nationality').val('');
            $('#form_mifid_nationality').val('');
        }

        $identifiers.each(function () {
            if ($(this).val() && !haveCapturedField) {
                haveCapturedField = true;
                primaryNationality = $(this).attr('data-id-iso');
                $('#form_mifid_id_number').val($(this).val());
                $('#form_mifid_id_type').val($(this).attr('data-id-type'));
                $('#form_mifid_nationality').val($(this).attr('data-id-iso'));
            }
        });

        if (hasDualNationality) {
            secondaryNationality =
                (primaryNationality == firstChoice) ? secondChoice : firstChoice;

            $('#form_mifid_dual_nationality').val(secondaryNationality);
        }

        hasUKWinDual = hasDualNationality && primaryNationality == 'GB';

        if (hasExistingNino && hasUKWinDual) {
            existingNino = $('#form_nino').val().replace(/\s/g, '');

            if (existingNino !== '') {
                $('#form_mifid_id_type').val('NINO');
                $('#form_mifid_id_number').val(existingNino);
            } else {
                $('#form_mifid_id_type').val('CONCAT');
                $('#form_mifid_id_number').val('CONCAT');
            }

            $('#form_mifid_nationality').val('GB');
            $('#form_mifid_dual_nationality').val(secondaryNationality);

        }

        this.refreshFormStructureJSON(); //as they are likely to have changed since initial generation
    };

    /**
     * Regenerate the JSON blob storing the current structure of the form. This is to allow us to recreate
     * an up-to-date version of the form should the server have an issue with the submitted input
     */
    this.refreshFormStructureJSON = function () {
        var $structureField = $('#form_mifid_form_structure');
        var currentStructureAsString = $structureField.val();

        if (!currentStructureAsString) {
            return;
        }

        var structure = JSON.parse(currentStructureAsString);
        var inputs = structure['inputs'];

        for (var property in inputs) {
            //this is to prevent going though every inherited property on the prototype
            if (inputs.hasOwnProperty(property)) {
                structure['inputs'][property] = $('[data-id-type=' + property + ']').val();
            }
        }

        $structureField.val(JSON.stringify(structure));
    };


    /**
     * Render the MiFID fields if there is a JSON blob present, as there was a server issue
     *
     * @param structure Object
     */
    this.renderFormFromJSONStructure = function (structure) {
        var nationalityType = structure['type'];
        var primaryNationality = structure['nationalities'][0];
        var secondaryNationality = structure['nationalities'][1];

        $('[name=form_mifid_nationality]').filter('[value=' + structure['type'] + ']').prop('checked', true);

        HL.Ajax.mifidCountries()
            .done(function (data, status) {
                HL.Mifid.renderNationalityDropdowns(nationalityType, JSON.parse(data));
            })
            .done(function () {
                var $select = $('#form_mifid_choice_nationality_0');
                $select.val(primaryNationality);

                if (nationalityType === 'multi' && secondaryNationality) {
                    $('#form_mifid_choice_nationality_1').val(secondaryNationality);
                }

                HL.Mifid.renderNationalityFields($select.parent(), nationalityType)
                    .done(function () {
                        for (var property in structure['inputs']) {
                            //this is to prevent going though every inherited property on the prototype
                            if (structure['inputs'].hasOwnProperty(property)) {
                                var $input = $('[data-id-type=' + property + ']');
                                var value = structure['inputs'][property];
                                $input.val(value);
                            }
                        }
                    });
            });
    };

    /**
     * Inserts the 'select nationality' dropdowns into the form, depending on which radio value is passed in.
     */
    this.renderNationalityDropdowns = function (nationalityType, choices) {
        var existingNationalities = this.getCurrentlySelectedNationalities(nationalityType);
        var container = $('#mifid-id-controls');
        var labelOptions = ['one', 'two'];
        var label = 'Nationality';

        container.empty();

        var numRows = 1;
        if (nationalityType === 'multi') {
            numRows = 2;
        }

        for (var index = 0; index < numRows; index++) {
            label = 'Nationality';
            if (numRows > 1) {
                label = label + ' ' + labelOptions[index];
            }
            label = label + ':';
            var row = this.buildDropdownRow(nationalityType, label, choices, existingNationalities[index], index);
            row.appendTo(container);
        }

        //rules must be added after the element is in the form
        container
            .find('select')
            .each(function () {
                $(this).rules("add",
                    {
                        required: true,
                        uniqueNationality: true,
                        messages: {
                            required: "Please {label}select a nationality{/label} from the list"
                        }
                    })
            });
    };

    /**
     * Return an array of currently selected countries from the form
     *
     * @param nationalityType string
     */
    this.getCurrentlySelectedNationalities = function (nationalityType) {
        var existingNationalities = [];
        var value;

        if (nationalityType === 'non' || nationalityType === 'multi') {
            value = $('#form_mifid_choice_nationality_0').val();
            if (value) {
                existingNationalities.push(value);
            }
        }

        if (nationalityType === 'multi') {
            value = $('#form_mifid_choice_nationality_1').val();
            if (value) {
                existingNationalities.push(value);
            }
        }

        return existingNationalities;
    };

    /**
     * Builds the HTML for a dropdown row to be appended into the form.
     *
     * @param nationalityType
     * @param label
     * @param choices
     * @param existingNationality
     * @param index
     * @returns {*|jQuery}
     */
    this.buildDropdownRow = function (nationalityType, label, choices, existingNationality, index) {
        var $row = $('<div>').attr('class', 'row form-row item-row');
        var $inputColumn = $('<div>').attr('class', 'column column-input large-9 medium-9 small-9 item-box');
        var $labelColumn = $('<div>')
            .attr('class', 'column column-label large-3 medium-3 item-label item-label-for-textbox')
            .html(
                "<label for='" + "form_mifid_choice_nationality_" + index + "' class='required' aria-required='true'/>" + label + "</label>"
            );

        var $select =
            $('<select>')
                .attr(
                    {
                        name: 'form_mifid_choice_nationality_' + index,
                        id: 'form_mifid_choice_nationality_' + index,
                        required: 'required'
                    }
                );

        $('<option>')
            .attr({disabled: 'disabled', selected: 'selected', hidden: 'hidden'})
            .text('Please select...')
            .appendTo($select);

        choices.forEach(function (choice, index) {
            if (nationalityType === 'non' && choice.key === 'GB') {
                return;
            }

            var $option = $('<option>').attr('value', choice.key).text(choice.value);

            if (existingNationality === choice.key) {
                $option.attr('selected', 'selected');
            }

            $option.appendTo($select);
        });

        $select.appendTo($inputColumn);
        $labelColumn.appendTo($row);
        $inputColumn.appendTo($row);
        $select.change(function (event, validate) {
            HL.Mifid.renderNationalityFields($inputColumn, nationalityType, validate, $(this).val());
        });
        $select.trigger('change', [false]);

        return $row;
    };

    /**
     * Fetches and renders the national identifier fields for a specific nationality
     *
     * @param fieldContainer    jQuery Element
     * @param nationalityType   string
     * @param validate          bool
     * @param selectedValue     string
     */
    this.renderNationalityFields = function ($fieldContainer, nationalityType, validate, selectedValue) {
        var deferred = $.Deferred();
        if (validate !== false) {
            validate = true;
        }

        var fields = $('#form_mifid_choice_nationality_0, #form_mifid_choice_nationality_1');
        $(fields).next('.error').hide();
        $(fields).removeClass('error');

        $fieldContainer.removeClass('item-box-in-error');

        if (validate === true) {
            $(document.forms).validate();
        }

        var primaryNationality = $('#form_mifid_choice_nationality_0').val();
        var secondaryNationality = $('#form_mifid_choice_nationality_1').val();
        if (primaryNationality == null) {
            primaryNationality = selectedValue;
        }

        if (nationalityType === 'multi' && secondaryNationality == null) {
            return;
        }

        var fieldsAreValid = false;
        if (selectedValue) {
            fieldsAreValid = true;
        } else {
            if (validate) {
                fieldsAreValid = fields.valid();
            }
            else {
                fieldsAreValid = true;
            }
        }
        if (primaryNationality || secondaryNationality) {
            if (fieldsAreValid) {
                HL.Ajax.mifidIdentifiers(primaryNationality, secondaryNationality)
                    .done(function (data, status) {
                        HL.Mifid.renderNationalityInputs(JSON.parse(data));
                    })
                    .done(function () {
                        //this lets us ensure the fields are rendered
                        deferred.resolve();
                    });
            }
        }

        if (!validate) {
            $(fields).next('.error').hide();
            $(fields).removeClass('error');
            $fieldContainer.removeClass('item-box-in-error');
        }

        return deferred.promise();
    };

    /**
     * Renders the inputs themselves based on supplied JSON blob.
     * We always want the first result, as they are returned in order of precedence.
     *
     */
    this.renderNationalityInputs = function (inputs) {
        var deferred = $.Deferred();
        var country = inputs[0];
        var natIdentifiers = country.national_client_identifiers;
        $('#mifid-input-controls').empty();

        if (country.id === 'GB' && inputs.length < 2) {
            return this.populateHiddenFieldsGB();
        }

        this.renderIdentifierInput(country.id, country.name, natIdentifiers)
            .done(function () {
                deferred.resolve()
            });

        this.populateFormStructureJSON(inputs);

        return deferred.promise();
    };

    /**
     * Populates the hidden MIFID fields when UK is selected nationality; this does
     * not require any extra form fields or special logic, we just either have an NI
     * number or not.
     */
    this.populateHiddenFieldsGB = function () {
        var nationality = 'GB';
        var type = 'NINO';
        var value = $('#form_nino').val().toUpperCase().replace(/\s/g, '');
        var noNino = $('#form_no_nino').is(':checked');
        if (noNino) {
            type = 'CONCAT';
            value = 'CONCAT';
        }
        var formStructure = {"type": "uk", "nationalities": ["GB"], "inputs": {"NINO": value, "CONCAT": value}};
        if (noNino) {
            formStructure.inputs.NINO = null;
        }
        else {
            formStructure.inputs.CONCAT = null;
        }
        $('#form_mifid_nationality').val(nationality);
        $('#form_mifid_dual_nationality').val('');
        $('#form_mifid_id_type').val(type);
        $('#form_mifid_id_number').val(value);
        $('#form_mifid_form_structure').val(JSON.stringify(formStructure));
        $('#form_mifid_is_uk').val('1');
    };

    /**
     * Loop through the possible identifier inputs (e.g. national ID, passport number etc.)
     * for this country and draw the form fields. If there's more than one option, these
     * are in order of precedence, so disable any inputs after the first set. These will
     * be re-enabled if the "I don't have..." checkbox is ticked for the first ID.
     */
    this.renderIdentifierInput = function (id, name, nationalIdentifiers) {
        var $defer = $.Deferred();
        var numIdentifiers = nationalIdentifiers.length;
        var disabled = false;
        var mandatory = false;

        var canConcat = this.nationalitiesAllowConcat();

        $('#mifid_identifier_container').empty();
        $('#mifid-input-controls').empty();
        $('<div>').attr('id', 'mifid-input-controls').appendTo('#mifid-id-controls');

        for (var i = 0; i < numIdentifiers; i++) {
            if (nationalIdentifiers[i].id === 'CONCAT') {
                this.renderConcatIdentifier(id, name, nationalIdentifiers[i], i + 1);
            } else {
                disabled = i > 0;
                //if there is only 1 it's mandatory, or if it can't concat and we're on the last identifier
                mandatory = numIdentifiers == 1 || (i == numIdentifiers - 1 && !canConcat);
                this.renderSingleIdentifier(id, name, nationalIdentifiers[i], i + 1, disabled, numIdentifiers, mandatory);
            }
        }

        return $defer;
    };

    /**
     * Render a hidden MIFID input for CONCAT identifiers (these require no user input).
     */
    this.renderConcatIdentifier = function (countryId, countryName, identifier, currentIdentifier) {
        var $container = $('#mifid-input-controls');
        var identifierControlName = "form_mifid_identifier_" + currentIdentifier;
        var $input = $('<input>').attr({
            type: "hidden",
            id: identifierControlName,
            name: identifierControlName,
            value: "CONCAT"
        });
        $input.attr('data-id-type', identifier.id);
        $input.attr('data-id-iso', countryId);
        $input.appendTo($container);
        $input.rules('remove');
    };

    /**
     * Render the text and checkbox inputs for a single MIFID id (e.g. Czech Republic National ID number)
     * and add validation rules and checkbox event handler.
     */
    this.renderSingleIdentifier = function (countryId, countryName, identifier, currentIdentifier, disabled, numIdentifiers, mandatory) {
        var $container = $('#mifid-input-controls');
        var $row = $('<div>').attr({
            class: 'row form-row item-row',
            id: 'mifid_identifier_container_' + currentIdentifier
        });
        var label = identifier.localised_name;
        var identifierControlName = "form_mifid_identifier_" + currentIdentifier;

        if (!label) {
            label = identifier.name;
        }

        var localisedLabel = countryName + " " + label;
        var $labelColumn = $('<div>').attr('class', 'column column-label large-3 medium-3 item-label item-label-for-textbox').text(localisedLabel);
        var $inputColumn = $('<div>').attr('class', 'column column-input large-9 medium-9 small-9 item-box');

        //if UK wins and already has a field, use that instead so bail
        if (countryId === 'GB' && this.hasExistingNINOField) {
            return;
        }

        $row.attr('data-input-mifid', '');

        var $input = $('<input>').attr({
            type: "text",
            id: identifierControlName,
            name: identifierControlName,
            placeholder: "Please enter your " + localisedLabel,
            maxlength: 255
        });

        $input.change(function () {
            $(this).val(
                $(this).val().toLocaleUpperCase()
            );
        });

        $input.attr('data-id-type', identifier.id);
        $input.attr('data-id-iso', countryId);

        if (disabled) {
            $input.attr('disabled', 'disabled');
            $row.addClass('hidden');
        }

        $input.appendTo($inputColumn);

        $labelColumn.appendTo($row);
        $inputColumn.appendTo($row);
        $row.appendTo($container);

        var requiredMessage = "Please enter a {label}" + countryName + " " + identifier.name + "{/label}";
        if (!mandatory) {
            requiredMessage = requiredMessage + " or tick the box if you do not have one";
        }

        $input.rules("add", {
            required: true,
            regex: identifier.regex_pattern,
            messages: {
                required: requiredMessage,
                regex: "Please enter a valid {label}" + localisedLabel + "{/label} (" + identifier.format_text + ")"
            }
        });

        if (!mandatory) {
            var $checkboxColumn = $('<div>').attr('class', 'column column-input large-9 medium-9 large-offset-3 medium-offset-3 spacer-top item-box');
            var checkboxText = 'I do not have a ' + label;
            var $checkboxLabel = $('<label>').attr({
                id: identifierControlName + '_none_label',
                for: identifierControlName + '_none'
            }).text(checkboxText);

            var $checkboxInput = $('<input>').attr({
                id: identifierControlName + '_none',
                type: 'checkbox',
                name: identifierControlName + '_none',
                value: '1'
            });
            $checkboxInput.attr('data-checkbox-mifid', '');
            $checkboxInput.appendTo($checkboxColumn);

            if (disabled) {
                $checkboxInput.attr('disabled', 'disabled');
                $checkboxLabel.attr('disabled', 'disabled');
            }

            $checkboxLabel.appendTo($checkboxColumn);
            $checkboxColumn.appendTo($row);

            $checkboxInput.change(function () {
                //can only be triggered if there is another option to use
                if ($(this).is(':checked')) {
                    $inputColumn.removeClass('item-box-in-error');
                    $('#' + identifierControlName).removeClass('error').removeClass('valid').removeAttr('required').attr('disabled', 'disabled').val('');
                    $('#' + identifierControlName + '-error').text('');
                    if (currentIdentifier < numIdentifiers) {
                        HL.Mifid.setIdentifierInputEnabledState(true, currentIdentifier + 1);
                    }
                    HL.Mifid.setIdentifierRowVisibility(true, currentIdentifier + 1);
                }
                else {
                    $('#' + identifierControlName).removeAttr('disabled').attr('required', 'required');
                    if (currentIdentifier < numIdentifiers) {
                        HL.Mifid.setIdentifierInputEnabledState(false, currentIdentifier + 1);
                    }
                    HL.Mifid.setIdentifierRowVisibility(false, currentIdentifier + 1);
                }
            });
        }
    };

    /**
     * Changes the visibility of a specific identifiers row, unless concat which always remains hidden
     *
     * @param shouldBeVisible {boolean}
     * @param identifier {int}
     */
    this.setIdentifierRowVisibility = function (shouldBeVisible, identifier) {
        var $row = $('#mifid_identifier_container_' + identifier);
        var isConcat = $row.find('#form_mifid_identifier_' + identifier).val() == 'CONCAT';

        if (shouldBeVisible) {
            if (!isConcat) {
                $row.removeClass('hidden');
            }
        } else {
            $row.addClass('hidden');
            this.setIdentifierInputEnabledState(false, identifier);
        }
    };

    /**
     * Enable or disable the text and checkbox inputs for a given MIFID identifier.
     */
    this.setIdentifierInputEnabledState = function (enabled, id) {
        var inputId = "form_mifid_identifier_" + id;
        var checkboxId = inputId + "_none";
        var checkboxLabelId = checkboxId + '_label';

        var $input = $('#' + inputId);
        var $checkbox = $('#' + checkboxId);
        var $checkboxLabel = $('#' + checkboxLabelId);

        if ($input.attr('type') == 'hidden') {
            return;
        }

        if (enabled) {
            $input.removeAttr('disabled').attr('required', 'required');
            $checkbox.removeAttr('disabled');
            $checkboxLabel.removeAttr('disabled');
        }
        else {
            $input.removeClass('error').removeClass('valid').removeAttr('required').attr('disabled', 'disabled').val('');
            $input.next().text('');
            $checkbox.attr('disabled', 'disabled');
            $checkbox.prop('checked', false);
            $checkboxLabel.attr('disabled', 'disabled');
        }
    };

    /**
     * Populate the hidden MIFID field used to help recreate form structure, should there be a server-side issue.
     * This uses data from the earlier AJAX response indicating which national identifier fields are to be drawn.
     *
     *  Example of json blob generated:
     *  {"type":"uk","nationalities":["GB"],"inputs":{"NINO":value, "CONCAT":value}};
     *
     * @param data
     */
    this.populateFormStructureJSON = function (data) {
        var type = $('[name=form_mifid_nationality]').filter(':checked').val();
        var primaryNationality = data[0];
        var secondaryNationality = data[1];
        var nationalities = [primaryNationality['id']];

        if (secondaryNationality !== undefined) {
            nationalities.push(secondaryNationality['id']);
        }

        var primaryInputs = primaryNationality['national_client_identifiers'];
        var inputs = {};
        var value = '';

        primaryInputs.forEach(function (input) {
            value = $('[data-id-type=' + input.id + ']').val();
            inputs[input.id] = value;
        });

        var blob = {
            type: type,
            nationalities: nationalities,
            inputs: inputs
        };

        $('#form_mifid_form_structure').val(JSON.stringify(blob));
    };

    /**
     * Evaluate the chosen nationality radio option and determine whether we need to render
     * nationality fields.
     */
    this.evaluateNationalityTypeChange = function () {
        $('#form_mifid_is_uk').val('0');

        var nationalityType = $('input[type="radio"][name="form_mifid_nationality"]').filter(':checked').val();

        if (nationalityType === undefined) {
            return;
        }

        if (nationalityType === 'uk') {
            $('#mifid-id-controls').empty();
            return this.populateHiddenFieldsGB();
        }

        HL.Ajax.mifidCountries()
            .done(function (nationalityDate, status, response) {
                HL.Mifid.renderNationalityDropdowns(nationalityType, JSON.parse(response.responseText));
            });
    };

    /**
     * Utility to tell if a CONCAT default is permitted for the current country configuration,
     * i.e. does a field for it exist
     *
     * @returns {boolean}
     */
    this.nationalitiesAllowConcat = function () {
        return $('[data-id-type=CONCAT]').length > 0;
    };
};

$(document).ready(function () {
    HL.Mifid.initialize();
});