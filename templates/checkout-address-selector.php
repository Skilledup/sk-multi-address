<?php
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="sk-checkout-address-selector">
    <h3><?php esc_html_e('Select from saved addresses', 'sk-multi-address'); ?></h3>
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
</div>
