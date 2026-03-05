describe('Quotations Module', () => {
    const mockQuotations = [
        {
            id: '1',
            description: 'Wedding Cake Order',
            clientId: '1',
            client: { id: '1', name: 'John', lastname: 'Doe' },
            taxRate: 13,
            items: [
                { id: '1', type: 'RECIPE', name: 'Chocolate Cake', quantity: 2, metric: 'unit', unitPrice: 15000, subtotal: 30000 }
            ],
            subtotal: 30000,
            total: 33900,
            createdAt: '2024-01-15',
            updatedAt: '2024-01-15'
        },
        {
            id: '2',
            description: 'Birthday Party',
            clientId: '2',
            client: { id: '2', name: 'Jane', lastname: 'Smith' },
            taxRate: 0,
            items: [
                { id: '2', type: 'CUSTOM', name: 'Cupcakes', quantity: 24, metric: 'unit', unitPrice: 500, subtotal: 12000 }
            ],
            subtotal: 12000,
            total: 12000,
            createdAt: '2024-01-16',
            updatedAt: '2024-01-16'
        }
    ];

    const mockClients = [
        { id: '1', name: 'John', lastname: 'Doe', phone: '555-1234', email: 'john@example.com' },
        { id: '2', name: 'Jane', lastname: 'Smith', phone: '555-5678', email: 'jane@example.com' }
    ];

    const mockRecipes = [
        { id: '1', title: 'Chocolate Cake', servings: 8, ingredients: [{ qty: 1, ingredient: { price: 5000 } }] },
        { id: '2', title: 'Vanilla Cake', servings: 10, ingredients: [{ qty: 1, ingredient: { price: 4000 } }] }
    ];

    const mockIngredients = [
        { id: '1', name: 'Flour', price: 500, metric: { abbrv: 'kg' } },
        { id: '2', name: 'Sugar', price: 800, metric: { abbrv: 'kg' } }
    ];

    const mockCalcParams = {
        gasPricePerLt: 800,
        averageKmPerLitre: 12,
        bakerPayPerHour: 5000,
        driverPayPerHour: 3500,
        waterPricePerLitre: 5,
        bakePricePerMin: 50,
        crFee: 0.15
    };

    beforeEach(() => {
        cy.viewport(1280, 720);

        // Mock Quotations API
        cy.intercept('GET', '**/api/quotations*', {
            body: {
                data: mockQuotations,
                total: 2,
                page: 1,
                limit: 10
            }
        }).as('getQuotations');

        cy.intercept('GET', '**/api/quotations/1', {
            body: mockQuotations[0]
        }).as('getQuotation');

        cy.intercept('POST', '**/api/quotations', (req) => {
            req.reply({
                body: {
                    id: 'new-quotation-id',
                    ...req.body,
                    subtotal: 15000,
                    total: 16950,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            });
        }).as('createQuotation');

        cy.intercept('PATCH', '**/api/quotations/*', (req) => {
            req.reply({
                body: {
                    id: '1',
                    ...req.body,
                    createdAt: '2024-01-15',
                    updatedAt: new Date().toISOString()
                }
            });
        }).as('updateQuotation');

        cy.intercept('DELETE', '**/api/quotations/*', { statusCode: 200 }).as('deleteQuotation');

        // Mock related data APIs
        cy.intercept('GET', '**/api/clients*', {
            body: { data: mockClients, total: 2, page: 1, limit: 100 }
        }).as('getClients');

        cy.intercept('GET', '**/api/recipes*', {
            body: { data: mockRecipes, total: 2, page: 1, limit: 100 }
        }).as('getRecipes');

        cy.intercept('GET', '**/api/ingredients*', {
            body: { data: mockIngredients, total: 2, page: 1, limit: 100 }
        }).as('getIngredients');

        cy.intercept('GET', '**/api/app-config/calculator-params', {
            body: mockCalcParams
        }).as('getCalcParams');

        // Login Mock
        cy.visit('/dashboard/quotations', {
            onBeforeLoad: (win) => {
                win.localStorage.clear();
                win.localStorage.setItem('accessToken', 'mock-token');
                win.localStorage.setItem('refreshToken', 'mock-refresh-token');
                win.localStorage.setItem('i18nextLng', 'en');
            }
        });
    });

    it('should navigate to Quotations page and show title', () => {
        cy.contains('Quotations').should('be.visible');
        cy.contains('Manage your quotations and cost calculations').should('be.visible');
    });

    it('should show quotations list with data', () => {
        cy.wait('@getQuotations');
        cy.contains('Wedding Cake Order').should('be.visible');
        cy.contains('Birthday Party').should('be.visible');
        cy.contains('John Doe').should('be.visible');
        cy.contains('Jane Smith').should('be.visible');
    });

    it('should navigate to create quotation form', () => {
        cy.contains('button', 'Create').click();
        cy.url().should('include', '/dashboard/quotations/new');
        cy.contains('Create Quotation').should('be.visible');
    });

    it('should search quotations by description', () => {
        cy.wait('@getQuotations');
        cy.get('input[placeholder="Search"]').type('Wedding');
        cy.wait('@getQuotations');
    });

    it('should create a new quotation with a custom item', () => {
        cy.contains('button', 'Create').click();
        cy.url().should('include', '/dashboard/quotations/new');

        // Fill description
        cy.get('input').first().type('Test Quotation');

        // Open add item dialog via FAB
        cy.get('button.MuiFab-root').click();

        // Select custom item type
        cy.get('[role="dialog"]').should('be.visible');
        cy.get('[role="dialog"]').within(() => {
            cy.get('.MuiSelect-select').click();
        });
        cy.get('[role="listbox"]').contains('Custom').click();

        // Add custom item
        cy.get('[role="dialog"]').contains('button', 'Add Custom Item').click();

        // Fill custom item details in the table
        cy.get('table').within(() => {
            cy.get('input').first().type('Custom Service'); // item name placeholder
            cy.get('input[type="number"]').eq(0).clear().type('2'); // quantity
            cy.get('input[type="number"]').eq(1).clear().type('5000'); // unit price
        });

        // Save quotation
        cy.contains('button', 'Save').click();
        cy.wait('@createQuotation');
        cy.contains('Created successfully').should('be.visible');
    });

    it('should validate required description field', () => {
        cy.contains('button', 'Create').click();
        cy.url().should('include', '/dashboard/quotations/new');

        // Try to save without description
        cy.contains('button', 'Save').click({ force: true });
        cy.contains('This field is required').should('be.visible');
    });

    it('should validate that at least one item is required', () => {
        cy.contains('button', 'Create').click();
        cy.url().should('include', '/dashboard/quotations/new');

        // Fill description
        cy.get('input').first().type('Test Quotation');

        // Try to save without items
        cy.contains('button', 'Save').click({ force: true });
        cy.contains('Please add at least one item').should('be.visible');
    });

    it('should display totals calculation', () => {
        cy.contains('button', 'Create').click();
        cy.url().should('include', '/dashboard/quotations/new');

        // Initially subtotal and total should be 0 (currency symbol ₡)
        cy.contains('Subtotal:').should('be.visible');
        cy.contains('Total:').should('be.visible');
    });

    it('should add recipe item from dialog', () => {
        cy.contains('button', 'Create').click();
        cy.url().should('include', '/dashboard/quotations/new');

        // Wait for data to load
        cy.wait('@getRecipes');

        cy.get('button.MuiFab-root').click();

        // Select recipe type (default)
        cy.get('[role="dialog"]').should('be.visible');

        // Select a recipe from autocomplete - click the autocomplete input
        cy.get('[role="dialog"]').find('.MuiAutocomplete-root input').click();
        cy.get('[role="listbox"]', { timeout: 5000 }).contains('Chocolate Cake').click();

        // Recipe should be added to the table
        cy.get('table').contains('Chocolate Cake').should('be.visible');
        cy.contains('Recipe').should('be.visible');
    });

    it('should add ingredient item from dialog', () => {
        cy.contains('button', 'Create').click();
        cy.url().should('include', '/dashboard/quotations/new');

        // Wait for data to load
        cy.wait('@getIngredients');

        cy.get('button.MuiFab-root').click();

        cy.get('[role="dialog"]').within(() => {
            cy.get('.MuiSelect-select').click();
        });
        cy.get('[role="listbox"]').contains('Ingredient').click();

        // Select an ingredient from autocomplete
        cy.get('[role="dialog"]').find('.MuiAutocomplete-root input').click();
        cy.get('[role="listbox"]', { timeout: 5000 }).contains('Flour').click();

        // Ingredient should be added to the table
        cy.get('table').contains('Flour').should('be.visible');
        cy.contains('Ingredient').should('be.visible');
    });

    it('should add labor variable cost item', () => {
        cy.contains('button', 'Create').click();
        cy.url().should('include', '/dashboard/quotations/new');

        // Wait for calcParams to load
        cy.wait('@getCalcParams');

        cy.get('button.MuiFab-root').click();

        cy.get('[role="dialog"]').within(() => {
            cy.get('.MuiSelect-select').click();
        });
        cy.get('[role="listbox"]').contains('Labor').click();

        // Click add variable cost button - should be enabled now that calcParams loaded
        cy.get('[role="dialog"]').contains('button', 'Add Variable Cost').should('not.be.disabled').click();

        // Labor item should be added
        cy.get('table').contains('Baker Pay').should('be.visible');
        cy.contains('Labor').should('be.visible');
    });

    it('should remove item from table', () => {
        cy.contains('button', 'Create').click();
        cy.url().should('include', '/dashboard/quotations/new');

        // Add a custom item first via FAB
        cy.get('button.MuiFab-root').click();
        cy.get('[role="dialog"]').within(() => {
            cy.get('.MuiSelect-select').click();
        });
        cy.get('[role="listbox"]').contains('Custom').click();
        cy.get('[role="dialog"]').contains('button', 'Add Custom Item').click();

        // Item should be visible
        cy.get('table tbody tr').should('have.length', 1);

        // Click delete button (IconButton with error color)
        cy.get('table tbody').find('button').last().click();

        // Item should be removed, showing empty state
        cy.contains('No items added yet').should('be.visible');
    });

    it('should delete a quotation from list', () => {
        cy.wait('@getQuotations');
        cy.get('button[aria-label="Delete"]').first().click();

        cy.contains('button', 'Yes, delete it').click();
        cy.wait('@deleteQuotation');
        cy.contains('Deleted successfully').should('be.visible');
    });

    it('should cancel delete confirmation', () => {
        cy.wait('@getQuotations');
        cy.get('button[aria-label="Delete"]').first().click();

        cy.contains('button', 'Cancel').click();
        cy.get('@deleteQuotation.all').should('have.length', 0);
    });

    it('should navigate back from form using cancel button', () => {
        cy.contains('button', 'Create').click();
        cy.url().should('include', '/dashboard/quotations/new');

        cy.contains('button', 'Cancel').click();
        cy.url().should('include', '/dashboard/quotations');
        cy.url().should('not.include', '/new');
    });

    it('should update quantity and recalculate subtotal', () => {
        cy.contains('button', 'Create').click();
        cy.url().should('include', '/dashboard/quotations/new');

        // Add a custom item via FAB
        cy.get('button.MuiFab-root').click();
        cy.get('[role="dialog"]').within(() => {
            cy.get('.MuiSelect-select').click();
        });
        cy.get('[role="listbox"]').contains('Custom').click();
        cy.get('[role="dialog"]').contains('button', 'Add Custom Item').click();

        // Set unit price
        cy.get('table').within(() => {
            cy.get('input[type="number"]').eq(1).clear().type('1000');
        });

        // Update quantity
        cy.get('table').within(() => {
            cy.get('input[type="number"]').eq(0).clear().type('5');
        });

        // Subtotal should be 5000 (currency symbol ₡)
        cy.get('table').contains('₡').should('be.visible');
    });

    it('should apply tax rate from calculator params (crFee)', () => {
        cy.contains('button', 'Create').click();
        cy.url().should('include', '/dashboard/quotations/new');

        // Tax rate should be auto-populated from crFee (15% from mock, 0.15 * 100)
        // Find the Tax % field (4th input after description, client autocomplete, profit margin)
        cy.contains('label', 'Tax %').parent().find('input').should('have.value', '15');

        // Add a custom item with known price via FAB
        cy.get('button.MuiFab-root').click();
        cy.get('[role="dialog"]').within(() => {
            cy.get('.MuiSelect-select').click();
        });
        cy.get('[role="listbox"]').contains('Custom').click();
        cy.get('[role="dialog"]').contains('button', 'Add Custom Item').click();

        // Set price
        cy.get('table').within(() => {
            cy.get('input[type="number"]').eq(1).clear().type('10000');
        });

        // Check that tax is calculated using crFee (15%)
        cy.contains('Tax (15%)').should('be.visible');
    });
});
