describe('Calculator Params Settings', () => {
    beforeEach(() => {
        cy.viewport(1280, 720);

        // CRITICAL: Mock auth refresh BEFORE visiting the page to prevent 403 redirects
        cy.intercept('POST', '**/api/auth/refresh-token', {
            statusCode: 200,
            body: { accessToken: 'new-mock-token', refreshToken: 'new-refresh-token' }
        }).as('refreshToken');

        cy.intercept('GET', '**/api/auth/refresh-token', {
            statusCode: 200,
            body: { accessToken: 'new-mock-token', refreshToken: 'new-refresh-token' }
        });

        // Mock all API endpoints that might be called
        cy.intercept('GET', '**/api/agenda*', { body: { data: [], total: 0 } });
        cy.intercept('GET', '**/api/invoices*', { body: { data: [], meta: { total: 0 } } });
        cy.intercept('GET', '**/api/quotations*', { body: { data: [], total: 0 } });

        // Mock Calculator Params API
        cy.intercept('GET', '**/api/app-config/calculator-params', {
            body: {
                gasPricePerLt: 650,
                averageKmPerLitre: 5,
                bakerPayPerHour: 4000,
                driverPayPerHour: 3000,
                waterPricePerLitre: 0.4,
                bakePricePerMin: 7,
                crFee: 0
            }
        }).as('getCalculatorParams');

        cy.intercept('PATCH', '**/api/app-config/calculator-params', (req) => {
            req.reply({
                body: {
                    gasPricePerLt: req.body.gasPricePerLt ?? 650,
                    averageKmPerLitre: req.body.averageKmPerLitre ?? 5,
                    bakerPayPerHour: req.body.bakerPayPerHour ?? 4000,
                    driverPayPerHour: req.body.driverPayPerHour ?? 3000,
                    waterPricePerLitre: req.body.waterPricePerLitre ?? 0.4,
                    bakePricePerMin: req.body.bakePricePerMin ?? 7,
                    crFee: req.body.crFee ?? 0
                }
            });
        }).as('updateCalculatorParams');

        // Mock app config
        cy.intercept('GET', '**/api/app-config', {
            body: { currencySign: '$' }
        }).as('getAppConfig');

        // Mock invoice params (needed by the dialog)
        cy.intercept('GET', '**/api/app-config/invoice-params', {
            body: {
                businessName: 'Test Business',
                location: 'Test Location',
                phone: '1234567890'
            }
        }).as('getInvoiceParams');

        // Mock PATCH for invoice params (dialog updates both)
        cy.intercept('PATCH', '**/api/app-config/invoice-params', {
            statusCode: 200,
            body: {
                businessName: 'Test Business',
                location: 'Test Location',
                phone: '1234567890'
            }
        }).as('updateInvoiceParams');

        // Login Mock
        cy.visit('/dashboard', {
            onBeforeLoad: (win) => {
                win.localStorage.clear();
                win.localStorage.setItem('user', JSON.stringify({ id: '1', username: 'admin', role: 'admin' }));
                win.localStorage.setItem('accessToken', 'mock-token');
                win.localStorage.setItem('refreshToken', 'mock-refresh-token');
                win.localStorage.setItem('i18nextLng', 'es');
            }
        });

        // Wait for dashboard to fully load
        cy.url({ timeout: 10000 }).should('include', '/dashboard');
        cy.get('[data-testid="settings-button"]', { timeout: 15000 }).should('exist');
    });

    it('should show settings button in toolbar', () => {
        cy.get('[data-testid="settings-button"]', { timeout: 10000 }).should('exist').and('be.visible');
    });

    it('should open calculator params dialog when clicking settings button', () => {
        // Use force:true to handle any overlay issues
        cy.get('[data-testid="settings-button"]', { timeout: 10000 })
            .should('be.visible')
            .click({ force: true });
        cy.wait('@getCalculatorParams');
        cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
        cy.contains('Configuración de Calculadora').should('be.visible');
    });

    it('should load and display current calculator params values', () => {
        cy.get('[data-testid="settings-button"]', { timeout: 10000 })
            .should('be.visible')
            .click({ force: true });
        cy.wait('@getCalculatorParams');

        // Fields use react-hook-form register which adds name attribute
        cy.get('[role="dialog"]', { timeout: 10000 }).within(() => {
            cy.get('input[name="gasPricePerLt"]').should('have.value', '650');
            cy.get('input[name="averageKmPerLitre"]').should('have.value', '5');
            cy.get('input[name="bakerPayPerHour"]').should('have.value', '4000');
        });
    });

    it('should update calculator params successfully', () => {
        cy.get('[data-testid="settings-button"]', { timeout: 10000 })
            .should('be.visible')
            .click({ force: true });
        cy.wait('@getCalculatorParams');

        cy.get('[role="dialog"]', { timeout: 10000 }).within(() => {
            cy.get('input[name="gasPricePerLt"]').clear().type('700');
            cy.contains('button', 'Guardar').click();
        });

        cy.wait('@updateCalculatorParams');
        cy.contains('Actualizado exitosamente').should('be.visible');
    });

    it('should close dialog on cancel', () => {
        cy.get('[data-testid="settings-button"]', { timeout: 10000 })
            .should('be.visible')
            .click({ force: true });
        cy.wait('@getCalculatorParams');

        cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');
        cy.get('[role="dialog"]').within(() => {
            cy.contains('button', 'Cancelar').click();
        });

        cy.get('[role="dialog"]').should('not.exist');
    });

    it('should show all calculator param fields', () => {
        cy.get('[data-testid="settings-button"]', { timeout: 10000 })
            .should('be.visible')
            .click({ force: true });
        cy.wait('@getCalculatorParams');

        cy.get('[role="dialog"]', { timeout: 10000 }).within(() => {
            cy.contains('Precio de Gasolina por Litro').should('be.visible');
            cy.contains('Pago Panadero por Hora').should('be.visible');
            cy.contains('CR Fee').should('be.visible');
        });
    });
});
