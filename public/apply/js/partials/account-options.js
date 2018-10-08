/*
* validation rules for account options page
*/

var AccountOptions = new function() {
	this.addValidatorRules = function() {

        var onlinePassword = 'form_online_password';
        var secureNumber = 'form_secure_number';

		var nbaRequired = true;

		if (product === 25) {
			nbaRequired = false;
		}

        var rules  =  {

            // Account access
            'form[secure_number]': {
                required: true,
                securenumber: true,
                minlength: 6,
                maxlength: 6
            },

            'form[confirm_secure_number]': {
                required: true,
                equalTo: '#' + secureNumber
            },

            'form[username]': {
                required: true,
                username: true,
                twoletters: true
            },

            'form[online_password]': {
                required: true,
                validOnlinePassword: true,
                twoletters: true
            },

            'form[confirm_online_password]': {
                required: true,
                equalTo: '#' + onlinePassword
            },

            'form[security_question_one]': {
                required: true
            },

            'form[security_answer_one]': {
                required: true,
                minlength: 2
            },
            'form[security_question_two]': {
                required: true
            },

            'form[security_answer_two]': {
                required: true,
                minlength: 2
            },
            'form[security_question_three]': {
                required: true
            },

            'form[security_answer_three]': {
                required: true,
                minlength: 2
            },

            // Nominated bank account
	        'form[account_name]': {
		        required: nbaRequired,
		        accountname: true,
				bankaccountname: ['#form_firstname', '#form_surname', '#form_title']
	        },

            'form[account_number]': {
                required: nbaRequired,
                number: true,
                minlength: 7,
                maxlength: 8
            },

            'form[sort_code]': {
                required: nbaRequired,
                sortcode: true
            },

            'form[building_society_ref]': {
                required: false
            }
        };

        if (formData.guestAccount === true) {

            rules  =  {
                'form[secure_number]': {
                    required: true,
                    number: true,
                    minlength: 6,
                    maxlength: 6
                },

                'form[confirm_secure_number]': {
                    required: true,
                    equalTo: '#' + secureNumber
                }
            };
        }

	    validatorRules = $.extend({}, validatorRules, rules);  

	}();
}