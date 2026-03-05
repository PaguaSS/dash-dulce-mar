describe('Accounting Module', () => {
    const mockInvoices = [
        {
            id: '1',
            serialNumber: 'FAC-20240124-0001',
            description: 'Order #101',
            clientId: '1',
            client: { id: '1', name: 'John', lastname: 'Doe' },
            total: 15000,
            paymentMethod: 'CASH',
            source: 'DASHBOARD',
            items: [
                { id: '1', type: 'RECIPE', name: 'Chocolate Cake', quantity: 1, unitPrice: 15000, subtotal: 15000, isIncluded: true }
            ],
            createdAt: '2024-01-24T10:00:00Z',
            updatedAt: '2024-01-24T10:00:00Z'
        },
        {
            id: '2',
            serialNumber: 'FAC-20240124-0002',
            description: 'Order #102',
            clientId: '2',
            client: { id: '2', name: 'Jane', lastname: 'Smith' },
            total: 5000,
            paymentMethod: 'SINPE',
            source: 'INSTAGRAM',
            items: [
                { id: '2', type: 'CUSTOM', name: 'Delivery Fee', quantity: 1, unitPrice: 5000, subtotal: 5000, isIncluded: true }
            ],
            createdAt: '2024-01-24T11:00:00Z',
            updatedAt: '2024-01-24T11:00:00Z'
        }
    ];

    const mockSummary = {
        totalSold: 20000,
        byPaymentMethod: {
            CASH: 15000,
            SINPE: 5000,
            CREDIT_CARD: 0,
            PAYPAL: 0
        },
        bySource: {
            DASHBOARD: 15000,
            INSTAGRAM: 5000,
            FACEBOOK: 0,
            TIKTOK: 0,
            WEBSITE: 0
        }
    };

    const mockClients = [
        { id: '1', name: 'John', lastname: 'Doe' },
        { id: '2', name: 'Jane', lastname: 'Smith' }
    ];

    const mockQuotation = {
        id: 'q-1',
        description: 'Mock Quotation',
        clientId: '1',
        client: { id: '1', name: 'John', lastname: 'Doe' },
        taxRate: 13,
        profitMargin: 20,
        subtotal: 10000,
        tax: 1300,
        profit: 2260,
        total: 13560,
        items: [
            { type: 'CUSTOM', name: 'Base Cake', quantity: 1, unitPrice: 10000, subtotal: 10000 }
        ]
    };

    beforeEach(() => {
        cy.viewport(1280, 720);

        // Mock Invoices API
        // Mock Invoices API
        cy.intercept({ method: 'GET', url: /\/api\/invoices(\?.*)?$/ }, {
            body: {
                data: mockInvoices,
                meta: { total: 2, page: 1, limit: 10, totalPages: 1 }
            }
        }).as('getInvoices');

        cy.intercept({ method: 'GET', url: /\/api\/invoices\/summary(\?.*)?$/ }, {
            body: mockSummary
        }).as('getSummary');

        cy.intercept({ method: 'GET', url: /\/api\/invoices\/1(\?.*)?$/ }, {
            body: mockInvoices[0]
        }).as('getInvoice');

        cy.intercept({ method: 'POST', url: /\/api\/invoices(\?.*)?$/ }, (req) => {
            req.reply({
                statusCode: 201,
                body: { ...req.body, id: 'new-inv-id', serialNumber: 'FAC-20240124-0003' }
            });
        }).as('createInvoice');

        cy.intercept({ method: 'PUT', url: /\/api\/invoices\/[^/]+(\?.*)?$/ }, (req) => {
            req.reply({ body: { ...mockInvoices[0], ...req.body } });
        }).as('updateInvoice');

        cy.intercept({ method: 'DELETE', url: /\/api\/invoices\/[^/]+(\?.*)?$/ }, { statusCode: 204 }).as('deleteInvoice');

        // Mock Related APIs
        // Mock Related APIs
        cy.intercept({ method: 'GET', url: /\/api\/clients(\?.*)?$/ }, { body: { data: mockClients, total: 2 } }).as('getClients');
        cy.intercept({ method: 'GET', url: /\/api\/quotations\/q-1(\?.*)?$/ }, { body: mockQuotation }).as('getQuotation');
        cy.intercept({ method: 'GET', url: /\/api\/app-config\/calculator-params(\?.*)?$/ }, { body: { crFee: 13 } }).as('getCalcParams');
        cy.intercept({ method: 'GET', url: /\/api\/recipes(\?.*)?$/ }, { body: { data: [], total: 0 } });
        cy.intercept({ method: 'GET', url: /\/api\/ingredients(\?.*)?$/ }, { body: { data: [], total: 0 } });

        // Login session
        cy.visit('/dashboard/accounting', {
            onBeforeLoad: (win) => {
                win.localStorage.clear();
                win.localStorage.setItem('user', JSON.stringify({ id: '1', username: 'admin' }));
                win.localStorage.setItem('accessToken', 'mock-token');
                win.localStorage.setItem('i18nextLng', 'es');
            }
        });
    });

    it('should display the accounting list and summary cards', () => {
        cy.wait(['@getInvoices', '@getSummary']);
        cy.contains('Ventas y Facturación').should('be.visible');
        cy.contains('FAC-20240124-0001').should('be.visible');
        cy.contains('Order #101').should('be.visible');
        cy.contains('Ventas Totales').parent().invoke('text').should('match', /₡20[.,\s]*000/);
        cy.contains('Efectivo').parent().invoke('text').should('match', /₡15[.,\s]*000/);
    });

    it('should filter invoices by search', () => {
        cy.get('input[placeholder="Buscar"]').type('101');
        cy.wait('@getInvoices');
    });

    it('should navigate to create invoice page', () => {
        cy.wait(['@getInvoices', '@getSummary']);
        cy.contains('button', 'Crear').click();
        cy.url({ timeout: 10000 }).should('include', '/dashboard/accounting/new');
    });

    it('should show invoice form elements', () => {
        // Visit the new invoice page directly with proper mocks
        cy.intercept({ method: 'GET', url: /\/api\/clients(\?.*)?$/ }, {
            body: { data: [{ id: '1', name: 'John', lastname: 'Doe' }], total: 1 }
        });
        cy.intercept({ method: 'GET', url: /\/api\/recipes(\?.*)?$/ }, { body: { data: [], total: 0 } });
        cy.intercept({ method: 'GET', url: /\/api\/ingredients(\?.*)?$/ }, { body: { data: [], total: 0 } });
        cy.intercept({ method: 'GET', url: /\/api\/app-config\/calculator-params(\?.*)?$/ }, { body: { crFee: 13 } });

        cy.visit('/dashboard/accounting/new', {
            onBeforeLoad: (win) => {
                win.localStorage.clear();
                win.localStorage.setItem('user', JSON.stringify({ id: '1', username: 'admin' }));
                win.localStorage.setItem('accessToken', 'mock-token');
                win.localStorage.setItem('i18nextLng', 'es');
            }
        });

        // Wait for page to load
        cy.url({ timeout: 10000 }).should('include', '/dashboard/accounting/new');

        // Verify form input elements are present
        cy.get('input').should('exist');
    });

    it('should display invoice form with correct title', () => {
        // Visit the new invoice page directly with all needed mocks
        cy.intercept({ method: 'GET', url: /\/api\/clients(\?.*)?$/ }, {
            body: { data: [{ id: '1', name: 'John', lastname: 'Doe' }], total: 1 }
        });
        cy.intercept({ method: 'GET', url: /\/api\/recipes(\?.*)?$/ }, { body: { data: [], total: 0 } });
        cy.intercept({ method: 'GET', url: /\/api\/ingredients(\?.*)?$/ }, { body: { data: [], total: 0 } });
        cy.intercept({ method: 'GET', url: /\/api\/app-config\/calculator-params(\?.*)?$/ }, { body: { crFee: 13 } });

        cy.visit('/dashboard/accounting/new', {
            onBeforeLoad: (win) => {
                win.localStorage.clear();
                win.localStorage.setItem('user', JSON.stringify({ id: '1', username: 'admin' }));
                win.localStorage.setItem('accessToken', 'mock-token');
                win.localStorage.setItem('i18nextLng', 'es');
            }
        });

        cy.url({ timeout: 10000 }).should('include', '/dashboard/accounting/new');
        cy.contains('Crear Factura').should('be.visible');
    });

    it('should delete an invoice', () => {
        cy.wait(['@getInvoices', '@getSummary']);
        // Use aria-label added earlier
        cy.get('button[aria-label="Eliminar"]').first().click();
        cy.contains('button', 'Sí, eliminarlo').click();
        cy.wait('@deleteInvoice');
        cy.contains('Eliminado exitosamente').should('be.visible');
    });
});
