import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Authentication Flow', () => {
    test('should redirect unauthenticated users from /admin to /auth', async ({ page }) => {
        await page.goto(`${BASE_URL}/admin`);

        // Should redirect to auth page
        await expect(page).toHaveURL(/\/auth/);

        // Should show the login form
        await expect(page.getByText('Welcome Back')).toBeVisible();
    });

    test('should redirect unauthenticated users from /admin/create-event to /auth', async ({ page }) => {
        await page.goto(`${BASE_URL}/admin/create-event`);

        // Should redirect to auth page
        await expect(page).toHaveURL(/\/auth/);
    });

    test('should display auth page correctly', async ({ page }) => {
        await page.goto(`${BASE_URL}/auth`);

        // Check page elements
        await expect(page.getByText('Club Cult')).toBeVisible();
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should toggle between sign in and sign up', async ({ page }) => {
        await page.goto(`${BASE_URL}/auth`);

        // Initially shows sign in
        await expect(page.getByText('Welcome Back')).toBeVisible();

        // Click to switch to sign up
        await page.getByText("Don't have an account? Sign up").click();

        // Now shows sign up
        await expect(page.getByText('Create Account')).toBeVisible();
        await expect(page.getByLabel('Full Name')).toBeVisible();
    });

    test('should show validation errors for invalid login', async ({ page }) => {
        await page.goto(`${BASE_URL}/auth`);

        // Try to submit empty form
        await page.getByRole('button', { name: /sign in/i }).click();

        // HTML5 validation should prevent submission
        const emailInput = page.getByLabel('Email');
        await expect(emailInput).toHaveAttribute('required', '');
    });
});

test.describe('Home Page', () => {
    test('should load home page successfully', async ({ page }) => {
        await page.goto(BASE_URL);

        // Check hero section
        await expect(page.getByText('Your Campus, Your Culture')).toBeVisible();

        // Check search bar
        await expect(page.getByPlaceholder(/search events/i)).toBeVisible();

        // Check category filters
        await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    });

    test('should filter events by category', async ({ page }) => {
        await page.goto(BASE_URL);

        // Click on a category filter
        await page.getByRole('button', { name: 'Workshop' }).click();

        // Button should now be selected (has gradient class)
        await expect(page.getByRole('button', { name: 'Workshop' })).toHaveClass(/from-primary/);
    });

    test('should search events', async ({ page }) => {
        await page.goto(BASE_URL);

        // Type in search
        await page.getByPlaceholder(/search events/i).fill('test event');

        // Search should filter (we can't verify results without data, but no errors)
        await page.waitForTimeout(500);
    });
});

test.describe('Protected Routes - Student Access', () => {
    // These tests would require a logged-in student user
    // For now, we test the redirect behavior

    test('student should not access admin dashboard', async ({ page }) => {
        // Navigate to admin (will redirect to auth)
        await page.goto(`${BASE_URL}/admin`);

        // Should be on auth page
        await expect(page).toHaveURL(/\/auth/);
    });
});

test.describe('Create Event Form Validation', () => {
    // These tests require admin login - placeholder for CI with test credentials

    test.skip('should validate banner file type', async ({ page }) => {
        // TODO: Implement with test admin credentials
        // 1. Login as admin
        // 2. Navigate to /admin/create-event
        // 3. Try uploading a PDF
        // 4. Expect error "Only JPEG, PNG, and WebP images are allowed"
    });

    test.skip('should validate banner file size', async ({ page }) => {
        // TODO: Implement with test admin credentials
        // 1. Login as admin
        // 2. Navigate to /admin/create-event
        // 3. Try uploading >5MB image
        // 4. Expect error "Image must be less than 5MB"
    });

    test.skip('should require all fields', async ({ page }) => {
        // TODO: Implement with test admin credentials
        // 1. Login as admin
        // 2. Navigate to /admin/create-event
        // 3. Try submitting empty form
        // 4. Expect validation errors
    });
});

test.describe('Event Registration Flow', () => {
    test.skip('should redirect to auth when registering without login', async ({ page }) => {
        // TODO: Requires an existing event ID
        // await page.goto(`${BASE_URL}/events/some-event-id`);
        // await page.getByRole('button', { name: /register/i }).click();
        // await expect(page).toHaveURL(/\/auth/);
    });
});
