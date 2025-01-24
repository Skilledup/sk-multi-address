<?php
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="sk-addresses-container">
    <h2><?php esc_html_e('My Addresses', 'sk-multi-address'); ?></h2>
    
    <div class="sk-addresses-list">
        <?php if (!empty($saved_addresses)) : ?>
            <?php foreach ($saved_addresses as $address_id => $address) : ?>
                <div class="sk-address-item" data-address-id="<?php echo esc_attr($address_id); ?>">
                    <div class="sk-address-content">
                        <?php
                        echo wp_kses_post($address['first_name'] . ' ' . $address['last_name'] . '<br>');
                        echo wp_kses_post('<strong>' . __('Email:', 'sk-multi-address') . '</strong> ' . $address['email'] . '<br>');
                        echo wp_kses_post('<strong>' . __('Phone:', 'sk-multi-address') . '</strong> ' . $address['phone'] . '<br>');
                        echo wp_kses_post('<strong>' . __('Address:', 'sk-multi-address') . '</strong> ' . $address['address_1'] . '<br>');
                        if (!empty($address['address_2'])) {
                            echo wp_kses_post($address['address_2'] . '<br>');
                        }
                        echo wp_kses_post($address['city'] . (!empty($address['state']) ? ', ' . $address['state'] : '') . ' ' . $address['postcode'] . '<br>');
                        echo wp_kses_post($address['country']);
                        ?>
                    </div>
                    <div class="sk-address-actions">
                        <button class="sk-edit-address button"><?php esc_html_e('Edit', 'sk-multi-address'); ?></button>
                        <button class="sk-delete-address button"><?php esc_html_e('Delete', 'sk-multi-address'); ?></button>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>

    <div class="sk-add-address-form">
        <h3 id="sk-form-title"><?php esc_html_e('Add New Address', 'sk-multi-address'); ?></h3>
        <form id="sk-new-address-form">
            <div class="sk-form-row">
                <div class="sk-form-field">
                    <label><?php esc_html_e('First Name', 'sk-multi-address'); ?></label>
                    <input type="text" name="first_name" required>
                </div>
                <div class="sk-form-field">
                    <label><?php esc_html_e('Last Name', 'sk-multi-address'); ?></label>
                    <input type="text" name="last_name" required>
                </div>
            </div>

            <div class="sk-form-row">
                <div class="sk-form-field">
                    <label><?php esc_html_e('Email', 'sk-multi-address'); ?></label>
                    <input type="email" name="email" required>
                </div>
                <div class="sk-form-field">
                    <label><?php esc_html_e('Phone', 'sk-multi-address'); ?></label>
                    <input type="tel" name="phone" required>
                </div>
            </div>

            <div class="sk-form-field">
                <label><?php esc_html_e('Address Line 1', 'sk-multi-address'); ?></label>
                <input type="text" name="address_1" required>
            </div>

            <div class="sk-form-field">
                <label><?php esc_html_e('Address Line 2', 'sk-multi-address'); ?></label>
                <input type="text" name="address_2">
            </div>

            <div class="sk-form-row">
                <div class="sk-form-field">
                    <label><?php esc_html_e('Country', 'sk-multi-address'); ?></label>
                    <select name="country" class="sk-country-select" required>
                        <option value=""><?php esc_html_e('Select a country...', 'sk-multi-address'); ?></option>
                        <?php
                        $countries_obj = new WC_Countries();
                        $countries = $countries_obj->get_countries();
                        foreach ($countries as $code => $name) {
                            echo '<option value="' . esc_attr($code) . '">' . esc_html($name) . '</option>';
                        }
                        ?>
                    </select>
                </div>
                <div class="sk-form-field sk-state-field">
                    <label><?php esc_html_e('State', 'sk-multi-address'); ?></label>
                    <select name="state" class="sk-state-select" disabled required>
                        <option value=""><?php esc_html_e('Select a country first...', 'sk-multi-address'); ?></option>
                    </select>
                    <div class="sk-loading-spinner"></div>
                </div>
            </div>

            <div class="sk-form-row">
                <div class="sk-form-field">
                    <label><?php esc_html_e('Postcode', 'sk-multi-address'); ?></label>
                    <input type="text" name="postcode" required>
                </div>
                <div class="sk-form-field">
                    <label><?php esc_html_e('City', 'sk-multi-address'); ?></label>
                    <input type="text" name="city" required>
                </div>
            </div>

            <div class="sk-form-actions">
                <button type="submit" class="button"><?php esc_html_e('Save Address', 'sk-multi-address'); ?></button>
                <button type="button" class="button sk-reset-form" style="margin-left: 10px;"><?php esc_html_e('Cancel', 'sk-multi-address'); ?></button>
            </div>
        </form>
    </div>
</div>
