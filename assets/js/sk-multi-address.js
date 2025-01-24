jQuery(function($) {
    // Initialize Select2 for country select
    $('.sk-country-select').select2({
        placeholder: 'Search for a country...',
        allowClear: true,
        width: '100%',
        minimumResultsForSearch: 0 // Always show search box
    });

    // Initialize Select2 for state select
    $('.sk-state-select').select2({
        placeholder: 'Search for a state...',
        allowClear: true,
        width: '100%',
        minimumResultsForSearch: 0
    });

    // Handle country change to update states
    $('.sk-country-select').on('change', function() {
        var countryCode = $(this).val();
        var $stateField = $('.sk-state-select');
        
        if (!countryCode) {
            return;
        }

        var data = {
            action: 'sk_get_states',
            country: countryCode,
            nonce: skMultiAddress.nonce
        };

        $.post(skMultiAddress.ajax_url, data, function(response) {
            if (response.success) {
                var states = response.data;
                $stateField.empty();
                $stateField.append('<option value="">' + skMultiAddress.i18n.selectState + '</option>');
                
                $.each(states, function(code, name) {
                    $stateField.append($('<option></option>')
                        .attr('value', code)
                        .text(name));
                });
                
                $stateField.prop('disabled', false).trigger('change');
            }
        });
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
    // Handle address editing
    $('.sk-edit-address').on('click', function() {
        const addressItem = $(this).closest('.sk-address-item');
        const addressId = addressItem.data('address-id');

        // Get address data
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
                    
                    // Fill form with address data
                    const form = $('#sk-new-address-form');
                    form.find('[name="first_name"]').val(address.first_name);
                    form.find('[name="last_name"]').val(address.last_name);
                    form.find('[name="email"]').val(address.email);
                    form.find('[name="phone"]').val(address.phone);
                    form.find('[name="address_1"]').val(address.address_1);
                    form.find('[name="address_2"]').val(address.address_2);
                    form.find('[name="city"]').val(address.city);
                    form.find('[name="state"]').val(address.state);
                    form.find('[name="postcode"]').val(address.postcode);
                    form.find('[name="country"]').val(address.country);

                    // Add address ID to form and change submit button text
                    form.data('address-id', addressId);
                    form.find('button[type="submit"]').text(skMultiAddress.i18n.updateAddress);
                    
                    // Scroll to form
                    $('html, body').animate({
                        scrollTop: form.offset().top - 100
                    }, 500);
                }
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

    // Handle address selection in checkout
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
                    
                    // Fill billing fields
                    $('#billing_first_name').val(address.first_name);
                    $('#billing_last_name').val(address.last_name);
                    $('#billing_email').val(address.email);
                    $('#billing_phone').val(address.phone);
                    $('#billing_address_1').val(address.address_1);
                    $('#billing_address_2').val(address.address_2);
                    $('#billing_city').val(address.city);
                    $('#billing_state').val(address.state);
                    $('#billing_postcode').val(address.postcode);
                    $('#billing_country').val(address.country).trigger('change');
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
