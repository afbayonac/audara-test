

// Validate form
const validateForm = (form, formValidations) => {
    if (!form || !formValidations) return false;

    // Errors object
    const errors = {};

    // Loops through form
    const formKeys = Object.keys(form);
    for (let i = 0; i < formKeys.length; i++) {
        const field = formKeys[i];

        // If field has no validations, continue.
        if (!formValidations[field] || formValidations[field] === '') continue;

        // Gets field validations
        const validationsArray = formValidations[field].split('|');
        const validations = {};

        // Structures validations
        for (let j = 0; j < validationsArray.length; j++) {
            const validation = validationsArray[j].split(':');

            // If the validation has a value, set it. Else, set it to true.
            validations[validation[0]] = validation.length > 1 ? validation[1] : true;
        }

        // ------------------------ //
        // -- START VALIDATIONS -- //

        const fieldValue = form[field];
        errors[field] = [];

        // Required
        if (validations.required) {
            if (!fieldValue || fieldValue.length < 1) {
                errors[field].push("required");
            }
        }

        // The validations below require the field to not be undefined
        if (fieldValue !== undefined) {
            // Min (length)
            if (validations.min) {
                if (fieldValue.length > 0 && fieldValue.length < validations.min) {
                    errors[field].push(`min:${validations.min}`);
                }
            }

            // Max (length)
            if (validations.max) {
                if (fieldValue.length > validations.max) {
                    errors[field].push(`max:${validations.max}`);
                }
            }

            // Type
            if (validations.type) {
                let vError = false;

                // alphaNumericDash
                if (validations.type === 'alphaNumericDash') {
                    if (/[^\w\d-]/gi.test(String(fieldValue))) vError = true;
                }

                // bool
                if (validations.type === 'bool') {
                    if (fieldValue !== true && fieldValue !== false) vError = true;
                }

                // numeric
                else if (validations.type === 'numeric') {
                    if (/[^\d]/gi.test(String(fieldValue))) vError = true;
                }

                // numeric
                else if (validations.type === 'float') {
                    if (! /^[+-]?\d+(\.\d+)?$/gi.test(String(fieldValue))) vError = true;
                }

                // If error
                if (vError) errors[field].push(`type:${validations.type}`);
            }
        }

        // -- END VALIDATIONS -- //
        // -------------------- //


        // Removes field from errors if there were none.
        if (errors[field].length < 1) {
            delete errors[field];
        }
        // Else, structures errors
        else {
            errors[field] = errors[field].join('|');
        }
    }

    // Return validation result
    if (Object.keys(errors).length < 1) {
        return false;
    }
    else {
        return errors;
    }
}

module.exports = validateForm;

