// src/components/LoadingMessage/index.stories.tsx
import { Meta, Story } from '@storybook/react';
import { LoadingMessage, LoadingMessageProps } from './';

export default {
  title: 'Components/LoadingMessage',
  component: LoadingMessage,
} as Meta<LoadingMessageProps>;

const Template: Story<LoadingMessageProps> = (args) => (
  <div style={{ padding: '1rem', background: '#f9f9f9' }}>
    <LoadingMessage {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  message: 'Loading projects...',
};
