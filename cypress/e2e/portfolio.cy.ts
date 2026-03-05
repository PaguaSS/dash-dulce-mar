describe('Portfolio Management', () => {
  beforeEach(() => {
    cy.viewport(1280, 720);
    
    // Mock the catalog API response
    cy.intercept({ method: 'GET', url: /\/api\/portfolio(\?.*)?$/ }, (req) => {
        const url = new URL(req.url);
        const parentId = url.searchParams.get('parentId');
        const search = url.searchParams.get('search');

        if (search) {
             req.reply({
                body: {
                    data: [
                         { id: '2', type: 'ITEM', title: 'Search Result Item', image: 'item.jpg', active: true, parentId: '1', description: 'Found it' }
                    ],
                    meta: { total: 1, page: 1, limit: 20, totalPages: 1 }
                }
            });
            return;
        }

        if (parentId === 'null' || !parentId) {
             // Root
             req.reply({
                body: {
                    data: [
                        { id: '1', type: 'CATEGORY', title: 'Root Category', image: 'cat.jpg', active: true, parentId: null, description: 'Root Folder' }
                    ],
                    meta: { total: 1, page: 1, limit: 20, totalPages: 1 }
                }
            });
        } else {
             // Subfolder
              req.reply({
                body: {
                    data: [
                         { id: '2', type: 'ITEM', title: 'Sub Item', image: 'item.jpg', active: true, parentId: parentId, description: 'Item in folder' }
                    ],
                    meta: { total: 1, page: 1, limit: 20, totalPages: 1 }
                }
            });
        }

    }).as('getCatalog');

    // Mock getOne for breadcrumbs
    cy.intercept({ method: 'GET', url: /\/api\/categories\/[^/]+(\?.*)?$/ }, {
        body: { id: '1', title: 'Root Category', description: 'Root Folder', active: true }
    }).as('getCategory');
    
    // Use onBeforeLoad to inject auth token if needed
     cy.visit('/dashboard/portfolio', {
         onBeforeLoad: (win) => {
             // Clear existing data to avoid conflicts
             win.localStorage.clear();
             // Mock auth store manually as per src/store/authStore.ts
             win.localStorage.setItem('user', JSON.stringify({ id: '1', username: 'admin', role: 'admin' }));
             win.localStorage.setItem('accessToken', 'mock-token');
             win.localStorage.setItem('refreshToken', 'mock-refresh-token');
             win.localStorage.setItem('i18nextLng', 'es');
         }
     });

     // Verify we are not redirected to login
     cy.url().should('include', '/dashboard/portfolio');
  });

  it('displays root categories correctly', () => {
    cy.wait('@getCatalog');
    cy.contains('Root Category').should('be.visible');
    cy.contains('Nueva Categoría').should('be.visible');
  });

  it('navigates to a subfolder and shows items', () => {
    cy.wait('@getCatalog');
    cy.contains('Root Category').click();
    
    // Should fetch with parentId
    cy.wait('@getCatalog').its('request.url').should('include', 'parentId=1');
    
    // Should see sub item
    cy.contains('Sub Item').should('be.visible');
    
    // Should see "Nuevo Ítem" button (matches es.json: portfolio.addItem)
    cy.contains('Nuevo Ítem').should('be.visible');
  });

  it('performs global search', () => {
    cy.get('input[placeholder="Buscar..."]').type('Search Result Item');
    
    cy.wait('@getCatalog');
    cy.contains('Search Result Item').should('be.visible');
  });
});
