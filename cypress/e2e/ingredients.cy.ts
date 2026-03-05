
describe('Ingredients & Metrics Module', () => {
    beforeEach(() => {
        cy.viewport(1280, 720);

        // Mock Metrics API
        cy.intercept('GET', '**/api/metrics*', {
            body: {
                data: [
                    { id: '1', title: 'Kilogram', abbrv: 'kg', createdAt: '2023-01-01', updatedAt: '2023-01-01' }
                ],
                total: 1,
                page: 1,
                limit: 10
            }
        }).as('getMetrics');

        cy.intercept('POST', '**/api/metrics', (req) => {
            req.reply({
                body: { id: 'new-id', title: req.body.title, abbrv: req.body.abbrv, createdAt: '2023-01-01', updatedAt: '2023-01-01' }
            });
        }).as('createMetric');

        cy.intercept('PATCH', '**/api/metrics/*', (req) => {
            req.reply({
                body: { id: '1', title: req.body.title || 'Kilogram', abbrv: req.body.abbrv || 'kg', createdAt: '2023-01-01', updatedAt: '2023-01-02' }
            });
        }).as('updateMetric');

        cy.intercept('DELETE', '**/api/metrics/*', { statusCode: 200 }).as('deleteMetric');

        // Mock Ingredients API
        cy.intercept('GET', '**/api/ingredients*', {
            body: {
                data: [
                    { 
                        id: '1', 
                        name: 'Sugar', 
                        price: 5.50, 
                        metricId: '1', 
                        metric: { id: '1', title: 'Kilogram', abbrv: 'kg' },
                        createdAt: '2023-01-01', 
                        updatedAt: '2023-01-01' 
                    }
                ],
                total: 1,
                page: 1,
                limit: 10
            }
        }).as('getIngredients');

        cy.intercept('POST', '**/api/ingredients', (req) => {
            req.reply({
                body: { 
                    id: 'new-ing-id', 
                    name: req.body.name, 
                    price: req.body.price, 
                    metricId: req.body.metricId, 
                    metric: { id: '1', title: 'Kilogram', abbrv: 'kg' }, // Mock populated metric
                    createdAt: '2023-01-01', 
                    updatedAt: '2023-01-01' 
                }
            });
        }).as('createIngredient');

        cy.intercept('PATCH', '**/api/ingredients/*', (req) => {
            req.reply({
                body: { 
                    id: '1', 
                    name: req.body.name || 'Sugar', 
                    price: req.body.price || 5.50, 
                    metricId: req.body.metricId || '1',
                    metric: { id: '1', title: 'Kilogram', abbrv: 'kg' },
                    createdAt: '2023-01-01', 
                    updatedAt: '2023-01-02' 
                }
            });
        }).as('updateIngredient');

        cy.intercept('DELETE', '**/api/ingredients/*', { statusCode: 200 }).as('deleteIngredient');

        // Login Mock
        cy.visit('/dashboard/ingredients', {
            onBeforeLoad: (win) => {
                win.localStorage.clear();
                win.localStorage.setItem('user', JSON.stringify({ id: '1', username: 'admin', role: 'admin' }));
                win.localStorage.setItem('accessToken', 'mock-token');
                win.localStorage.setItem('refreshToken', 'mock-refresh-token');
                win.localStorage.setItem('i18nextLng', 'es');
            }
        });
    });

    it('should navigate to Ingredients page and show tabs', () => {
        cy.contains('Gestión de Ingredientes').should('be.visible');
        cy.contains('button', 'Ingredientes').should('be.visible');
        cy.contains('button', 'Unidades (Métricas)').should('be.visible');
    });

    describe('Metrics (Units) Management', () => {
        beforeEach(() => {
            cy.contains('button', 'Unidades (Métricas)').click();
        });

        it('should show metrics list', () => {
            cy.wait('@getMetrics');
            cy.contains('Kilogram').should('be.visible');
            cy.contains('kg').should('be.visible');
        });

        it('should create a new metric', () => {
            cy.contains('button', 'Crear').click();
            cy.get('input[name="title"]').type('Test Unit');
            cy.get('input[name="abbrv"]').type('TU');
            cy.contains('button', 'Guardar').click();
            
            cy.wait('@createMetric');
            // Check for success message or UI update?
            // Since we mock GET to return static data, the list won't actually update in this mock test 
            // unless we dynamic mock or check the toast/calls.
            // Verified via creating toast success
            cy.contains('Creado exitosamente').should('be.visible');
        });

        it('should edit an existing metric', () => {
            cy.wait('@getMetrics');
            // Click edit on the first row
            cy.get('button[aria-label="Editar"]').first().click();
            
            cy.get('input[name="title"]').should('have.value', 'Kilogram');
            cy.get('input[name="title"]').clear().type('Updated Unit');
            cy.contains('button', 'Guardar').click();

            cy.wait('@updateMetric');
            cy.contains('Actualizado exitosamente').should('be.visible');
        });

        it('should delete a metric', () => {
             cy.wait('@getMetrics');
             cy.get('button[aria-label="Eliminar"]').first().click();
             
             cy.contains('button', 'Sí, eliminarlo').click();
             cy.wait('@deleteMetric');
             cy.contains('Eliminado exitosamente').should('be.visible');
        });
    });

    describe('Ingredients Management', () => {
        it('should show ingredients list', () => {
            cy.wait('@getIngredients');
            cy.contains('Sugar').should('be.visible');
            cy.contains('5.50').should('be.visible'); // Price might be formatted
        });

        it('should create a new ingredient', () => {
            cy.wait('@getIngredients');
            // Mock the metrics and brands API that the form needs
            cy.intercept('GET', '**/api/metrics*', {
                body: {
                    data: [{ id: '1', title: 'Kilogram', abbrv: 'kg' }],
                    total: 1
                }
            }).as('getMetricsForForm');
            cy.intercept('GET', '**/api/brands*', {
                body: { data: [], total: 0 }
            }).as('getBrandsForForm');

            cy.contains('button', 'Crear').click();
            cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');

            cy.get('[role="dialog"]').within(() => {
                cy.get('input[name="name"]').type('Test Ingredient');
                cy.get('input[name="price"]').clear().type('10.50');
            });

            // Wait for metrics to load
            cy.wait('@getMetricsForForm');

            // Select Metric using the text field with select
            cy.get('[role="dialog"]').within(() => {
                cy.get('div[role="combobox"]').click();
            });
            cy.get('li[role="option"]').first().click();

            cy.get('[role="dialog"]').within(() => {
                cy.contains('button', 'Guardar').should('not.be.disabled').click();
            });
            cy.wait('@createIngredient');
            cy.contains('Creado exitosamente').should('be.visible');
        });

        it('should edit an existing ingredient', () => {
            cy.wait('@getIngredients');
            // Mock the metrics and brands API that the form needs
            cy.intercept('GET', '**/api/metrics*', {
                body: {
                    data: [{ id: '1', title: 'Kilogram', abbrv: 'kg' }],
                    total: 1
                }
            }).as('getMetricsForEdit');
            cy.intercept('GET', '**/api/brands*', {
                body: { data: [], total: 0 }
            }).as('getBrandsForEdit');

            // Use aria-label to find the edit button
            cy.get('[aria-label="Editar"]', { timeout: 10000 }).first().click();
            cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible');

            cy.get('[role="dialog"]').within(() => {
                cy.get('input[name="name"]').should('have.value', 'Sugar');
                cy.get('input[name="name"]').clear().type('Updated Sugar');
                cy.contains('button', 'Guardar').click();
            });

            cy.wait('@updateIngredient');
            cy.contains('Actualizado exitosamente').should('be.visible');
        });

        it('should delete an ingredient', () => {
            cy.wait('@getIngredients');
            cy.get('[aria-label="Eliminar"]', { timeout: 10000 }).first().click();

            cy.contains('button', 'Sí, eliminarlo').click();
            cy.wait('@deleteIngredient');
            cy.contains('Eliminado exitosamente').should('be.visible');
        });
    });
});
