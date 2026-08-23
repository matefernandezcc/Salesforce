console.log('v2 - multi-page routing');

const domain = window.location.hostname;

let sitePrefix = 'Srappi';

SalesforceInteractions.init({
  cookieDomain: domain,
  consents: [
    {
      status: SalesforceInteractions.ConsentStatus.OptIn,
      purpose: SalesforceInteractions.ConsentPurpose.Tracking,
      provider: sitePrefix + ' Web Site'
    }
  ]
}).then(() => {
  SalesforceInteractions.setLoggingLevel('DEBUG');

  /**
   * Helper: get the current "virtual" path from the SPA router.
   * Falls back to window.location.pathname if no route state is set.
   */
  function getCurrentRoute() {
    if (window.history.state && window.history.state.route) {
      return window.history.state.route;
    }
    // Fallback: parse pathname
    const path = window.location.pathname;
    // Strip any base path (e.g. /Salesforce/) to get the route
    const knownRoutes = ['/', '/about', '/menu', '/chefs', '/reservation', '/reviews', '/contact', '/blog', '/gallery', '/history', '/hours', '/special', '/newsletter'];
    for (const route of knownRoutes) {
      if (route !== '/' && path.endsWith(route)) {
        return route;
      }
    }
    return '/';
  }

  const config = {
    global: {},

    pageTypeDefault: {
      name: 'Pagina no mapeada',
      interaction: {
        name: sitePrefix + ' - ' + getCurrentRoute()
      }
    },

    pageTypes: [
      {
        name: 'Homepage',
        isMatch: () => getCurrentRoute() === '/',
        interaction: {
          name: sitePrefix + '_Homepage'
        },
        contentZones: [
          {
            name: 'home_hero_banner',
            selector: '#hero'
          },
          {
            name: 'home_categories',
            selector: '#category'
          }
        ]
      },
      {
        name: 'About',
        isMatch: () => getCurrentRoute() === '/about',
        interaction: {
          name: sitePrefix + '_About'
        },
        contentZones: [
          {
            name: 'about_story',
            selector: '#about'
          }
        ]
      },
      {
        name: 'Menu',
        isMatch: () => getCurrentRoute() === '/menu',
        interaction: {
          name: sitePrefix + '_Menu'
        },
        contentZones: [
          {
            name: 'menu_grid',
            selector: '#mgrid'
          },
          {
            name: 'menu_special_offer',
            selector: '#special'
          }
        ]
      },
      {
        name: 'Chefs',
        isMatch: () => getCurrentRoute() === '/chefs',
        interaction: {
          name: sitePrefix + '_Chefs'
        },
        contentZones: [
          {
            name: 'chefs_grid',
            selector: '#chefs .row'
          }
        ]
      },
      {
        name: 'Reservation',
        isMatch: () => getCurrentRoute() === '/reservation',
        interaction: {
          name: sitePrefix + '_Reservation'
        },
        contentZones: [
          {
            name: 'reservation_form',
            selector: '#reservation'
          }
        ]
      },
      {
        name: 'Reviews',
        isMatch: () => getCurrentRoute() === '/reviews',
        interaction: {
          name: sitePrefix + '_Reviews'
        },
        contentZones: [
          {
            name: 'reviews_carousel',
            selector: '#testimonials'
          }
        ]
      },
      {
        name: 'Contact',
        isMatch: () => getCurrentRoute() === '/contact',
        interaction: {
          name: sitePrefix + '_Contact'
        },
        contentZones: [
          {
            name: 'contact_form',
            selector: '#contact-section'
          }
        ]
      },
      {
        name: 'Blog',
        isMatch: () => getCurrentRoute() === '/blog',
        interaction: {
          name: sitePrefix + '_Blog'
        },
        contentZones: [
          {
            name: 'blog_posts',
            selector: '#blog .row'
          }
        ]
      }
    ]
  };

  SalesforceInteractions.initSitemap(config);

  /**
   * Listen for SPA pageview events from router.js and
   * re-evaluate the sitemap so Data360 picks up the new page.
   */
  window.addEventListener('spa:pageview', (event) => {
    console.log('[Sitemap] SPA pageview detected:', event.detail.route);
    // Re-init the sitemap on each virtual navigation
    SalesforceInteractions.initSitemap(config);
  });

}).catch((error) => {
  console.error('Error SDK Salesforce Interactions:', error);
});