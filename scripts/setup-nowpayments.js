#!/usr/bin/env node

/**
 * NOWPayments Setup Script
 * 
 * This script helps configure NOWPayments integration for Opttius.
 * It validates API keys, tests connectivity, and sets up webhooks.
 * 
 * Usage: node scripts/setup-nowpayments.js
 */

const readline = require('readline');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

async function testNowPaymentsAPI(apiKey, isSandbox = true) {
    const baseUrl = isSandbox
        ? 'https://api-sandbox.nowpayments.io/v1'
        : 'https://api.nowpayments.io/v1';

    try {
        const response = await fetch(`${baseUrl}/status`, {
            headers: {
                'x-api-key': apiKey,
            },
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getCurrencies(apiKey, isSandbox = true) {
    const baseUrl = isSandbox
        ? 'https://api-sandbox.nowpayments.io/v1'
        : 'https://api.nowpayments.io/v1';

    try {
        const response = await fetch(`${baseUrl}/currencies`, {
            headers: {
                'x-api-key': apiKey,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch currencies`);
        }

        const data = await response.json();
        return data.currencies || [];
    } catch (error) {
        return [];
    }
}

function updateEnvFile(variables) {
    const envPath = path.join(process.cwd(), '.env.local');

    let envContent = '';
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or add each variable
    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
            envContent += `\n${key}=${value}`;
        }
    });

    fs.writeFileSync(envPath, envContent);
    log.success('Environment variables updated in .env.local');
}

async function main() {
    console.clear();
    log.title('🚀 NOWPayments Setup for Opttius');

    log.info('This script will help you configure NOWPayments integration.');
    log.info('You will need your API keys from https://nowpayments.io\n');

    // Step 1: Choose environment
    const useSandbox = (await question('Use Sandbox mode for testing? (y/n): ')).toLowerCase() === 'y';

    // Step 2: Get API Key
    log.title('Step 1: API Key Configuration');
    const apiKey = await question(`Enter your ${useSandbox ? 'Sandbox' : 'Production'} API Key: `);

    if (!apiKey || apiKey.trim() === '') {
        log.error('API Key is required!');
        rl.close();
        process.exit(1);
    }

    // Step 3: Test API Connection
    log.title('Step 2: Testing API Connection');
    log.info('Connecting to NOWPayments API...');

    const testResult = await testNowPaymentsAPI(apiKey, useSandbox);

    if (!testResult.success) {
        log.error(`API connection failed: ${testResult.error}`);
        log.warn('Please check your API key and try again.');
        rl.close();
        process.exit(1);
    }

    log.success('API connection successful!');
    log.info(`API Status: ${testResult.data.message || 'OK'}`);

    // Step 4: Get supported currencies
    log.title('Step 3: Fetching Supported Currencies');
    const currencies = await getCurrencies(apiKey, useSandbox);

    if (currencies.length > 0) {
        log.success(`${currencies.length} cryptocurrencies available`);
        log.info(`Popular currencies: ${currencies.slice(0, 10).join(', ')}`);
    }

    // Step 5: IPN Secret
    log.title('Step 4: IPN Secret Configuration');
    log.info('The IPN Secret is used to verify webhook signatures.');
    log.info('Find it in NOWPayments Dashboard > Settings > IPN');

    const ipnSecret = await question('Enter your IPN Secret: ');

    if (!ipnSecret || ipnSecret.trim() === '') {
        log.warn('IPN Secret not provided. Webhook verification will be disabled.');
        log.warn('This is NOT recommended for production!');
    } else {
        log.success('IPN Secret configured');
    }

    // Step 6: Webhook URL
    log.title('Step 5: Webhook Configuration');
    const baseUrl = await question('Enter your base URL (e.g., https://your-domain.com): ');

    if (baseUrl) {
        const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/webhooks/nowpayments`;
        log.info(`Your webhook URL: ${webhookUrl}`);
        log.warn('Make sure to configure this URL in NOWPayments Dashboard > Settings > IPN');
    }

    // Step 7: Save to .env.local
    log.title('Step 6: Saving Configuration');

    const envVars = {
        NOWPAYMENTS_SANDBOX_MODE: useSandbox ? 'true' : 'false',
    };

    if (useSandbox) {
        envVars.NOWPAYMENTS_SANDBOX_API_KEY = apiKey;
    } else {
        envVars.NOWPAYMENTS_API_KEY = apiKey;
    }

    if (ipnSecret) {
        envVars.NOWPAYMENTS_IPN_SECRET = ipnSecret;
    }

    const shouldSave = (await question('Save configuration to .env.local? (y/n): ')).toLowerCase() === 'y';

    if (shouldSave) {
        updateEnvFile(envVars);
    } else {
        log.info('Configuration not saved. Here are your variables:');
        console.log('\n' + Object.entries(envVars).map(([k, v]) => `${k}=${v}`).join('\n'));
    }

    // Step 8: Summary
    log.title('✅ Setup Complete!');
    log.success('NOWPayments integration is configured.');

    console.log('\n' + colors.bright + 'Next Steps:' + colors.reset);
    console.log('1. Configure webhook URL in NOWPayments dashboard');
    console.log('2. Test the integration with a small payment');
    console.log('3. Monitor webhook logs for incoming payments');
    console.log('4. Review security settings before going to production\n');

    log.info('For testing, you can use the sandbox dashboard to simulate payments.');
    log.info('Documentation: https://documenter.getpostman.com/view/7907941/S1a32n38\n');

    rl.close();
}

main().catch((error) => {
    log.error(`Setup failed: ${error.message}`);
    rl.close();
    process.exit(1);
});
