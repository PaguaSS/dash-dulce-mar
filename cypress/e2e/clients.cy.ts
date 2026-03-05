describe('Clients Module', () => {
    beforeEach(() => {
        cy.viewport(1280, 720);

        // Mock Clients API
        cy.intercept('GET', '**/api/clients*', {
            body: {
                data: [
                    {
                        id: '1',
                        name: 'John',
                        lastname: 'Doe',
                        phone: '555-1234',
                        email: 'john@example.com',
                        createdAt: '2023-01-01',
                        updatedAt: '2023-01-01'
                    },
                    {
                        id: '2',
                        name: 'Jane',
                        lastname: 'Smith',
                        phone: '555-5678',
                        email: 'jane@example.com',
                        createdAt: '2023-01-02',
                        updatedAt: '2023-01-02'
                    }
                ],
                total: 2,
                page: 1,
                limit: 10
            }
        }).as('getClients');

        cy.intercept('POST', '**/api/clients', (req) => {
            req.reply({
                body: {
                    id: 'new-client-id',
                    name: req.body.name,
                    lastname: req.body.lastname,
                    phone: req.body.phone,
                    email: req.body.email,
                    createdAt: '2023-01-01',
                    updatedAt: '2023-01-01'
                }
            });
        }).as('createClient');

        cy.intercept('PATCH', '**/api/clients/*', (req) => {
            req.reply({
                body: {
                    id: '1',
                    name: req.body.name || 'John',
                    lastname: req.body.lastname || 'Doe',
                    phone: req.body.phone || '555-1234',
                    email: req.body.email || 'john@example.com',
                    createdAt: '2023-01-01',
                    updatedAt: '2023-01-02'
                }
            });
        }).as('updateClient');

        cy.intercept('DELETE', '**/api/clients/*', { statusCode: 200 }).as('deleteClient');

        // Login Mock
        cy.visit('/dashboard/clients', {
            onBeforeLoad: (win) => {
                win.localStorage.clear();
                win.localStorage.setItem('user', JSON.stringify({ id: '1', username: 'admin', role: 'admin' }));
                win.localStorage.setItem('accessToken', 'mock-token');
                win.localStorage.setItem('refreshToken', 'mock-refresh-token');
            }
        });
    });

    it('should navigate to Clients page and show title', () => {
        cy.contains('Clients').should('be.visible');
        cy.contains('Manage your clients').should('be.visible');
    });

    it('should show clients list', () => {
        cy.wait('@getClients');
        cy.contains('John').should('be.visible');
        cy.contains('Doe').should('be.visible');
        cy.contains('555-1234').should('be.visible');
        cy.contains('john@example.com').should('be.visible');
    });

    it('should create a new client', () => {
        cy.contains('button', 'Create').click();

        cy.get('input[name="name"]').type('Test');
        cy.get('input[name="lastname"]').type('Client');
        cy.get('input[name="phone"]').type('555-9999');
        cy.get('input[name="email"]').type('test@example.com');

        cy.contains('button', 'Save').click();

        cy.wait('@createClient');
        cy.contains('Created successfully').should('be.visible');
    });

    it('should validate required name field', () => {
        cy.contains('button', 'Create').click();

        // Try to submit without name
        cy.contains('button', 'Save').click();

        cy.contains('This field is required').should('be.visible');
    });

    it('should edit an existing client', () => {
        cy.wait('@getClients');
        cy.get('button[aria-label="Edit"]').first().click();

        cy.get('input[name="name"]').should('have.value', 'John');
        cy.get('input[name="lastname"]').should('have.value', 'Doe');
        cy.get('input[name="phone"]').should('have.value', '555-1234');
        cy.get('input[name="email"]').should('have.value', 'john@example.com');

        cy.get('input[name="name"]').clear().type('Johnny');
        cy.contains('button', 'Save').click();

        cy.wait('@updateClient');
        cy.contains('Updated successfully').should('be.visible');
    });

    it('should delete a client', () => {
        cy.wait('@getClients');
        cy.get('button[aria-label="Delete"]').first().click();

        cy.contains('button', 'Yes, delete it').click();
        cy.wait('@deleteClient');
        cy.contains('Deleted successfully').should('be.visible');
    });

    it('should cancel delete confirmation', () => {
        cy.wait('@getClients');
        cy.get('button[aria-label="Delete"]').first().click();

        cy.contains('button', 'Cancel').click();
        // Modal should close and no delete request
        cy.get('@deleteClient.all').should('have.length', 0);
    });

    it('should close form on cancel', () => {
        cy.contains('button', 'Create').click();
        cy.get('[role="dialog"]').should('be.visible');

        cy.contains('button', 'Cancel').click();
        cy.get('[role="dialog"]').should('not.exist');
    });
});
