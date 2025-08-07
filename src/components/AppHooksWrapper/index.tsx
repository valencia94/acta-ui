import { App } from '~/components/App';
import { useThemedFavicon } from '~/hooks/useThemedFavicon';

export const AppHooksWrapper = (): JSX.Element => {
  useThemedFavicon();

  return <App />;
};
