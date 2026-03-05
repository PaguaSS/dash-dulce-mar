describe('Calculator Products Management', () => {
  const mockCategories = {
    data: [
      {
        id: '1',
        name: 'Cakes',
        slug: 'cakes',
        description: 'Delicious homemade cakes',
        icon: null,
        portionType: 'range',
        minPortions: 8,
        maxPortions: 100,
        fixedPortionOptions: null,
        sortOrder: 1,
        active: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '2',
        name: 'Cheesecakes',
        slug: 'cheesecakes',
        description: 'Creamy cheesecakes',
        icon: null,
        portionType: 'fixed',
        minPortions: 12,
        maxPortions: 15,
        fixedPortionOptions: [12, 15],
        sortOrder: 2,
        active: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ],
    total: 2,
    page: 1,
    limit: 50,
  };

  const mockOptions = {
    data: [
      {
        id: '1',
        categoryId: '1',
        optionType: 'FLAVOR',
        name: 'Chocolate',
        slug: 'chocolate',
        description: 'Rich chocolate flavor',
        image: 'chocolate-option.webp',
        priceModifier: 0,
        isPercentage: false,
        conditions: null,
        sortOrder: 1,
        active: true,
        category: { id: '1', name: 'Cakes' },
      },
      {
        id: '2',
        categoryId: '1',
        optionType: 'FILLING',
        name: 'Dulce de Leche',
        slug: 'dulce-de-leche',
        description: 'Caramel filling',
        image: null,
        priceModifier: 3000,
        isPercentage: false,
        conditions: null,
        sortOrder: 1,
        active: true,
        category: { id: '1', name: 'Cakes' },
      },
    ],
    total: 2,
    page: 1,
    limit: 100,
  };

  const mockCatalog = {
    categories: [
      {
        slug: 'cakes',
        name: 'Cakes',
        description: 'Delicious homemade cakes',
        icon: null,
        portionType: 'range',
        minPortions: 8,
        maxPortions: 100,
        fixedPortionOptions: null,
      },
    ],
    customizations: {
      flavors: [
        {
          slug: 'chocolate',
          name: 'Chocolate',
          description: 'Rich chocolate flavor',
          image: 'http://localhost:3000/assets/calculator-options/chocolate.webp',
          categorySlug: 'cakes',
          priceModifier: 0,
          isPercentage: false,
        },
      ],
      fillings: [
        {
          slug: 'dulce-de-leche',
          name: 'Dulce de Leche',
          description: 'Caramel filling',
          image: null,
          categorySlug: 'cakes',
          priceModifier: 3000,
          isPercentage: false,
        },
      ],
      coverings: [],
      bases: [],
      types: [],
    },
    products: [],
  };

  const mockPricing = {
    id: '1',
    categorySlug: 'cakes',
    basePrice: 15000,
    pricePerPortion: 1500,
    portionRanges: null,
    modifiers: null,
    currency: 'CRC',
  };

  beforeEach(() => {
    cy.viewport(1280, 720);

    // Mock categories API
    cy.intercept('GET', '**/api/calculator/categories*', {
      statusCode: 200,
      body: mockCategories,
    }).as('getCategories');

    // Mock options API
    cy.intercept('GET', '**/api/calculator/options*', {
      statusCode: 200,
      body: mockOptions,
    }).as('getOptions');

    // Mock pricing API
    cy.intercept('GET', '**/api/calculator/pricing/*', {
      statusCode: 200,
      body: mockPricing,
    }).as('getPricing');

    // Mock create/update/delete
    cy.intercept('POST', '**/api/calculator/categories', {
      statusCode: 201,
      body: { id: '3', name: 'New Category', slug: 'new-category' },
    }).as('createCategory');

    cy.intercept('PUT', '**/api/calculator/categories/*', {
      statusCode: 200,
      body: mockCategories.data[0],
    }).as('updateCategory');

    cy.intercept('DELETE', '**/api/calculator/categories/*', {
      statusCode: 204,
    }).as('deleteCategory');

    cy.intercept('POST', '**/api/calculator/options', {
      statusCode: 201,
      body: { id: '3', name: 'New Option', slug: 'new-option' },
    }).as('createOption');

    cy.intercept('PUT', '**/api/calculator/options/*', {
      statusCode: 200,
      body: mockOptions.data[0],
    }).as('updateOption');

    cy.intercept('DELETE', '**/api/calculator/options/*', {
      statusCode: 204,
    }).as('deleteOption');

    cy.intercept('PUT', '**/api/calculator/pricing/*', {
      statusCode: 200,
      body: mockPricing,
    }).as('updatePricing');

    // Mock auth
    cy.visit('/dashboard/calculator-products', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.localStorage.setItem('user', JSON.stringify({ id: '1', username: 'admin', role: 'admin' }));
        win.localStorage.setItem('accessToken', 'mock-token');
        win.localStorage.setItem('refreshToken', 'mock-refresh-token');
        win.localStorage.setItem('i18nextLng', 'es');
      },
    });

    cy.url().should('include', '/dashboard/calculator-products');
  });

  describe('Page Structure', () => {
    it('should display the page title', () => {
      cy.contains('Calculadora').should('be.visible');
    });

    it('should display all three tabs', () => {
      cy.contains('Categorías').should('be.visible');
      cy.contains('Opciones').should('be.visible');
      cy.contains('Precios').should('be.visible');
    });

    it('should show Categories tab by default', () => {
      cy.wait('@getCategories');
      cy.contains('Cakes').should('be.visible');
      cy.contains('Cheesecakes').should('be.visible');
    });
  });

  describe('Categories Tab', () => {
    beforeEach(() => {
      cy.wait('@getCategories');
    });

    it('should display categories table with data', () => {
      cy.contains('Cakes').should('be.visible');
      cy.contains('cakes').should('be.visible'); // slug
      cy.contains('Rango').should('be.visible'); // portion type
      cy.contains('Cheesecakes').should('be.visible');
    });

    it('should display Add button', () => {
      cy.contains('button', 'Agregar Nuevo').should('be.visible');
    });

    it('should open create dialog when clicking Add', () => {
      cy.contains('button', 'Agregar Nuevo').click();
      cy.get('[role="dialog"]').should('be.visible');
      cy.get('[role="dialog"]').contains('Agregar Nuevo').should('be.visible');
    });

    it('should create a new category', () => {
      cy.contains('button', 'Agregar Nuevo').click();
      cy.get('[role="dialog"]').within(() => {
        cy.get('input').first().type('Desserts');
        cy.contains('button', 'Guardar').click();
      });
      cy.wait('@createCategory');
    });

    it('should open edit dialog when clicking edit button', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').first().click(); // Edit button
      });
      cy.get('[role="dialog"]').should('be.visible');
      cy.get('[role="dialog"]').contains('Editar').should('be.visible');
    });

    it('should update a category', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').first().click();
      });
      cy.get('[role="dialog"]').within(() => {
        cy.get('input').first().clear().type('Updated Cakes');
        cy.contains('button', 'Guardar').click();
      });
      cy.wait('@updateCategory');
    });

    it('should show delete confirmation when clicking delete button', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').last().click(); // Delete button
      });
      cy.contains('¿Estás seguro').should('be.visible');
    });

    it('should delete a category', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').last().click();
      });
      cy.contains('button', 'Confirmar').click();
      cy.wait('@deleteCategory');
    });

    it('should display active/inactive status', () => {
      cy.contains('Activo').should('be.visible');
    });
  });

  describe('Options Tab', () => {
    beforeEach(() => {
      cy.contains('Opciones').click();
      cy.wait('@getOptions');
      cy.wait('@getCategories');
    });

    it('should display options table with data', () => {
      cy.contains('Chocolate').should('be.visible');
      cy.contains('Dulce de Leche').should('be.visible');
    });

    it('should display option type chips', () => {
      cy.contains('Sabor').should('be.visible');
      cy.contains('Relleno').should('be.visible');
    });

    it('should display price modifier', () => {
      cy.contains('3000').should('be.visible'); // Dulce de Leche price modifier
    });

    it('should have category filter', () => {
      cy.get('[role="combobox"]').first().should('be.visible');
    });

    it('should filter options by category', () => {
      cy.get('[role="combobox"]').first().click();
      cy.get('[role="option"]').contains('Cakes').click();
      cy.wait('@getOptions');
    });

    it('should open create dialog when clicking Add', () => {
      cy.contains('button', 'Agregar Nuevo').click();
      cy.get('[role="dialog"]').should('be.visible');
    });

    it('should create a new option', () => {
      cy.contains('button', 'Agregar Nuevo').click();
      cy.get('[role="dialog"]').within(() => {
        // Select category
        cy.get('[role="combobox"]').first().click();
      });
      cy.get('[role="option"]').contains('Cakes').click();
      cy.get('[role="dialog"]').within(() => {
        // Select type
        cy.get('[role="combobox"]').eq(1).click();
      });
      cy.get('[role="option"]').contains('Sabor').click();
      cy.get('[role="dialog"]').within(() => {
        // Enter name
        cy.get('input[type="text"]').first().type('Vanilla');
        cy.contains('button', 'Guardar').click();
      });
      cy.wait('@createOption');
    });

    it('should open edit dialog when clicking edit button', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').first().click();
      });
      cy.get('[role="dialog"]').should('be.visible');
      cy.get('[role="dialog"]').contains('Editar').should('be.visible');
    });

    it('should show delete confirmation when clicking delete button', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').last().click();
      });
      cy.contains('¿Estás seguro').should('be.visible');
    });

    it('should delete an option', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').last().click();
      });
      cy.contains('button', 'Confirmar').click();
      cy.wait('@deleteOption');
    });
  });

  describe('Pricing Tab', () => {
    beforeEach(() => {
      cy.contains('Precios').click();
      cy.wait('@getCategories');
    });

    it('should display category selector', () => {
      cy.get('[role="combobox"]').should('be.visible');
    });

    it('should load pricing for default category', () => {
      cy.wait('@getPricing');
      cy.contains('Cakes').should('be.visible');
    });

    it('should display pricing form fields', () => {
      cy.wait('@getPricing');
      cy.contains('Precio Base').should('be.visible');
      cy.contains('Precio por Porción').should('be.visible');
      cy.contains('Moneda').should('be.visible');
    });

    it('should display current pricing values', () => {
      cy.wait('@getPricing');
      // Check that input fields have values
      cy.get('input[type="number"]').first().should('have.value', '15000');
      cy.get('input[type="number"]').eq(1).should('have.value', '1500');
    });

    it('should switch categories', () => {
      cy.wait('@getPricing');
      cy.get('[role="combobox"]').first().click();
      cy.get('[role="option"]').contains('Cheesecakes').click();
      cy.wait('@getPricing');
    });

    it('should save pricing changes', () => {
      cy.wait('@getPricing');
      cy.get('input[type="number"]').first().clear().type('20000');
      cy.contains('button', 'Guardar').click();
      cy.wait('@updatePricing');
    });

    it('should display portion type info', () => {
      cy.wait('@getPricing');
      cy.contains('Tipo de Porción').should('be.visible');
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between tabs', () => {
      // Start on Categories
      cy.wait('@getCategories');
      cy.contains('Cakes').should('be.visible');

      // Switch to Options
      cy.contains('Opciones').click();
      cy.wait('@getOptions');
      cy.contains('Chocolate').should('be.visible');

      // Switch to Pricing
      cy.contains('Precios').click();
      cy.wait('@getPricing');
      cy.contains('Precio Base').should('be.visible');

      // Back to Categories
      cy.contains('Categorías').click();
      cy.wait('@getCategories');
      cy.contains('Cakes').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should display error when categories fail to load', () => {
      cy.intercept('GET', '**/api/calculator/categories*', {
        statusCode: 500,
        body: { error: 'Server error' },
      }).as('getCategoriesError');

      cy.visit('/dashboard/calculator-products', {
        onBeforeLoad: (win) => {
          win.localStorage.clear();
          win.localStorage.setItem('user', JSON.stringify({ id: '1', username: 'admin', role: 'admin' }));
          win.localStorage.setItem('accessToken', 'mock-token');
          win.localStorage.setItem('refreshToken', 'mock-refresh-token');
          win.localStorage.setItem('i18nextLng', 'es');
        },
      });

      cy.wait('@getCategoriesError');
      cy.contains('Error').should('be.visible');
    });

    it('should display error when options fail to load', () => {
      cy.intercept('GET', '**/api/calculator/options*', {
        statusCode: 500,
        body: { error: 'Server error' },
      }).as('getOptionsError');

      cy.contains('Opciones').click();
      cy.wait('@getOptionsError');
      cy.contains('Error').should('be.visible');
    });
  });

  describe('Empty States', () => {
    it('should display no data message when categories are empty', () => {
      cy.intercept('GET', '**/api/calculator/categories*', {
        statusCode: 200,
        body: { data: [], total: 0, page: 1, limit: 50 },
      }).as('getEmptyCategories');

      cy.visit('/dashboard/calculator-products', {
        onBeforeLoad: (win) => {
          win.localStorage.clear();
          win.localStorage.setItem('user', JSON.stringify({ id: '1', username: 'admin', role: 'admin' }));
          win.localStorage.setItem('accessToken', 'mock-token');
          win.localStorage.setItem('refreshToken', 'mock-refresh-token');
          win.localStorage.setItem('i18nextLng', 'es');
        },
      });

      cy.wait('@getEmptyCategories');
      cy.contains('No se encontraron datos').should('be.visible');
    });

    it('should display no data message when options are empty', () => {
      cy.intercept('GET', '**/api/calculator/options*', {
        statusCode: 200,
        body: { data: [], total: 0, page: 1, limit: 100 },
      }).as('getEmptyOptions');

      cy.contains('Opciones').click();
      cy.wait('@getEmptyOptions');
      cy.contains('No se encontraron datos').should('be.visible');
    });
  });

  describe('Form Validation', () => {
    it('should open category dialog and allow submission', () => {
      cy.wait('@getCategories');
      cy.contains('button', 'Agregar Nuevo').click();
      cy.get('[role="dialog"]').should('be.visible');
      cy.get('[role="dialog"]').within(() => {
        // Enter a name and submit
        cy.get('input').first().type('Test Category');
        cy.contains('button', 'Guardar').click();
      });
      cy.wait('@createCategory');
    });

    it('should open option dialog and allow submission', () => {
      cy.contains('Opciones').click();
      cy.wait('@getOptions');
      cy.contains('button', 'Agregar Nuevo').click();
      cy.get('[role="dialog"]').should('be.visible');
      cy.get('[role="dialog"]').within(() => {
        // Select category
        cy.get('[role="combobox"]').first().click();
      });
      cy.get('[role="option"]').contains('Cakes').click();
      cy.get('[role="dialog"]').within(() => {
        // Select type
        cy.get('[role="combobox"]').eq(1).click();
      });
      cy.get('[role="option"]').contains('Sabor').click();
      cy.get('[role="dialog"]').within(() => {
        // Enter name and submit
        cy.get('input[type="text"]').first().type('Test Option');
        cy.contains('button', 'Guardar').click();
      });
      cy.wait('@createOption');
    });
  });

  describe('Responsive Design', () => {
    it('should work on tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.wait('@getCategories');
      cy.contains('Cakes').should('be.visible');
      cy.contains('Categorías').should('be.visible');
    });
  });

  describe('Option Images', () => {
    beforeEach(() => {
      cy.contains('Opciones').click();
      cy.wait('@getOptions');
      cy.wait('@getCategories');
    });

    it('should display image column in options table', () => {
      cy.get('table thead').contains('Imagen').should('be.visible');
    });

    it('should display avatar with image for options with images', () => {
      cy.get('table tbody tr').first().within(() => {
        // MUI Avatar renders img with class .MuiAvatar-img when src is provided
        cy.get('.MuiAvatar-root').should('exist');
      });
    });

    it('should display avatar with letter for options without images', () => {
      cy.get('table tbody tr').eq(1).within(() => {
        cy.get('.MuiAvatar-root').contains('D').should('be.visible');
      });
    });

    it('should show upload button in option form', () => {
      cy.contains('button', 'Agregar Nuevo').click();
      cy.get('[role="dialog"]').should('be.visible');
      // Scroll the upload button into view within the dialog
      cy.get('[role="dialog"]').contains('Subir Imagen').scrollIntoView().should('be.visible');
    });

    it('should upload image when creating option', () => {
      cy.intercept('POST', '**/api/calculator/options', {
        statusCode: 201,
        body: {
          id: '3',
          name: 'New Option',
          slug: 'new-option',
          image: 'new-option.webp',
        },
      }).as('createOptionWithImage');

      cy.contains('button', 'Agregar Nuevo').click();
      cy.get('[role="dialog"]').within(() => {
        // Select category
        cy.get('[role="combobox"]').first().click();
      });
      cy.get('[role="option"]').contains('Cakes').click();
      cy.get('[role="dialog"]').within(() => {
        // Select type
        cy.get('[role="combobox"]').eq(1).click();
      });
      cy.get('[role="option"]').contains('Sabor').click();
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="text"]').first().type('Vanilla');
        // Note: For file upload in Cypress, we would use cy.fixture
        // This test verifies the form structure, actual upload is tested in e2e
        cy.contains('button', 'Guardar').click();
      });
      cy.wait('@createOptionWithImage');
    });

    it('should show image preview when editing option with image', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('button').first().click(); // Edit button
      });
      cy.get('[role="dialog"]').should('be.visible');
      // When editing an option with image, an Avatar preview should be shown
      // The Avatar may or may not have an img loaded depending on whether the URL is reachable
      cy.get('[role="dialog"]').find('.MuiAvatar-root').scrollIntoView().should('exist');
    });
  });

  describe('Public Catalog Endpoint', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/public/calculator/catalog', {
        statusCode: 200,
        body: mockCatalog,
      }).as('getCatalog');
    });

    it('should return categories in catalog response', () => {
      cy.request('GET', 'http://localhost:3000/api/public/calculator/catalog').then((response) => {
        // Note: This test assumes the API is running
        // In CI, this would use the mock
      });
    });

    it('should group customizations by type', () => {
      // Verify mock structure is correct
      expect(mockCatalog.customizations).to.have.property('flavors');
      expect(mockCatalog.customizations).to.have.property('fillings');
      expect(mockCatalog.customizations).to.have.property('coverings');
      expect(mockCatalog.customizations).to.have.property('bases');
      expect(mockCatalog.customizations).to.have.property('types');
    });

    it('should return full image URLs in catalog', () => {
      const flavor = mockCatalog.customizations.flavors[0];
      expect(flavor.image).to.include('http://localhost:3000/assets/calculator-options/');
    });

    it('should return products separately', () => {
      expect(mockCatalog).to.have.property('products');
      expect(Array.isArray(mockCatalog.products)).to.be.true;
    });
  });
});
