// src/components/App/index.stories.tsx
import { Meta, Story } from '@storybook/react';
import { App } from './';

export default {
  title: 'Components/App',
  component: App,
} as Meta;

const Template: Story = () => <App />;

export const Primary = Template.bind({});
