<?php
/**
 * Plugin Name: SK Multiple Addresses for WooCommerce
 * Plugin URI: 
 * Description: Enhance WooCommerce with multiple address management - lets customers save, edit and select from multiple shipping/billing addresses during checkout
 * Version: 1.0.0
 * Author: Mohammad Anbarestany
 * Author URI: https://anbarestany.ir
 * Text Domain: sk-multi-address
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.2
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// Check if WooCommerce is active
if (!in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')))) {
    return;
}

// Add after the initial plugin checks
require_once plugin_dir_path(__FILE__) . 'includes/admin/settings.php';

register_activation_hook(__FILE__, array('SK_Multi_Address_Settings', 'set_defaults'));

class SK_Multiple_Addresses {
    
    public function __construct() {
        // Load text domain for translations
        add_action('plugins_loaded', array($this, 'load_plugin_textdomain'));
        
        // Add menu item to My Account page
        add_filter('woocommerce_account_menu_items', array($this, 'add_addresses_menu_item'));
        add_action('init', array($this, 'add_addresses_endpoint'));
        
        // Register endpoints
        add_action('woocommerce_account_addresses_endpoint', array($this, 'addresses_endpoint_content'));
        
        // Add scripts and styles
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        
        // Ajax handlers
        add_action('wp_ajax_sk_save_address', array($this, 'save_address'));
        add_action('wp_ajax_sk_delete_address', array($this, 'delete_address'));
        add_action('wp_ajax_sk_get_address', array($this, 'get_address'));
        
        // Add addresses to checkout
        add_action('woocommerce_before_checkout_billing_form', array($this, 'add_address_selector_to_checkout'));

        // Add this to your main plugin class
        add_action('wp_ajax_sk_get_states', array($this, 'get_states_ajax'));
        add_action('wp_ajax_nopriv_sk_get_states', array($this, 'get_states_ajax'));
    }

    public function load_plugin_textdomain() {
        load_plugin_textdomain(
            'sk-multi-address',
            false,
            dirname(plugin_basename(__FILE__)) . '/languages'
        );
    }

    public function add_addresses_endpoint() {
        add_rewrite_endpoint('addresses', EP_ROOT | EP_PAGES);
        flush_rewrite_rules();
    }

    public function add_addresses_menu_item($items) {
        $items['addresses'] = __('My Addresses', 'sk-multi-address');
        return $items;
    }

    public function addresses_endpoint_content() {
        // Get saved addresses
        $saved_addresses = get_user_meta(get_current_user_id(), 'sk_saved_addresses', true);
        if (!is_array($saved_addresses)) {
            $saved_addresses = array();
        }
        
        // Include template
        include plugin_dir_path(__FILE__) . 'templates/addresses.php';
    }

    public function enqueue_scripts() {
        if (is_account_page() || is_checkout()) {
            wp_enqueue_style('sk-multi-address', 
                plugin_dir_url(__FILE__) . 'assets/css/sk-multi-address.css',
                array(),
                '1.0.0'
            );
            
            wp_enqueue_script('sk-multi-address', 
                plugin_dir_url(__FILE__) . 'assets/js/sk-multi-address.js',
                array('jquery'),
                '1.0.0',
                true
            );
            
            wp_localize_script('sk-multi-address', 'skMultiAddress', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('sk-multi-address'),
                'i18n' => array(
                    'confirmDelete' => __('Are you sure you want to delete this address?', 'sk-multi-address'),
                    'updateAddress' => __('Update Address', 'sk-multi-address'),
                    'addNewAddress' => __('Add New Address', 'sk-multi-address'),
                    'selectCountry' => __('Select a country...', 'sk-multi-address'),
                    'selectState' => __('Select a state...', 'sk-multi-address'),
                    'selectCountryFirst' => __('Select a country first...', 'sk-multi-address'),
                    'selectStateManually' => __('Please select your state manually', 'sk-multi-address'),
                )
            ));

            // Enqueue Select2
            wp_enqueue_style('select2', 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css');
            wp_enqueue_script('select2', 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js', array('jquery'), '4.1.0', true);
        }
    }

    private function convert_numbers_to_latin($string) {
        $arabic_eastern = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        $arabic_western = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        
        // First convert eastern Arabic numbers
        $string = str_replace($arabic_eastern, $arabic_western, $string);
        
        // Also convert Persian numbers if present
        $persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return str_replace($persian, $arabic_western, $string);
    }

    public function save_address() {
        check_ajax_referer('sk-multi-address', 'nonce');
        
        $address_data = $_POST['address'];
        
        // Convert phone and postcode numbers to Latin
        if (isset($address_data['phone'])) {
            $address_data['phone'] = $this->convert_numbers_to_latin($address_data['phone']);
        }
        if (isset($address_data['postcode'])) {
            $address_data['postcode'] = $this->convert_numbers_to_latin($address_data['postcode']);
        }
        
        $user_id = get_current_user_id();
        
        $saved_addresses = get_user_meta($user_id, 'sk_saved_addresses', true);
        if (!is_array($saved_addresses)) {
            $saved_addresses = array();
        }
        
        // Check if this is an edit or new address
        if (isset($_POST['address_id']) && !empty($_POST['address_id'])) {
            $address_id = sanitize_text_field($_POST['address_id']);
            if (!isset($saved_addresses[$address_id])) {
                wp_send_json_error(__('Address not found', 'sk-multi-address'));
            }
        } else {
            $address_id = uniqid('addr_');
        }
        
        $saved_addresses[$address_id] = $address_data;
        update_user_meta($user_id, 'sk_saved_addresses', $saved_addresses);
        
        wp_send_json_success(array(
            'message' => isset($_POST['address_id']) 
                ? __('Address updated successfully', 'sk-multi-address')
                : __('Address saved successfully', 'sk-multi-address'),
            'address_id' => $address_id
        ));
    }

    public function delete_address() {
        check_ajax_referer('sk-multi-address', 'nonce');
        
        $address_id = $_POST['address_id'];
        $user_id = get_current_user_id();
        
        $saved_addresses = get_user_meta($user_id, 'sk_saved_addresses', true);
        if (isset($saved_addresses[$address_id])) {
            unset($saved_addresses[$address_id]);
            update_user_meta($user_id, 'sk_saved_addresses', $saved_addresses);
            wp_send_json_success(__('Address deleted successfully', 'sk-multi-address'));
        }
        
        wp_send_json_error(__('Address not found', 'sk-multi-address'));
    }

    public function get_address() {
        check_ajax_referer('sk-multi-address', 'nonce');
        
        $address_id = $_POST['address_id'];
        $user_id = get_current_user_id();
        
        $saved_addresses = get_user_meta($user_id, 'sk_saved_addresses', true);
        if (isset($saved_addresses[$address_id])) {
            wp_send_json_success($saved_addresses[$address_id]);
        }
        
        wp_send_json_error(__('Address not found', 'sk-multi-address'));
    }

    public function add_address_selector_to_checkout() {
        $saved_addresses = get_user_meta(get_current_user_id(), 'sk_saved_addresses', true);
        if (!empty($saved_addresses)) {
            include plugin_dir_path(__FILE__) . 'templates/checkout-address-selector.php';
        }
    }

    public function get_states_ajax() {
        check_ajax_referer('sk-multi-address', 'nonce');
        
        $country_code = isset($_POST['country']) ? sanitize_text_field($_POST['country']) : '';
        
        if (empty($country_code)) {
            wp_send_json_error('Country code is required');
        }
        
        $countries_obj = new WC_Countries();
        $states = $countries_obj->get_states($country_code);
        
        if (empty($states)) {
            wp_send_json_success(array());
        } else {
            wp_send_json_success($states);
        }
    }

    public static function is_field_visible($field) {
        $options = get_option('sk_multi_address_settings', array());
        $default_visible = array(
            'address_name' => 1,
            'email' => 1,
            'phone' => 1,
            'address_2' => 1
        );
        
        return isset($options['show_' . $field]) ? 
            (bool) $options['show_' . $field] : 
            $default_visible[$field];
    }
}

// Initialize plugin
new SK_Multiple_Addresses();
