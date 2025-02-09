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
    function loadStates(countryCode) {
        var $stateField = $('.sk-state-field');
        var $stateSelect = $('.sk-state-select');
        
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
        
        var data = {
            action: 'sk_get_states',
            country: countryCode,
            nonce: skMultiAddress.nonce
        };

        $.post(skMultiAddress.ajax_url, data, function(response) {
            if (response.success) {
                var states = response.data;
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
                               .prop('required', true)
                               .trigger('change');
                }
            }
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

        $.ajax({
            url: skMultiAddress.ajax_url,
            type: 'POST',
            data: {
                action: 'sk_save_address',
                nonce: skMultiAddress.nonce,
                address: addressData,
                address_id: addressId // Will be undefined for new addresses
            },
            success: function(response) {
                if (response.success) {
                    location.reload();
                }
            }
        });
    });
    // Handle edit address button click
    $('.sk-edit-address').on('click', function(e) {
        e.preventDefault();
        var addressId = $(this).closest('.sk-address-item').data('address-id');
        var form = $('#sk-new-address-form');
        
        var data = {
            action: 'sk_get_address',
            address_id: addressId,
            nonce: skMultiAddress.nonce
        };

        $.post(skMultiAddress.ajax_url, data, function(response) {
            if (response.success) {
                var address = response.data;
                
                // Update form title
                $('#sk-form-title').text(skMultiAddress.i18n.updateAddress);
                
                // Set basic form values
                form.find('[name="first_name"]').val(address.first_name);
                form.find('[name="last_name"]').val(address.last_name);
                form.find('[name="email"]').val(address.email);
                form.find('[name="phone"]').val(address.phone);
                form.find('[name="address_1"]').val(address.address_1);
                form.find('[name="address_2"]').val(address.address_2);
                form.find('[name="city"]').val(address.city);
                form.find('[name="postcode"]').val(address.postcode);
                
                // First, load the states for the country
                var stateData = {
                    action: 'sk_get_states',
                    country: address.country,
                    nonce: skMultiAddress.nonce
                };
                
                // Add loading state
                var $stateField = form.find('.sk-state-field');
                $stateField.addClass('loading');
                
                $.post(skMultiAddress.ajax_url, stateData, function(stateResponse) {
                    if (stateResponse.success) {
                        var $stateSelect = form.find('[name="state"]');
                        var states = stateResponse.data;
                        
                        // Clear and populate state options
                        $stateSelect.empty();
                        
                        if (Object.keys(states).length === 0) {
                            $stateSelect.prop('disabled', true)
                                      .prop('required', false)
                                      .append('<option value="">-</option>');
                        } else {
                            $stateSelect.append('<option value="">' + skMultiAddress.i18n.selectState + '</option>');
                            
                            $.each(states, function(code, name) {
                                $stateSelect.append($('<option></option>')
                                    .attr('value', code)
                                    .text(name));
                            });
                            
                            $stateSelect.prop('disabled', false)
                                      .prop('required', true);
                        }
                        
                        // Now set both country and state values
                        form.find('[name="country"]').val(address.country).trigger('change.select2');
                        $stateSelect.val(address.state).trigger('change.select2');
                    }
                }).always(function() {
                    // Remove loading state
                    $stateField.removeClass('loading');
                });
                
                // Add address ID to form
                form.data('address-id', addressId);
                
                // Scroll to form
                $('html, body').animate({
                    scrollTop: form.offset().top - 100
                }, 500);
            }
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

        $.ajax({
            url: skMultiAddress.ajax_url,
            type: 'POST',
            data: {
                action: 'sk_get_address',
                nonce: skMultiAddress.nonce,
                address_id: addressId
            },
            success: function(response) {
                if (response.success) {
                    const address = response.data;
                    
                    // Set country first and trigger change
                    $('#billing_country').val(address.country).trigger('change');

                    // Add a small delay before checking state
                    setTimeout(() => {
                        waitForState(address.state)
                            .then(() => {
                                $('#billing_state').val(address.state).trigger('change');
                                
                                // Fill all fields immediately
                                $('#billing_first_name').val(address.first_name);
                                $('#billing_last_name').val(address.last_name);
                                $('#billing_email').val(address.email);
                                setPhoneFieldValue(address.phone);
                                $('#billing_address_1').val(address.address_1);
                                $('#billing_address_2').val(address.address_2);
                                $('#billing_postcode').val(address.postcode);
                                
                                // Handle city last
                                setTimeout(() => {
                                    setCityValue($('#billing_city'), address.city);
                                }, 500);
                            })
                            .catch(error => {
                                console.warn('Failed to set state/city automatically:', error);
                                alert(skMultiAddress.i18n.selectStateManually);

                                // Fill all fields except state and city
                                $('#billing_first_name').val(address.first_name);
                                $('#billing_last_name').val(address.last_name);
                                $('#billing_email').val(address.email);
                                setPhoneFieldValue(address.phone);
                                $('#billing_address_1').val(address.address_1);
                                $('#billing_address_2').val(address.address_2);
                                $('#billing_postcode').val(address.postcode);
                            });
                    }, 200);
                }
            }
        });
    });

    $('.sk-reset-form').on('click', function() {
        const form = $('#sk-new-address-form');
        form[0].reset();
        form.removeData('address-id');
        form.find('button[type="submit"]').text(skMultiAddress.i18n.saveAddress);
        $('#sk-form-title').text(skMultiAddress.i18n.addNewAddress);
    });
});
