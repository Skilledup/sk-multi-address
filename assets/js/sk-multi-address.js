jQuery(function($) {
    // Modify the waitForState function to be more reliable
    function waitForState(stateValue, maxWait = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const checkState = () => {
                const stateField = $('#billing_state');
                
                // Check if state field exists and has options
                if (stateField.length && stateField.find('option').length > 1) {
                    resolve();
                    return;
                }
                
                // Check for timeout
                if (Date.now() - startTime > maxWait) {
                    reject(new Error('Timeout waiting for state field'));
                    return;
                }
                
                // Try again in 100ms
                setTimeout(checkState, 100);
            };
            
            // Start checking
            checkState();
        });
    }

    // Initialize Select2 for country select
    $('.sk-country-select').select2({
        placeholder: skMultiAddress.i18n.selectCountry,
        allowClear: true,
        width: '100%',
        minimumResultsForSearch: 0 // Always show search box
    });

    // Initialize Select2 for state select
    $('.sk-state-select').select2({
        placeholder: skMultiAddress.i18n.selectState,
        allowClear: true,
        width: '100%',
        minimumResultsForSearch: 0
    });

    // If there's a hidden country input (single country case), trigger state loading
    var $hiddenCountry = $('input[type="hidden"][name="country"]');
    if ($hiddenCountry.length) {
        var countryCode = $hiddenCountry.val();
        loadStates(countryCode);
    }

    // Create a reusable function for loading states
    function loadStates(countryCode, stateValue = '') {
        const $stateField = $('.sk-state-field');
        const $stateSelect = $('.sk-state-select');
        
        if (!countryCode) {
            $stateSelect.prop('disabled', true)
                       .prop('required', false)
                       .empty()
                       .append('<option value="">' + skMultiAddress.i18n.selectCountryFirst + '</option>')
                       .trigger('change');
            return;
        }

        // Add loading state
        $stateField.addClass('loading');
        
        makeAjaxCall('sk_get_states', {
            country: countryCode
        }).done(function(response) {
            if (response.success) {
                const states = response.data;
                $stateSelect.empty();
                
                if (Object.keys(states).length === 0) {
                    $stateSelect.prop('disabled', true)
                               .prop('required', false)
                               .append('<option value="">-</option>')
                               .trigger('change');
                } else {
                    $stateSelect.append('<option value="">' + skMultiAddress.i18n.selectState + '</option>');
                    
                    $.each(states, function(code, name) {
                        $stateSelect.append($('<option></option>')
                            .attr('value', code)
                            .text(name));
                    });
                    
                    $stateSelect.prop('disabled', false)
                               .prop('required', true);
                    
                    // Set state value if provided
                    if (stateValue) {
                        $stateSelect.val(stateValue).trigger('change.select2');
                    } else {
                        $stateSelect.trigger('change');
                    }
                }
            }
        }).fail(function(error) {
            console.error('Failed to load states:', error);
        }).always(function() {
            // Remove loading state
            $stateField.removeClass('loading');
        });
    }

    // Modify the existing country change handler to use the new function
    $('.sk-country-select').on('change', function() {
        loadStates($(this).val());
    });

    // Handle address form submission
    $('#sk-new-address-form').on('submit', function(e) {
        e.preventDefault();
        
        const form = $(this);
        const formData = new FormData(this);
        const addressData = {};
        const addressId = form.data('address-id');
        
        formData.forEach((value, key) => {
            addressData[key] = value;
        });

        makeAjaxCall('sk_save_address', {
            address: addressData,
            address_id: addressId
        }).done(function(response) {
            if (response.success) {
                location.reload();
            }
        }).fail(function(error) {
            console.error('Failed to save address:', error);
        });
    });
    // Handle edit address button click
    $('.sk-edit-address').on('click', function(e) {
        e.preventDefault();
        const addressId = $(this).closest('.sk-address-item').data('address-id');
        const form = $('#sk-new-address-form');
        
        makeAjaxCall('sk_get_address', {
            address_id: addressId
        }).done(function(response) {
            if (response.success) {
                const address = response.data;
                
                // Update form title
                $('#sk-form-title').text(skMultiAddress.i18n.updateAddress);
                
                // Set basic form values first
                populateBasicFields(form, address);
                
                // Set country value and load states
                const $countrySelect = form.find('.sk-country-select');
                if ($countrySelect.length) {
                    $countrySelect.val(address.country).trigger('change.select2');
                    loadStates(address.country, address.state);
                } else {
                    // If country is hidden input (single country case)
                    const $hiddenCountry = form.find('input[type="hidden"][name="country"]');
                    if ($hiddenCountry.length) {
                        $hiddenCountry.val(address.country);
                        loadStates(address.country, address.state);
                    }
                }
                
                // Add address ID to form
                form.data('address-id', addressId);
                
                // Scroll to form
                $('html, body').animate({
                    scrollTop: form.offset().top - 100
                }, 500);
            }
        }).fail(function(error) {
            console.error('Failed to get address:', error);
        });
    });

    // Handle address deletion
    $('.sk-delete-address').on('click', function() {
        if (!confirm(skMultiAddress.i18n.confirmDelete)) {
            return;
        }

        const addressItem = $(this).closest('.sk-address-item');
        const addressId = addressItem.data('address-id');

        $.ajax({
            url: skMultiAddress.ajax_url,
            type: 'POST',
            data: {
                action: 'sk_delete_address',
                nonce: skMultiAddress.nonce,
                address_id: addressId
            },
            success: function(response) {
                if (response.success) {
                    addressItem.fadeOut(400, function() {
                        $(this).remove();
                    });
                }
            }
        });
    });

    // Helper function to check if element is select2
    function isSelect2($element) {
        return $element.hasClass('select2-hidden-accessible');
    }

    // Helper function to wait for city options to be populated
    function waitForCityOptions($cityField, cityValue, maxWait = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const observer = new MutationObserver((mutations, obs) => {
                if (Date.now() - startTime > maxWait) {
                    obs.disconnect();
                    reject(new Error('Timeout waiting for city options'));
                    return;
                }

                if ($cityField.find('option').length > 1) {
                    obs.disconnect();
                    resolve();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    // Helper function to set field value (handles both regular inputs and select2)
    async function setCityValue($field, value) {
        if ($field.is('select')) {
            // For select dropdowns
            if (isSelect2($field)) {
                try {
                    // Wait for options to be populated
                    await waitForCityOptions($field, value);
                    
                    // Try to find exact match first
                    if ($field.find(`option[value="${value}"]`).length) {
                        $field.val(value).trigger('change');
                    } else {
                        // Try to find case-insensitive match
                        const matchingOption = $field.find('option').filter(function() {
                            return $(this).text().toLowerCase() === value.toLowerCase();
                        });
                        
                        if (matchingOption.length) {
                            $field.val(matchingOption.val()).trigger('change');
                        } else {
                            // If no match found, try to create new option
                            const newOption = new Option(value, value, true, true);
                            $field.append(newOption).trigger('change');
                        }
                    }
                } catch (error) {
                    console.warn('Error setting city value:', error);
                    // Fallback: try direct value setting
                    $field.val(value).trigger('change');
                }
            } else {
                // Regular select dropdown
                $field.val(value).trigger('change');
            }
        } else {
            // Regular input field
            $field.val(value);
        }
    }

    // Helper function to find and set phone field value
    function setPhoneFieldValue(phoneNumber) {
        // Try standard WooCommerce phone field
        const $standardPhone = $('#billing_phone');
        
        // Try Digits plugin phone field
        const $digitsPhone = $('input[data-dig-main="billing_phone"], input[name="mobile/email"][mob="1"]');
        
        if ($digitsPhone.length) {
            // Set value for Digits phone field
            $digitsPhone.val(phoneNumber).trigger('change');
            
            // Update additional Digits attributes if they exist
            if ($digitsPhone.attr('countrycode')) {
                $digitsPhone.attr('user_phone', phoneNumber);
            }
        } else if ($standardPhone.length) {
            // Set value for standard WooCommerce phone field
            $standardPhone.val(phoneNumber).trigger('change');
        }
    }

    // Update the address selection handler
    $('#sk-saved-addresses-select').on('change', function() {
        const addressId = $(this).val();
        if (!addressId) return;

        makeAjaxCall('sk_get_address', {
            address_id: addressId
        }).done(function(response) {
            if (response.success) {
                const address = response.data;
                
                // Set country first
                const $country = $('#billing_country');
                $country.val(address.country).trigger('change');

                // Wait for state field to be ready
                waitForState(address.state).then(() => {
                    const $state = $('#billing_state');
                    $state.val(address.state).trigger('change');
                    
                    // Fill all other fields using the checkout form
                    populateBasicFields($('form.checkout'), address);
                    
                    // Handle city separately with delay
                    setTimeout(() => {
                        setCityValue($('#billing_city'), address.city);
                    }, 500);
                }).catch(error => {
                    console.warn('Failed to set state automatically:', error);
                    alert(skMultiAddress.i18n.selectStateManually);
                    
                    // Fill all fields except state
                    populateBasicFields($('form.checkout'), address);
                });
            }
        }).fail(function(error) {
            console.error('Failed to get address:', error);
        });
    });

    $('.sk-reset-form').on('click', function() {
        const form = $('#sk-new-address-form');
        form[0].reset();
        form.removeData('address-id');
        form.find('button[type="submit"]').text(skMultiAddress.i18n.saveAddress);
        $('#sk-form-title').text(skMultiAddress.i18n.addNewAddress);
    });

    function populateBasicFields(form, address) {
        // Handle form fields
        form.find('[name="first_name"]').val(address.first_name);
        form.find('[name="last_name"]').val(address.last_name);
        form.find('[name="email"]').val(address.email);
        form.find('[name="phone"]').val(address.phone);
        form.find('[name="address_name"]').val(address.address_name);
        form.find('[name="address_1"]').val(address.address_1);
        form.find('[name="address_2"]').val(address.address_2);
        form.find('[name="postcode"]').val(address.postcode);
        form.find('[name="city"]').val(address.city);
        
        // Handle WooCommerce billing fields
        $('#billing_first_name').val(address.first_name).trigger('change');
        $('#billing_last_name').val(address.last_name).trigger('change');
        $('#billing_email').val(address.email).trigger('change');
        $('#billing_address_1').val(address.address_1).trigger('change');
        $('#billing_address_2').val(address.address_2).trigger('change');
        $('#billing_postcode').val(address.postcode).trigger('change');
        $('#billing_city').val(address.city).trigger('change');
        setPhoneFieldValue(address.phone);
    }

    function makeAjaxCall(action, data = {}) {
        return $.ajax({
            url: skMultiAddress.ajax_url,
            type: 'POST',
            data: {
                ...data,
                action: action,
                nonce: skMultiAddress.nonce
            }
        });
    }
});
