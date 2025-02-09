<?php
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="sk-checkout-address-selector">
    <h3 style="display: inline-block; margin-right: 15px;"><?php esc_html_e('Select from saved addresses', 'sk-multi-address'); ?></h3>
    <div class="sk-address-selector-wrapper">
        <select id="sk-saved-addresses-select">
            <option value=""><?php esc_html_e('Choose an address...', 'sk-multi-address'); ?></option>
            <?php foreach ($saved_addresses as $address_id => $address) : ?>
                <option value="<?php echo esc_attr($address_id); ?>">
                    <?php
                    echo esc_html(sprintf(
                        '%s%s %s, %s',
                        !empty($address['address_name']) ? "(" . $address['address_name'] . ") " : "",
                        $address['first_name'],
                        $address['last_name'],
                        $address['address_1']
                    ));
                    ?>
                </option>
            <?php endforeach; ?>
        </select>
        <a href="<?php echo esc_url(wc_get_account_endpoint_url('addresses')) . '#sk-form-title'; ?>" id="sk-add-new-address" class="button" title="<?php esc_attr_e('Add new', 'sk-multi-address'); ?>">+</a>
    </div>
</div>
