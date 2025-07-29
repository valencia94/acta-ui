// src/components/App/index.stories.tsx
import { Meta, StoryFn } from "@storybook/react";

import { App } from "./";

export default {
  title: "Components/App",
  component: App,
} as Meta;

const Template: StoryFn = () => <App />;

export const Primary = Template.bind({});
