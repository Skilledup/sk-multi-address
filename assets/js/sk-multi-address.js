jQuery(function($) {
    // Function to wait for the state field to be populated
    function waitForState(stateValue, maxWait = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const observer = new MutationObserver((mutations, obs) => {
                const stateField = $('#billing_state');
                
                if (Date.now() - startTime > maxWait) {
                    obs.disconnect();
                    reject(new Error('Timeout waiting for state field'));
                    return;
                }

                if (stateField.length && stateField.find('option').length > 1) {
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

    // Modify the address selection handler
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
                    
                    // Fill all fields except country and state
                    $('#billing_first_name').val(address.first_name);
                    $('#billing_last_name').val(address.last_name);
                    $('#billing_email').val(address.email);
                    $('#billing_phone').val(address.phone);
                    $('#billing_address_1').val(address.address_1);
                    $('#billing_address_2').val(address.address_2);
                    $('#billing_city').val(address.city);
                    $('#billing_postcode').val(address.postcode);
                    
                    // Set country and handle state
                    $('#billing_country').val(address.country).trigger('change');
                    
                    waitForState(address.state)
                        .then(() => {
                            $('#billing_state').val(address.state).trigger('change');
                        })
                        .catch(error => {
                            console.warn('Failed to set state automatically:', error);
                            // Optionally show user feedback
                            alert(skMultiAddress.i18n.selectStateManually);
                        });
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
