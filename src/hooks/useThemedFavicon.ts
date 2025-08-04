import { useEffect } from 'react';

export const useThemedFavicon = () => {
  useEffect(() => {
    const matcher = window.matchMedia('(prefers-color-scheme: dark)');
    const lightIcon = document.querySelector<HTMLLinkElement>('#fav-light');
    const darkIcon = document.querySelector<HTMLLinkElement>('#fav-dark');

    const updateIcon = () => {
      if (!lightIcon || !darkIcon) return;
      if (matcher.matches) {
        lightIcon.remove();
        document.head.append(darkIcon);
      } else {
        document.head.append(lightIcon);
        darkIcon.remove();
      }
    };

    matcher.addEventListener('change', updateIcon);
    updateIcon();

    return () => matcher.removeEventListener('change', updateIcon);
  }, []);
};
