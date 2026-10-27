import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

// Router Context
const RouterContext = createContext({
  pathname: window.location.pathname,
  search: window.location.search,
  hash: window.location.hash,
  navigate: () => {},
  params: {}
});

export function BrowserRouter({ children }) {
  const [location, setLocation] = useState({
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash
  });

  const [params, setParamsState] = useState({});

  const setParams = useCallback((newParams = {}) => {
    setParamsState((prevParams) => {
      const prevKeys = Object.keys(prevParams || {});
      const newKeys = Object.keys(newParams || {});

      if (prevKeys.length !== newKeys.length) {
        return newParams;
      }

      for (const key of newKeys) {
        if (prevParams[key] !== newParams[key]) {
          return newParams;
        }
      }

      return prevParams;
    });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setLocation({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to, options = {}) => {
    if (typeof to === 'number') {
      window.history.go(to);
      return;
    }

    if (to !== window.location.pathname) {
      if (options.replace) {
        window.history.replaceState({}, '', to);
      } else {
        window.history.pushState({}, '', to);
      }
      setLocation({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash
      });
      window.scrollTo(0, 0);
    }
  }, []);

  const contextValue = useMemo(() => ({
    ...location,
    navigate,
    params,
    setParams
  }), [location, navigate, params]);

  return (
    <RouterContext.Provider value={contextValue}>
      {children}
    </RouterContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(RouterContext);
  return {
    pathname: context.pathname,
    search: context.search,
    hash: context.hash
  };
}

export function useNavigate() {
  const context = useContext(RouterContext);
  return context.navigate;
}

export function useParams() {
  const context = useContext(RouterContext);
  return context.params || {};
}

// Pattern matching for routes like /users/:id
function matchPath(pattern, pathname) {
  if (pattern === '*') return { matches: true, params: {} };
  if (pattern === pathname) return { matches: true, params: {} };

  const patternParts = pattern.split('/').filter(Boolean);
  const pathnameParts = pathname.split('/').filter(Boolean);

  if (patternParts.length !== pathnameParts.length) {
    return { matches: false, params: {} };
  }

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    const pPart = patternParts[i];
    const pathPart = pathnameParts[i];

    if (pPart.startsWith(':')) {
      const paramName = pPart.slice(1);
      params[paramName] = pathPart;
    } else if (pPart !== pathPart) {
      return { matches: false, params: {} };
    }
  }

  return { matches: true, params };
}

export function Routes({ children }) {
  const { pathname, setParams } = useContext(RouterContext);

  const matchedRoute = useMemo(() => {
    const childArray = React.Children.toArray(children);
    
    for (const child of childArray) {
      if (!React.isValidElement(child)) continue;
      const { path, element } = child.props;
      
      const { matches, params } = matchPath(path, pathname);
      if (matches) {
        return { element, params };
      }
    }

    return null;
  }, [children, pathname]);

  useEffect(() => {
    if (matchedRoute && matchedRoute.params) {
      setParams(matchedRoute.params);
    }
  }, [matchedRoute, setParams]);

  if (!matchedRoute) return null;
  return matchedRoute.element;
}

export function Route({ path, element }) {
  return null; // Logic is handled inside Routes
}

export function Navigate({ to, replace = true }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, [to, replace, navigate]);
  return null;
}

export function Link({ to, children, className = '', style = {}, onClick, ...rest }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.altKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      navigate(to);
    }
  };

  return (
    <a href={to} className={className} style={style} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

export function NavLink({ to, children, className = '', style = {}, activeClassName = 'active', ...rest }) {
  const { pathname } = useLocation();
  const isActive = pathname === to || (to !== '/' && pathname.startsWith(to));

  const resolvedClass = typeof className === 'function' 
    ? className({ isActive })
    : `${className} ${isActive ? activeClassName : ''}`.trim();

  return (
    <Link to={to} className={resolvedClass} style={style} {...rest}>
      {children}
    </Link>
  );
}
