describe('Recipes Module', () => {
    beforeEach(() => {
        cy.viewport(1280, 720);

        // Mock Recipes API
        cy.intercept('GET', '**/api/recipes*', {
            body: {
                data: [
                    {
                        id: '1',
                        title: 'Chocolate Cake',
                        servings: 8,
                        ingredients: [],
                        createdAt: '2023-01-01',
                        updatedAt: '2023-01-01'
                    }
                ],
                total: 1,
                page: 1,
                limit: 10
            }
        }).as('getRecipes');

        cy.intercept('GET', '**/api/ingredients*', {
            body: {
                data: [
                    { id: '1', name: 'Flour', price: 500, metric: { id: '1', title: 'Kilogram', abbrv: 'kg' } }
                ],
                total: 1,
                page: 1,
                limit: 100
            }
        }).as('getIngredients');

        cy.intercept('POST', '**/api/recipes', (req) => {
            req.reply({
                body: {
                    id: 'new-recipe-id',
                    ...req.body,
                    createdAt: '2023-01-01',
                    updatedAt: '2023-01-01'
                }
            });
        }).as('createRecipe');

        // Login Mock
        cy.visit('/dashboard/recipes', {
            onBeforeLoad: (win) => {
                win.localStorage.clear();
                win.localStorage.setItem('user', JSON.stringify({ id: '1', username: 'admin', role: 'admin' }));
                win.localStorage.setItem('accessToken', 'mock-token');
                win.localStorage.setItem('refreshToken', 'mock-refresh-token');
                win.localStorage.setItem('i18nextLng', 'en');
            }
        });
    });

    it('should display the recipes list', () => {
        cy.wait('@getRecipes');
        cy.contains('Recipes').should('be.visible');
        cy.get('table').should('exist');
        cy.contains('Chocolate Cake').should('be.visible');
    });

    it('should navigate to create recipe form', () => {
        cy.wait('@getRecipes');
        // Click the create button (which may have different text depending on translation)
        cy.get('button').contains(/Create|Crear/i).click();
        cy.url().should('include', '/dashboard/recipes/new');
    });

    it('should filter recipes', () => {
        cy.wait('@getRecipes');
        cy.get('input[placeholder="Search"]').type('Chocolate');
        cy.wait('@getRecipes');
    });
  });
