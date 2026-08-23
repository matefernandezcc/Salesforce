/**
 * SPA Router - history.pushState based
 * Changes the browser URL on section navigation so that:
 *   - GTM can track distinct pageviews via dataLayer push
 *   - Salesforce Data360 SDK can match distinct pageTypes in the sitemap
 *   - Browser back/forward buttons work correctly
 */
(function () {
  'use strict';

  // Route → section mapping
  var ROUTES = {
    '/': 'hero',
    '/about': 'about',
    '/menu': 'menu',
    '/chefs': 'chefs',
    '/reservation': 'reservation',
    '/reviews': 'testimonials',
    '/contact': 'contact-section',
    '/blog': 'blog',
    '/gallery': 'gallery',
    '/history': 'history',
    '/hours': 'hours',
    '/special': 'special',
    '/newsletter': 'newsletter'
  };

  // Section → route (reverse lookup)
  var SECTION_TO_ROUTE = {};
  Object.keys(ROUTES).forEach(function (route) {
    SECTION_TO_ROUTE[ROUTES[route]] = route;
  });

  // Page titles per route
  var TITLES = {
    '/': 'Srappi - Fast Food & Restaurant',
    '/about': 'About Us - Srappi',
    '/menu': 'Our Menu - Srappi',
    '/chefs': 'Our Chefs - Srappi',
    '/reservation': 'Reservation - Srappi',
    '/reviews': 'Reviews - Srappi',
    '/contact': 'Contact Us - Srappi',
    '/blog': 'Blog - Srappi',
    '/gallery': 'Gallery - Srappi',
    '/history': 'Our History - Srappi',
    '/hours': 'Opening Hours - Srappi',
    '/special': 'Special Offers - Srappi',
    '/newsletter': 'Newsletter - Srappi'
  };

  var currentRoute = null;

  /**
   * Get the base path (handles GitHub Pages or subdirectory deploys)
   */
  function getBasePath() {
    // If deployed under a subdirectory (e.g. /Salesforce/), detect it
    var base = document.querySelector('base');
    if (base) return base.getAttribute('href').replace(/\/$/, '');
    // Fallback: detect from pathname - everything before the known routes
    var path = window.location.pathname;
    // Check if we're on a known route
    var knownRoutes = Object.keys(ROUTES);
    for (var i = 0; i < knownRoutes.length; i++) {
      var route = knownRoutes[i];
      if (route !== '/' && path.endsWith(route)) {
        return path.slice(0, path.length - route.length);
      }
    }
    // If pathname ends with index.html, strip it
    if (path.endsWith('/index.html')) {
      return path.replace('/index.html', '');
    }
    // If path matches a directory-like structure, use it as base
    return path.replace(/\/$/, '');
  }

  var basePath = '';

  /**
   * Resolve the current route from the URL
   */
  function getCurrentRouteFromURL() {
    var path = window.location.pathname;
    // Strip basePath
    if (basePath && path.indexOf(basePath) === 0) {
      path = path.slice(basePath.length);
    }
    // Normalize
    if (!path || path === '/index.html') path = '/';
    if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);
    return ROUTES[path] ? path : '/';
  }

  /**
   * Navigate to a route
   */
  function navigateTo(route, pushState) {
    if (pushState === undefined) pushState = true;

    var sectionId = ROUTES[route];
    if (!sectionId) {
      route = '/';
      sectionId = 'hero';
    }

    var title = TITLES[route] || 'Srappi';
    document.title = title;

    // Push state (only if it's a new route)
    if (pushState && route !== currentRoute) {
      var fullPath = basePath + (route === '/' ? '/' : route);
      window.history.pushState({ route: route }, title, fullPath);
    }

    currentRoute = route;

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(function (link) {
      link.classList.remove('active');
      if (link.getAttribute('data-route') === route) {
        link.classList.add('active');
      }
    });

    // Scroll to section
    var section = document.getElementById(sectionId);
    if (section) {
      var offset = route === '/' ? 0 : section.offsetTop - 78;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }

    // Push virtual pageview to GTM dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'spa_pageview',
      page: {
        path: route,
        title: title,
        url: window.location.origin + basePath + route
      }
    });

    // Dispatch custom event for Salesforce Data360 SDK
    window.dispatchEvent(new CustomEvent('spa:pageview', {
      detail: {
        route: route,
        sectionId: sectionId,
        title: title,
        url: window.location.origin + basePath + route
      }
    }));

    console.log('[Router] Navigated to:', route, '→ section:', sectionId);
  }

  /**
   * Handle clicks on route links
   */
  function handleRouteClick(e) {
    var link = e.target.closest('[data-route]');
    if (!link) return;

    // Don't intercept external links or special modifiers
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;

    e.preventDefault();
    var route = link.getAttribute('data-route');
    navigateTo(route);
  }

  /**
   * Handle browser back/forward
   */
  window.addEventListener('popstate', function (e) {
    var route = '/';
    if (e.state && e.state.route) {
      route = e.state.route;
    } else {
      route = getCurrentRouteFromURL();
    }
    navigateTo(route, false);
  });

  /**
   * Update route on scroll (keeps URL in sync with visible section)
   */
  var scrollTimeout;
  var isNavigating = false;

  function updateRouteOnScroll() {
    if (isNavigating) return;

    var sections = document.querySelectorAll('section[id]');
    var found = null;

    sections.forEach(function (sec) {
      var top = sec.offsetTop - 150;
      var bot = top + sec.offsetHeight;
      if (window.scrollY >= top && window.scrollY < bot) {
        found = sec.id;
      }
    });

    if (found && SECTION_TO_ROUTE[found]) {
      var route = SECTION_TO_ROUTE[found];
      if (route !== currentRoute) {
        currentRoute = route;
        var title = TITLES[route] || 'Srappi';
        document.title = title;
        var fullPath = basePath + (route === '/' ? '/' : route);
        window.history.replaceState({ route: route }, title, fullPath);

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('data-route') === route) {
            link.classList.add('active');
          }
        });

        // Push virtual pageview to GTM dataLayer
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'spa_pageview',
          page: {
            path: route,
            title: title,
            url: window.location.origin + basePath + route
          }
        });

        // Dispatch custom event for Salesforce Data360 SDK
        window.dispatchEvent(new CustomEvent('spa:pageview', {
          detail: {
            route: route,
            sectionId: found,
            title: title,
            url: window.location.origin + basePath + route
          }
        }));

        console.log('[Router] Scroll → route updated:', route);
      }
    }
  }

  window.addEventListener('scroll', function () {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateRouteOnScroll, 150);
  });

  /**
   * Init: detect basePath, bind clicks, navigate to initial route
   */
  function init() {
    // Detect basePath for subdirectory deploys
    var path = window.location.pathname;
    var knownRoutes = Object.keys(ROUTES).filter(function (r) { return r !== '/'; });
    var foundRoute = false;
    for (var i = 0; i < knownRoutes.length; i++) {
      if (path.endsWith(knownRoutes[i])) {
        basePath = path.slice(0, path.length - knownRoutes[i].length);
        foundRoute = true;
        break;
      }
    }
    if (!foundRoute) {
      // Check if it looks like a base path with index.html or trailing slash
      basePath = path.replace(/\/index\.html$/, '').replace(/\/$/, '');
      // If basePath is just '/', set it to empty
      if (basePath === '') basePath = '';
    }

    // Bind all route links
    document.addEventListener('click', handleRouteClick);

    // Initial navigation
    var initialRoute = getCurrentRouteFromURL();
    navigateTo(initialRoute, false);

    // Replace current history state
    var fullPath = basePath + (initialRoute === '/' ? '/' : initialRoute);
    window.history.replaceState({ route: initialRoute }, document.title, fullPath);

    console.log('[Router] Initialized | basePath:', basePath, '| route:', initialRoute);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
