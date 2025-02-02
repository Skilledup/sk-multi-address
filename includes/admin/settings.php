<?php
if (!defined('ABSPATH')) {
    exit;
}

class SK_Multi_Address_Settings {
    private $options;

    public function __construct() {
        add_action('admin_menu', array($this, 'add_plugin_page'));
        add_action('admin_init', array($this, 'page_init'));
    }

    public function add_plugin_page() {
        if (!current_user_can('manage_options')) {
            return;
        }
        
        add_submenu_page(
            'woocommerce',
            __('Multiple Addresses Settings', 'sk-multi-address'),
            __('Multiple Addresses', 'sk-multi-address'),
            'manage_options',
            'sk-multi-address-settings',
            array($this, 'create_admin_page')
        );
    }

    public function create_admin_page() {
        $this->options = get_option('sk_multi_address_settings');
        ?>
        <div class="wrap">
            <h1><?php echo esc_html__('Multiple Addresses Settings', 'sk-multi-address'); ?></h1>
            <?php settings_errors(); ?>
            <form method="post" action="options.php">
                <?php
                wp_nonce_field('sk_multi_address_settings_nonce', 'sk_multi_address_nonce');
                settings_fields('sk_multi_address_option_group');
                do_settings_sections('sk-multi-address-settings');
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }

    public function page_init() {
        register_setting(
            'sk_multi_address_option_group',
            'sk_multi_address_settings',
            array($this, 'sanitize')
        );

        add_settings_section(
            'sk_multi_address_setting_section',
            __('Address Fields Settings', 'sk-multi-address'),
            array($this, 'section_info'),
            'sk-multi-address-settings'
        );

        $fields = array(
            'address_name' => __('Address Name Field', 'sk-multi-address'),
            'email' => __('Email Field', 'sk-multi-address'),
            'phone' => __('Phone Field', 'sk-multi-address'),
            'address_2' => __('Address Line 2 Field', 'sk-multi-address'),
        );

        foreach ($fields as $field_id => $field_label) {
            add_settings_field(
                'show_' . $field_id,
                $field_label,
                array($this, 'field_callback'),
                'sk-multi-address-settings',
                'sk_multi_address_setting_section',
                array('field_id' => $field_id)
            );
        }
    }

    public function sanitize($input) {
        // Verify nonce
        if (!isset($_POST['sk_multi_address_nonce']) || 
            !wp_verify_nonce($_POST['sk_multi_address_nonce'], 'sk_multi_address_settings_nonce')) {
            add_settings_error(
                'sk_multi_address_settings',
                'nonce_error',
                __('Security check failed.', 'sk-multi-address'),
                'error'
            );
            return get_option('sk_multi_address_settings');
        }
        
        $new_input = array();
        $fields = array('address_name', 'email', 'phone', 'address_2');
        
        foreach ($fields as $field) {
            $new_input['show_' . $field] = isset($input['show_' . $field]) ? 1 : 0;
        }
        
        // Add an admin notice if all fields are disabled
        if (!array_sum($new_input)) {
            add_settings_error(
                'sk_multi_address_settings',
                'all_fields_disabled',
                __('At least one field should be enabled.', 'sk-multi-address'),
                'error'
            );
            // Return old options if validation fails
            return get_option('sk_multi_address_settings');
        }
        
        return $new_input;
    }

    public function section_info() {
        echo esc_html__('Choose which address fields to display in the form:', 'sk-multi-address');
    }

    public function field_callback($args) {
        $field_id = $args['field_id'];
        $checked = isset($this->options['show_' . $field_id]) ? $this->options['show_' . $field_id] : 1;
        ?>
        <label>
            <input type="checkbox" 
                   name="sk_multi_address_settings[show_<?php echo esc_attr($field_id); ?>]" 
                   value="1" 
                   <?php checked($checked, 1); ?> />
            <?php echo esc_html__('Show this field', 'sk-multi-address'); ?>
        </label>
        <?php
    }

    public static function set_defaults() {
        $default_settings = array(
            'show_address_name' => 1,
            'show_email' => 1,
            'show_phone' => 1,
            'show_address_2' => 1
        );
        
        // Only add if the option doesn't exist
        if (!get_option('sk_multi_address_settings')) {
            add_option('sk_multi_address_settings', $default_settings);
        }
    }
}

if (is_admin()) {
    new SK_Multi_Address_Settings();
}