jQuery(function($) {
    // Handle address form submission
    $('#sk-new-address-form').on('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const addressData = {};
        
        formData.forEach((value, key) => {
            addressData[key] = value;
        });

        $.ajax({
            url: skMultiAddress.ajax_url,
            type: 'POST',
            data: {
                action: 'sk_save_address',
                nonce: skMultiAddress.nonce,
                address: addressData
            },
            success: function(response) {
                if (response.success) {
                    location.reload();
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
});
